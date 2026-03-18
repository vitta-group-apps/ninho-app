/**
 * DiaperScreen — Full-screen diaper registration and edit flow.
 *
 * Always opens full-screen (never a sheet).
 * Supports creation and edit modes via route state.
 *
 * Route: /diaper/new or /diaper/edit/:logId
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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

// ─── Types ───────────────────────────────────────────────────────────────────

type DiaperKind = 'pee' | 'poop' | 'both';

// ─── Option arrays ────────────────────────────────────────────────────────────

const KIND_OPTIONS: { kind: DiaperKind; emoji: string; label: string; desc: string }[] = [
  { kind: 'pee',  emoji: '💛', label: 'Xixi',     desc: 'Só urina' },
  { kind: 'poop', emoji: '💩', label: 'Cocô',     desc: 'Só fezes' },
  { kind: 'both', emoji: '🔄', label: 'Xixi + Cocô', desc: 'Urina e fezes' },
];

const QUANTITY_OPTIONS = Object.entries(DIAPER_QUANTITY_LABEL).map(([v, l]) => ({ value: v, label: l }));
const PEE_COLOR_OPTIONS = Object.entries(DIAPER_PEE_COLOR_LABEL).map(([v, l]) => ({ value: v, label: l }));
const POOP_COLOR_OPTIONS = Object.entries(DIAPER_POOP_COLOR_LABEL).map(([v, l]) => ({ value: v, label: l }));
const TEXTURE_OPTIONS = Object.entries(DIAPER_TEXTURE_LABEL).map(([v, l]) => ({ value: v, label: l }));

// ─── Colors (CSS vars via hsl) ────────────────────────────────────────────────

const ORANGE = 'hsl(32,80%,57%)';
const font = 'Nunito, sans-serif';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wider mb-2"
      style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
      {children}
    </p>
  );
}

function ChipRow({
  options, value, onToggle,
}: {
  options: { value: string; label: string }[];
  value: string;
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onToggle(opt.value)}
          className="py-2.5 px-4 rounded-2xl text-sm font-semibold transition-all active:scale-95"
          style={{
            backgroundColor: value === opt.value ? ORANGE : 'hsl(var(--card))',
            color: value === opt.value ? 'white' : 'hsl(var(--ninho-brown))',
            border: `1.5px solid ${value === opt.value ? ORANGE : 'hsl(var(--border))'}`,
            fontFamily: font,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

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

  // Form state
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
      if (quantity)                    payload.quantity      = quantity;
      if (showPee  && peeColor)        payload.pee_color     = peeColor;
      if (showPoop && poopColor)       payload.poop_color    = poopColor;
      if (showPoop && texture)         payload.poop_texture  = texture;
      if (includeInReport)             payload.include_in_report = true;

      if (isEdit && existingLog) {
        // Preserve existing payload fields (like kind/diaper_type)
        const existing = parsePayload(existingLog.notes);
        const merged = { ...existing, ...payload };
        if (!quantity)   delete merged.quantity;
        if (!peeColor)   delete merged.pee_color;
        if (!poopColor)  delete merged.poop_color;
        if (!texture)    delete merged.poop_texture;
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
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'hsl(var(--ninho-sage))' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-5 flex items-center gap-3"
        style={{
          paddingTop: 'max(52px, env(safe-area-inset-top))',
          paddingBottom: '16px',
          backgroundColor: 'hsl(var(--card))',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90"
          style={{ backgroundColor: 'hsl(var(--muted))' }}
        >
          <ArrowLeftIcon className="w-5 h-5" style={{ color: 'hsl(var(--ninho-brown))' }} />
        </button>
        <div>
          <p className="text-lg font-bold leading-tight"
            style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
            {isEdit ? 'Editar fralda' : 'Registrar fralda'}
          </p>
          {activeChild && (
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
              {activeChild.name}
            </p>
          )}
        </div>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-7"
        style={{ paddingBottom: 'max(96px, calc(env(safe-area-inset-bottom) + 96px))' }}>

        {/* Kind selection */}
        <div>
          <SectionLabel>Tipo de fralda</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            {KIND_OPTIONS.map(opt => {
              const isActive = kind === opt.kind;
              return (
                <button
                  key={opt.kind}
                  onClick={() => setKind(opt.kind)}
                  className="flex flex-col items-center gap-2 py-5 rounded-2xl font-bold transition-all active:scale-95"
                  style={{
                    backgroundColor: isActive ? `${ORANGE}15` : 'hsl(var(--card))',
                    border: `2px solid ${isActive ? ORANGE : 'hsl(var(--border))'}`,
                    color: isActive ? ORANGE : 'hsl(var(--ninho-brown))',
                  }}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-xs font-bold" style={{ fontFamily: font }}>{opt.label}</span>
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
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Quantity — always shown when kind selected */}
              <div>
                <SectionLabel>Quantidade</SectionLabel>
                <ChipRow
                  options={QUANTITY_OPTIONS}
                  value={quantity}
                  onToggle={v => setQuantity(p => p === v ? '' : v)}
                />
              </div>

              {/* Pee color */}
              {showPee && (
                <div>
                  <SectionLabel>Cor do xixi</SectionLabel>
                  <ChipRow
                    options={PEE_COLOR_OPTIONS}
                    value={peeColor}
                    onToggle={v => setPeeColor(p => p === v ? '' : v)}
                  />
                </div>
              )}

              {/* Poop color */}
              {showPoop && (
                <div>
                  <SectionLabel>Cor do cocô</SectionLabel>
                  <ChipRow
                    options={POOP_COLOR_OPTIONS}
                    value={poopColor}
                    onToggle={v => setPoopColor(p => p === v ? '' : v)}
                  />
                </div>
              )}

              {/* Poop texture */}
              {showPoop && (
                <div>
                  <SectionLabel>Consistência</SectionLabel>
                  <ChipRow
                    options={TEXTURE_OPTIONS}
                    value={texture}
                    onToggle={v => setTexture(p => p === v ? '' : v)}
                  />
                </div>
              )}

              {/* Observation */}
              <div>
                <SectionLabel>Observações</SectionLabel>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Alguma observação sobre esta troca..."
                  className="rounded-2xl border-border resize-none min-h-[80px]"
                  rows={3}
                  style={{ fontFamily: font }}
                />
              </div>

              {/* Medical report toggle */}
              <div className="flex items-center justify-between px-4 py-4 rounded-2xl"
                style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div>
                  <p className="text-sm font-semibold leading-tight"
                    style={{ color: 'hsl(var(--ninho-brown))', fontFamily: font }}>
                    Incluir no relatório médico
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                    Aparecerá no próximo relatório gerado
                  </p>
                </div>
                <Switch checked={includeInReport} onCheckedChange={setIncludeInReport} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed save button */}
      <div
        className="fixed bottom-0 left-0 right-0 flex justify-center"
        style={{ padding: `16px 20px max(24px, env(safe-area-inset-bottom))`, backgroundColor: 'hsl(var(--card))', borderTop: '1px solid hsl(var(--border))' }}
      >
        <div className="w-full max-w-md">
          <button
            onClick={handleSave}
            disabled={saving || !kind}
            className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-98 disabled:opacity-50"
            style={{
              background: kind ? `linear-gradient(135deg, ${ORANGE}, hsl(var(--ninho-mauve)))` : 'hsl(var(--muted))',
              color: kind ? 'white' : 'hsl(var(--muted-foreground))',
              fontFamily: font,
            }}
          >
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : (kind ? `Registrar — ${DIAPER_KIND_LABEL[kind]}` : 'Selecione o tipo')}
          </button>
        </div>
      </div>
    </div>
  );
}
