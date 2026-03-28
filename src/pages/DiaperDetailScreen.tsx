/**
 * DiaperDetailScreen — READ-ONLY detail view for a diaper event.
 *
 * Route: /diaper/detail/:logId
 *
 * Contrato novo:
 * - payload estruturado em routine_logs.payload
 * - notes humano em routine_logs.notes
 * - leitura via toRoutineRecord
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getUserNotes, fmtTime } from '@/lib/routineUtils';
import type { RoutineRecord, DiaperPayload } from '@/lib/contracts/routine';
import {
  DIAPER_KIND_LABEL,
  DIAPER_QUANTITY_LABEL,
  DIAPER_PEE_COLOR_LABEL,
  DIAPER_POOP_COLOR_LABEL,
  DIAPER_TEXTURE_LABEL,
} from '@/lib/eventSystem';
import {
  toRoutineRecord,
  serializeRoutinePayload,
} from '@/lib/adapters/routineAdapters';
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
const TXT = '#2C2C2C';
const TXT_MUTED = '#7A7A7A';
const PAGE_BG = '#F8F5F0';

type DiaperKind = 'pee' | 'poop' | 'both';

const KIND_OPTIONS: { kind: DiaperKind; emoji: string; label: string }[] = [
  { kind: 'pee', emoji: '💛', label: 'Xixi' },
  { kind: 'poop', emoji: '💩', label: 'Cocô' },
  { kind: 'both', emoji: '🔄', label: 'Xixi + Cocô' },
];

const QUANTITY_OPTIONS = Object.entries(DIAPER_QUANTITY_LABEL).map(
  ([value, label]) => ({ value, label })
);
const PEE_COLOR_OPTIONS = Object.entries(DIAPER_PEE_COLOR_LABEL).map(
  ([value, label]) => ({ value, label })
);
const POOP_COLOR_OPTIONS = Object.entries(DIAPER_POOP_COLOR_LABEL).map(
  ([value, label]) => ({ value, label })
);
const TEXTURE_OPTIONS = Object.entries(DIAPER_TEXTURE_LABEL).map(
  ([value, label]) => ({ value, label })
);

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

function inferKindFromPayload(payload: DiaperPayload): DiaperKind | null {
  const pee = payload.pee === true;
  const poop = payload.poop === true;

  if (pee && poop) return 'both';
  if (pee) return 'pee';
  if (poop) return 'poop';
  return null;
}

export default function DiaperDetailScreen() {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId: string }>();

  const [log, setLog] = useState<RoutineRecord<'diaper'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [kind, setKind] = useState<DiaperKind | null>(null);
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
        resetFields(record);
      }

      setLoading(false);
    })();
  }, [logId]);

  function resetFields(logData: RoutineRecord<'diaper'>) {
    const payload = (logData.payload ?? {}) as DiaperPayload;

    setKind(inferKindFromPayload(payload));
    setQuantity(payload.quantity ?? '');
    setPeeColor(payload.peeColor ?? '');
    setPoopColor(payload.poopColor ?? '');
    setTexture(payload.poopTexture ?? '');
    setNotes(getUserNotes(logData.notes) ?? '');
    setIncludeInReport(Boolean(payload.includeInReport));
  }

  async function handleSave() {
    if (!log || !kind) {
      toast({
        title: 'Selecione o tipo de fralda',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const nextPayload: DiaperPayload = {
        pee: kind === 'pee' || kind === 'both',
        poop: kind === 'poop' || kind === 'both',
        quantity: quantity || null,
        peeColor: kind === 'pee' || kind === 'both' ? peeColor || null : null,
        poopColor: kind === 'poop' || kind === 'both' ? poopColor || null : null,
        poopTexture:
          kind === 'poop' || kind === 'both' ? texture || null : null,
        includeInReport: includeInReport || null,
      };

      const { error } = await supabase
        .from('routine_logs')
        .update({
          payload: serializeRoutinePayload('diaper', nextPayload),
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
        resetFields(record);
      }
    } catch (e: unknown) {
      toast({
        title: 'Erro ao salvar',
        description:
          e instanceof Error ? e.message : 'Tente novamente',
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

  const kindKey = inferKindFromPayload(payload);
  const kindLabel = kindKey ? DIAPER_KIND_LABEL[kindKey] ?? 'Fralda' : 'Fralda';
  const kindEmoji =
    kindKey === 'pee' ? '💛' : kindKey === 'poop' ? '💩' : kindKey === 'both' ? '🔄' : '🧷';

  const quantityLabel = payload.quantity
    ? DIAPER_QUANTITY_LABEL[payload.quantity] ?? payload.quantity
    : null;

  const peeColorLabel = payload.peeColor
    ? DIAPER_PEE_COLOR_LABEL[payload.peeColor] ?? payload.peeColor
    : null;

  const poopColorLabel = payload.poopColor
    ? DIAPER_POOP_COLOR_LABEL[payload.poopColor] ?? payload.poopColor
    : null;

  const textureLabel = payload.poopTexture
    ? DIAPER_TEXTURE_LABEL[payload.poopTexture] ?? payload.poopTexture
    : null;

  const readNotes = getUserNotes(log.notes);
  const readInclude = Boolean(payload.includeInReport);

  const readShowPee = payload.pee === true;
  const readShowPoop = payload.poop === true;
  const showPee = kind === 'pee' || kind === 'both';
  const showPoop = kind === 'poop' || kind === 'both';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: PAGE_BG }}>
      <ScreenHeader
        title="Fralda"
        onBack={() => {
          if (isEditing) {
            resetFields(log);
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
                {kindEmoji}
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
                  {readShowPee && (
                    <DetailRow label="Cor do xixi" value={peeColorLabel} />
                  )}
                  {readShowPoop && (
                    <DetailRow label="Cor do cocô" value={poopColorLabel} />
                  )}
                  {readShowPoop && (
                    <DetailRow label="Consistência" value={textureLabel} />
                  )}
                  <DetailRow label="Observações" value={readNotes ?? null} />
                  {readInclude && (
                    <DetailRow label="Relatório médico" value="Incluído" />
                  )}
                </div>

                {!quantityLabel &&
                  !peeColorLabel &&
                  !poopColorLabel &&
                  !textureLabel &&
                  !readNotes && (
                    <p
                      className="text-center text-[13px] font-nunito py-4"
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

                  <div className="flex gap-3">
                    {KIND_OPTIONS.map(opt => {
                      const isActive = kind === opt.kind;

                      return (
                        <button
                          key={opt.kind}
                          onClick={() => setKind(opt.kind)}
                          className="flex-1 flex flex-col items-center gap-2 py-4 px-2 rounded-2xl font-bold transition-all active:scale-95 font-nunito"
                          style={{
                            backgroundColor: isActive ? DIAPER_BG : CARD_BG,
                            border: `2px solid ${isActive ? DIAPER_COLOR : CARD_BORDER}`,
                            boxShadow: isActive
                              ? '0 2px 8px rgba(200,137,74,0.18)'
                              : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <span className="text-[24px]">{opt.emoji}</span>
                          <p
                            className="text-[12px] font-bold leading-tight text-center"
                            style={{ color: isActive ? DIAPER_COLOR : TXT }}
                          >
                            {opt.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px" style={{ backgroundColor: CARD_BORDER }} />

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
                  <div className="space-y-4">
                    <div>
                      <SectionLabel>Cor do cocô</SectionLabel>
                      <ChipGroup
                        options={POOP_COLOR_OPTIONS}
                        value={poopColor}
                        onToggle={v =>
                          setPoopColor(prev => (prev === v ? '' : v))
                        }
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
                  </div>
                )}

                <div className="h-px" style={{ backgroundColor: CARD_BORDER }} />

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
          primaryDisabled={!kind}
          primaryColor={DIAPER_COLOR}
          secondaryLabel="Cancelar"
          onSecondary={() => {
            resetFields(log);
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
}
