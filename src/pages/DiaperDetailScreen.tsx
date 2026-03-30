/**
 * DiaperDetailScreen — READ-ONLY + INLINE EDIT detail view for a diaper event.
 *
 * Route: /diaper/detail/:logId
 *
 * Contrato novo:
 * - payload estruturado em routine_logs.payload
 * - notes humano em routine_logs.notes
 * - leitura via toRoutineRecord(...)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { getUserNotes, fmtTime } from '@/lib/routineUtils';
import type { RoutineRecord, DiaperPayload } from '@/lib/contracts/routine';
import { toRoutineRecord, serializeRoutinePayload } from '@/lib/adapters/routineAdapters';
import {
  DIAPER_KIND_LABEL,
  DIAPER_QUANTITY_LABEL,
  DIAPER_PEE_COLOR_LABEL,
  DIAPER_POOP_COLOR_LABEL,
  DIAPER_TEXTURE_LABEL,
  isDiaperSignificant,
} from '@/lib/eventSystem';
import {
  ScreenHeader,
  StickyFooterCTA,
  SectionLabel,
  ChipGroup,
  ReportToggle,
} from '@/components/ds';

// ── Cores fixas ──
const DIAPER_COLOR = '#C8894A';
const DIAPER_BG = '#FDF3E9';
const DIAPER_BORDER = '#f0d5b0';
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E5E0D8';
const PAGE_BG = '#F8F5F0';
const TXT = '#2C2C2C';
const TXT_MUTED = '#7A7A7A';

type DiaperKind = 'pee' | 'poop' | 'both';

const KIND_OPTIONS: { value: DiaperKind; label: string }[] = [
  { value: 'pee', label: '💛 Xixi' },
  { value: 'poop', label: '💩 Cocô' },
  { value: 'both', label: '🔄 Xixi + Cocô' },
];

const QUANTITY_OPTIONS = Object.entries(DIAPER_QUANTITY_LABEL).map(([value, label]) => ({
  value,
  label,
}));

const PEE_COLOR_OPTIONS = Object.entries(DIAPER_PEE_COLOR_LABEL).map(([value, label]) => ({
  value,
  label,
}));

const POOP_COLOR_OPTIONS = Object.entries(DIAPER_POOP_COLOR_LABEL).map(([value, label]) => ({
  value,
  label,
}));

const TEXTURE_OPTIONS = Object.entries(DIAPER_TEXTURE_LABEL).map(([value, label]) => ({
  value,
  label,
}));

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div
      className="flex items-start justify-between gap-4 py-3 last:border-0"
      style={{ borderBottom: `1px solid ${CARD_BORDER}` }}
    >
      <p
        className="text-[13px] font-nunito flex-shrink-0"
        style={{ color: TXT_MUTED }}
      >
        {label}
      </p>
      <p
        className="text-[13px] font-semibold font-nunito text-right"
        style={{ color: TXT }}
      >
        {value}
      </p>
    </div>
  );
}

export default function DiaperDetailScreen() {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId: string }>();

  const [log, setLog] = useState<RoutineRecord<'diaper'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [kind, setKind] = useState<DiaperKind>('pee');
  const [quantity, setQuantity] = useState('');
  const [peeColor, setPeeColor] = useState('');
  const [poopColor, setPoopColor] = useState('');
  const [texture, setTexture] = useState('');
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

  useEffect(() => {
    if (!logId) return;

    (async () => {
      const { data, error } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('id', logId)
        .eq('type', 'diaper')
        .maybeSingle();

      if (!error && data) {
        const record = toRoutineRecord({
          ...data,
          type: 'diaper',
        });

        setLog(record);
        loadFields(record);
      }

      setLoading(false);
    })();
  }, [logId]);

  function inferKind(payload: DiaperPayload): DiaperKind {
    if (payload.pee === true && payload.poop === true) return 'both';
    if (payload.poop === true) return 'poop';
    return 'pee';
  }

  function loadFields(data: RoutineRecord<'diaper'>) {
    const payload = (data.payload ?? {}) as DiaperPayload;

    setKind(inferKind(payload));
    setQuantity(typeof payload.quantity === 'string' ? payload.quantity : '');
    setPeeColor(typeof payload.peeColor === 'string' ? payload.peeColor : '');
    setPoopColor(typeof payload.poopColor === 'string' ? payload.poopColor : '');
    setTexture(typeof payload.poopTexture === 'string' ? payload.poopTexture : '');
    setNotes(getUserNotes(data.notes) ?? '');
    setIncludeInReport(Boolean(payload.includeInReport));
  }

  async function handleSave() {
    if (!log) return;

    setSaving(true);

    try {
      const nextPayload: DiaperPayload = {
        pee: kind === 'pee' || kind === 'both',
        poop: kind === 'poop' || kind === 'both',
        quantity: quantity || null,
        peeColor: kind === 'pee' || kind === 'both' ? peeColor || null : null,
        poopColor: kind === 'poop' || kind === 'both' ? poopColor || null : null,
        poopTexture: kind === 'poop' || kind === 'both' ? texture || null : null,
        includeInReport: includeInReport || null,
      };

      const { error } = await supabase
        .from('routine_logs')
        .update({
          payload: serializeRoutinePayload('diaper', nextPayload) as unknown as Json,
          notes: notes.trim() || null,
        })
        .eq('id', log.id);

      if (error) throw error;

      toast({ title: '✓ Alterações salvas' });
      setIsEditing(false);

      const { data, error: reloadError } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('id', log.id)
        .eq('type', 'diaper')
        .maybeSingle();

      if (!reloadError && data) {
        const record = toRoutineRecord({
          ...data,
          type: 'diaper',
        });

        setLog(record);
        loadFields(record);
      }
    } catch (e: unknown) {
      toast({
        title: 'Erro ao salvar',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: DIAPER_COLOR }}
        />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: PAGE_BG }}>
        <ScreenHeader title="Fralda" onBack={() => navigate(-1)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm font-nunito" style={{ color: TXT_MUTED }}>
            Registro não encontrado.
          </p>
        </div>
      </div>
    );
  }

  const payload = (log.payload ?? {}) as DiaperPayload;
  const readKind = inferKind(payload);
  const kindLabel = DIAPER_KIND_LABEL[readKind] ?? 'Fralda';

  const quantityLabel =
    typeof payload.quantity === 'string'
      ? DIAPER_QUANTITY_LABEL[payload.quantity] ?? payload.quantity
      : null;

  const peeColorLabel =
    typeof payload.peeColor === 'string'
      ? DIAPER_PEE_COLOR_LABEL[payload.peeColor] ?? payload.peeColor
      : null;

  const poopColorLabel =
    typeof payload.poopColor === 'string'
      ? DIAPER_POOP_COLOR_LABEL[payload.poopColor] ?? payload.poopColor
      : null;

  const textureLabel =
    typeof payload.poopTexture === 'string'
      ? DIAPER_TEXTURE_LABEL[payload.poopTexture] ?? payload.poopTexture
      : null;

  const notesRead = getUserNotes(log.notes);
  const includeRead = Boolean(payload.includeInReport);

  const showPee = kind === 'pee' || kind === 'both';
  const showPoop = kind === 'poop' || kind === 'both';

  const significant = isDiaperSignificant({
    pee: payload.pee,
    poop: payload.poop,
    peeColor: typeof payload.peeColor === 'string' ? payload.peeColor : null,
    poopColor: typeof payload.poopColor === 'string' ? payload.poopColor : null,
    poopTexture: typeof payload.poopTexture === 'string' ? payload.poopTexture : null,
    quantity: typeof payload.quantity === 'string' ? payload.quantity : null,
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: PAGE_BG }}>
      <ScreenHeader
        title="Fralda"
        onBack={() => {
          if (isEditing) {
            loadFields(log);
            setIsEditing(false);
          } else {
            navigate(-1);
          }
        }}
      />

      <div className="ds-form-body">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: DIAPER_BG,
              border: `1.5px solid ${DIAPER_BORDER}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
                style={{ backgroundColor: '#fde8d0' }}
              >
                🧷
              </div>

              <div>
                <p
                  className="text-[14px] font-bold font-quicksand leading-tight"
                  style={{ color: TXT }}
                >
                  {kindLabel}
                </p>
                <p
                  className="text-[12px] font-semibold font-nunito mt-0.5"
                  style={{ color: TXT_MUTED }}
                >
                  {fmtTime(log.startTime)}
                  {quantityLabel ? ` · ${quantityLabel}` : ''}
                </p>
              </div>
            </div>
          </div>

          {!isEditing && significant && (
            <div
              className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: '#FFF8F0', border: `1px solid ${DIAPER_BORDER}` }}
            >
              <span className="text-[12px] flex-shrink-0">ℹ️</span>
              <p
                className="text-[11px] font-nunito leading-snug"
                style={{ color: '#7a5030' }}
              >
                Esta troca tem informações que podem ser úteis em uma consulta médica.
              </p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div
                key="read"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  className="rounded-2xl px-4 overflow-hidden"
                  style={{
                    backgroundColor: CARD_BG,
                    border: `1px solid ${CARD_BORDER}`,
                  }}
                >
                  <DetailRow label="Tipo" value={kindLabel} />
                  <DetailRow label="Quantidade" value={quantityLabel} />
                  <DetailRow label="Cor do xixi" value={peeColorLabel} />
                  <DetailRow label="Cor do cocô" value={poopColorLabel} />
                  <DetailRow label="Consistência" value={textureLabel} />
                  <DetailRow label="Observações" value={notesRead ?? null} />
                  {includeRead && (
                    <DetailRow label="Relatório médico" value="Incluído" />
                  )}
                </div>

                {!quantityLabel &&
                  !peeColorLabel &&
                  !poopColorLabel &&
                  !textureLabel &&
                  !notesRead && (
                    <p
                      className="text-center text-[13px] font-nunito py-2"
                      style={{ color: TXT_MUTED }}
                    >
                      Nenhuma informação adicional registrada.
                    </p>
                  )}
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                <div>
                  <SectionLabel>O que tinha na fralda?</SectionLabel>
                  <ChipGroup
                    options={KIND_OPTIONS}
                    value={kind}
                    onToggle={v => setKind(v as DiaperKind)}
                    accentColor={DIAPER_COLOR}
                  />
                </div>

                <div>
                  <SectionLabel>Quantidade</SectionLabel>
                  <ChipGroup
                    options={QUANTITY_OPTIONS}
                    value={quantity}
                    onToggle={v => setQuantity(prev => (prev === v ? '' : v))}
                    accentColor={DIAPER_COLOR}
                  />
                </div>

                {showPee && (
                  <div>
                    <SectionLabel>Cor do xixi</SectionLabel>
                    <ChipGroup
                      options={PEE_COLOR_OPTIONS}
                      value={peeColor}
                      onToggle={v => setPeeColor(prev => (prev === v ? '' : v))}
                      accentColor={DIAPER_COLOR}
                    />
                  </div>
                )}

                {showPoop && (
                  <>
                    <div>
                      <SectionLabel>Cor do cocô</SectionLabel>
                      <ChipGroup
                        options={POOP_COLOR_OPTIONS}
                        value={poopColor}
                        onToggle={v => setPoopColor(prev => (prev === v ? '' : v))}
                        accentColor={DIAPER_COLOR}
                      />
                    </div>

                    <div>
                      <SectionLabel>Consistência</SectionLabel>
                      <ChipGroup
                        options={TEXTURE_OPTIONS}
                        value={texture}
                        onToggle={v => setTexture(prev => (prev === v ? '' : v))}
                        accentColor={DIAPER_COLOR}
                      />
                    </div>
                  </>
                )}

                <div>
                  <SectionLabel>Observações</SectionLabel>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Alguma observação sobre esta fralda..."
                    className="ds-textarea"
                    rows={3}
                  />
                </div>

                <ReportToggle
                  checked={includeInReport}
                  onCheckedChange={setIncludeInReport}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {!isEditing ? (
        <StickyFooterCTA
          primaryLabel="Editar"
          onPrimary={() => setIsEditing(true)}
          primaryColor={DIAPER_COLOR}
        />
      ) : (
        <StickyFooterCTA
          primaryLabel={saving ? 'Salvando...' : 'Salvar alterações'}
          onPrimary={handleSave}
          primaryLoading={saving}
          primaryColor={DIAPER_COLOR}
          secondaryLabel="Cancelar"
          onSecondary={() => {
            loadFields(log);
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
}