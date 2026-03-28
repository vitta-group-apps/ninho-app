/**
 * DiaperScreen — Full-screen diaper registration and edit flow.
 *
 * Contrato novo:
 * - payload estruturado em routine_logs.payload
 * - notes humano em routine_logs.notes
 * - leitura via toRoutineRecord
 * - escrita via serializeRoutinePayload
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { toast } from '@/hooks/use-toast';
import { getUserNotes } from '@/lib/routineUtils';
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
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E5E0D8';
const TXT = '#2C2C2C';
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

function inferKindFromPayload(payload: DiaperPayload): DiaperKind | null {
  const pee = payload.pee === true;
  const poop = payload.poop === true;

  if (pee && poop) return 'both';
  if (pee) return 'pee';
  if (poop) return 'poop';
  return null;
}

export default function DiaperScreen() {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId?: string }>();
  const isEdit = Boolean(logId);

  const { user } = useAuth();
  const { activeChildId, activeChild } = useActiveChild();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [existingLog, setExistingLog] = useState<RoutineRecord<'diaper'> | null>(null);

  const [kind, setKind] = useState<DiaperKind | null>(null);
  const [quantity, setQuantity] = useState('');
  const [peeColor, setPeeColor] = useState('');
  const [poopColor, setPoopColor] = useState('');
  const [texture, setTexture] = useState('');
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

  useEffect(() => {
    if (!isEdit || !logId) return;

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

        setExistingLog(record);
        resetFields(record);
      }

      setLoading(false);
    })();
  }, [isEdit, logId]);

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

  const showPee = kind === 'pee' || kind === 'both';
  const showPoop = kind === 'poop' || kind === 'both';

  async function handleSave() {
    if (!kind) {
      toast({
        title: 'Selecione o tipo de fralda',
        variant: 'destructive',
      });
      return;
    }

    if (!user || !activeChildId) return;

    setSaving(true);

    try {
      const nextPayload: DiaperPayload = {
        pee: kind === 'pee' || kind === 'both',
        poop: kind === 'poop' || kind === 'both',
        quantity: quantity || null,
        peeColor: showPee ? peeColor || null : null,
        poopColor: showPoop ? poopColor || null : null,
        poopTexture: showPoop ? texture || null : null,
        includeInReport: includeInReport || null,
      };

      if (isEdit && existingLog) {
        const { error } = await supabase
          .from('routine_logs')
          .update({
            payload: serializeRoutinePayload('diaper', nextPayload) as unknown as import('@/integrations/supabase/types').Json,
            notes: notes.trim() || null,
          })
          .eq('id', existingLog.id);

        if (error) throw error;

        toast({ title: '✓ Alterações salvas' });
      } else {
        const { error } = await supabase.from('routine_logs').insert({
          child_id: activeChildId,
          author_id: user.id,
          type: 'diaper',
          start_time: new Date().toISOString(),
          payload: serializeRoutinePayload('diaper', nextPayload),
          notes: notes.trim() || null,
        });

        if (error) throw error;

        toast({
          title: `🧷 Fralda registrada — ${DIAPER_KIND_LABEL[kind]}`,
        });
      }

      navigate(-1);
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

  const ctaLabel = saving
    ? 'Salvando...'
    : isEdit
    ? 'Salvar alterações'
    : kind
    ? `Registrar fralda — ${DIAPER_KIND_LABEL[kind]}`
    : 'Selecione o tipo';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: PAGE_BG }}>
      <ScreenHeader
        title={isEdit ? 'Editar fralda' : 'Registrar fralda'}
        childName={activeChild?.name}
      />

      <div className="ds-form-body">
        <div className="space-y-6">
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
                      boxShadow: isActive ? `0 2px 8px rgba(200,137,74,0.18)` : 'none',
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

          <AnimatePresence>
            {kind && (
              <motion.div
                key="fields"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
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
        </div>
      </div>

      <StickyFooterCTA
        primaryLabel={ctaLabel}
        onPrimary={handleSave}
        primaryDisabled={!kind}
        primaryLoading={saving}
        primaryColor={kind ? DIAPER_COLOR : undefined}
      />
    </div>
  );
}
