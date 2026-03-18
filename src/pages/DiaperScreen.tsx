/**
 * DiaperScreen — Full-screen diaper registration and edit flow.
 * DS v2: uses ScreenHeader, StickyFooterCTA, SectionLabel, ChipGroup, ReportToggle.
 *
 * No gradient buttons. Solid primary. Chips always wrap.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { toast } from '@/hooks/use-toast';
import { parsePayload, makePayloadNotes, getUserNotes } from '@/lib/routineUtils';
import type { RoutineLog } from '@/lib/eventSystem';
import {
  DIAPER_KIND_LABEL,
  DIAPER_QUANTITY_LABEL,
  DIAPER_PEE_COLOR_LABEL,
  DIAPER_POOP_COLOR_LABEL,
  DIAPER_TEXTURE_LABEL,
} from '@/lib/eventSystem';
import {
  ScreenHeader,
  StickyFooterCTA,
  SectionLabel,
  ChipGroup,
  ReportToggle,
} from '@/components/ds';

// ─── Types / options ──────────────────────────────────────────────────────────

type DiaperKind = 'pee' | 'poop' | 'both';

const KIND_OPTIONS: { kind: DiaperKind; emoji: string; label: string }[] = [
  { kind: 'pee',  emoji: '💛', label: 'Xixi' },
  { kind: 'poop', emoji: '💩', label: 'Cocô' },
  { kind: 'both', emoji: '🔄', label: 'Xixi + Cocô' },
];

const QUANTITY_OPTIONS = Object.entries(DIAPER_QUANTITY_LABEL).map(([v, l]) => ({ value: v, label: l }));
const PEE_COLOR_OPTIONS = Object.entries(DIAPER_PEE_COLOR_LABEL).map(([v, l]) => ({ value: v, label: l }));
const POOP_COLOR_OPTIONS = Object.entries(DIAPER_POOP_COLOR_LABEL).map(([v, l]) => ({ value: v, label: l }));
const TEXTURE_OPTIONS = Object.entries(DIAPER_TEXTURE_LABEL).map(([v, l]) => ({ value: v, label: l }));

// DS token for diaper accent
const DIAPER_COLOR = 'hsl(var(--color-diaper))';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DiaperScreen() {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId?: string }>();
  const isEdit = !!logId;

  const { user } = useAuth();
  const { activeChildId, activeChild } = useActiveChild();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [existingLog, setExistingLog] = useState<RoutineLog | null>(null);

  const [kind, setKind] = useState<DiaperKind | null>(null);
  const [quantity, setQuantity] = useState('');
  const [peeColor, setPeeColor] = useState('');
  const [poopColor, setPoopColor] = useState('');
  const [texture, setTexture] = useState('');
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

  // Load existing log when editing
  useEffect(() => {
    if (!isEdit || !logId) return;
    (async () => {
      const { data } = await supabase.from('routine_logs').select('*').eq('id', logId).maybeSingle();
      if (data) {
        setExistingLog(data);
        const p = parsePayload(data.notes);
        const k = String(p.kind ?? p.diaper_type ?? '') as DiaperKind;
        if (['pee', 'poop', 'both'].includes(k)) setKind(k);
        setQuantity(String(p.quantity ?? ''));
        setPeeColor(String(p.pee_color ?? ''));
        setPoopColor(String(p.poop_color ?? ''));
        setTexture(String(p.poop_texture ?? ''));
        setNotes(getUserNotes(data.notes) ?? '');
        setIncludeInReport(Boolean(p.include_in_report));
      }
      setLoading(false);
    })();
  }, [isEdit, logId]);

  const showPee  = kind === 'pee'  || kind === 'both';
  const showPoop = kind === 'poop' || kind === 'both';

  async function handleSave() {
    if (!kind) {
      toast({ title: 'Selecione o tipo de fralda', variant: 'destructive' });
      return;
    }
    if (!user || !activeChildId) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = { kind };
      if (quantity)               payload.quantity          = quantity;
      if (showPee  && peeColor)   payload.pee_color         = peeColor;
      if (showPoop && poopColor)  payload.poop_color        = poopColor;
      if (showPoop && texture)    payload.poop_texture      = texture;
      if (includeInReport)        payload.include_in_report = true;

      if (isEdit && existingLog) {
        const existing = parsePayload(existingLog.notes);
        const merged = { ...existing, ...payload };
        if (!quantity)      delete merged.quantity;
        if (!peeColor)      delete merged.pee_color;
        if (!poopColor)     delete merged.poop_color;
        if (!texture)       delete merged.poop_texture;
        if (!includeInReport) delete merged.include_in_report;

        const { error } = await supabase
          .from('routine_logs')
          .update({ notes: makePayloadNotes(merged, notes) })
          .eq('id', existingLog.id);
        if (error) throw error;
        toast({ title: '✓ Alterações salvas' });
      } else {
        const { error } = await supabase.from('routine_logs').insert({
          child_id: activeChildId,
          author_id: user.id,
          type: 'diaper',
          start_time: new Date().toISOString(),
          notes: makePayloadNotes(payload, notes),
        });
        if (error) throw error;
        toast({ title: `🧷 Fralda registrada — ${DIAPER_KIND_LABEL[kind]}` });
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-primary" />
      </div>
    );
  }

  const ctaLabel = saving
    ? 'Salvando...'
    : isEdit
    ? 'Salvar alterações'
    : kind
    ? `Registrar — ${DIAPER_KIND_LABEL[kind]}`
    : 'Selecione o tipo';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* DS Header */}
      <ScreenHeader
        title={isEdit ? 'Editar fralda' : 'Registrar fralda'}
        childName={activeChild?.name}
      />

      {/* Scrollable form */}
      <div className="ds-form-body">
        <div className="ds-section">

          {/* Kind selection — 3-column grid */}
          <div>
            <SectionLabel>Tipo de fralda</SectionLabel>
            <div className="grid grid-cols-3 gap-3">
              {KIND_OPTIONS.map(opt => {
                const isActive = kind === opt.kind;
                return (
                  <button
                    key={opt.kind}
                    onClick={() => setKind(opt.kind)}
                    className="flex flex-col items-center gap-2 py-5 rounded-2xl font-bold transition-all active:scale-95 font-nunito"
                    style={{
                      backgroundColor: isActive ? `color-mix(in srgb, ${DIAPER_COLOR} 12%, transparent)` : 'hsl(var(--card))',
                      border: `2px solid ${isActive ? DIAPER_COLOR : 'hsl(var(--border))'}`,
                      color: isActive ? DIAPER_COLOR : 'hsl(var(--foreground))',
                    }}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-xs font-bold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional fields — appear after kind selected */}
          <AnimatePresence>
            {kind && (
              <motion.div
                key="fields"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="ds-section"
              >
                {/* Quantity */}
                <div>
                  <SectionLabel>Quantidade</SectionLabel>
                  <ChipGroup
                    options={QUANTITY_OPTIONS}
                    value={quantity}
                    onToggle={v => setQuantity(p => p === v ? '' : v)}
                    accentColor={DIAPER_COLOR}
                  />
                </div>

                {/* Pee color */}
                {showPee && (
                  <div>
                    <SectionLabel>Cor do xixi</SectionLabel>
                    <ChipGroup
                      options={PEE_COLOR_OPTIONS}
                      value={peeColor}
                      onToggle={v => setPeeColor(p => p === v ? '' : v)}
                      accentColor={DIAPER_COLOR}
                    />
                  </div>
                )}

                {/* Poop color */}
                {showPoop && (
                  <div>
                    <SectionLabel>Cor do cocô</SectionLabel>
                    <ChipGroup
                      options={POOP_COLOR_OPTIONS}
                      value={poopColor}
                      onToggle={v => setPoopColor(p => p === v ? '' : v)}
                      accentColor={DIAPER_COLOR}
                    />
                  </div>
                )}

                {/* Poop texture */}
                {showPoop && (
                  <div>
                    <SectionLabel>Consistência</SectionLabel>
                    <ChipGroup
                      options={TEXTURE_OPTIONS}
                      value={texture}
                      onToggle={v => setTexture(p => p === v ? '' : v)}
                      accentColor={DIAPER_COLOR}
                    />
                  </div>
                )}

                {/* Observations */}
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

                {/* Medical report */}
                <ReportToggle
                  checked={includeInReport}
                  onCheckedChange={setIncludeInReport}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* DS sticky CTA */}
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
