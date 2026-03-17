/**
 * DiaperDetailSheet — View and edit a saved diaper event.
 *
 * Editable fields:
 *  - quantity, pee_color, poop_color, poop_texture, _notes, include_in_report
 *
 * Read-only:
 *  - kind, timestamp
 *
 * Opened from Home or Rotina timeline via EventCard tap.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { parsePayload, makePayloadNotes, getUserNotes, fmtTime } from '@/lib/routineUtils';
import type { RoutineLog } from '@/lib/eventSystem';
import {
  DIAPER_KIND_LABEL,
  DIAPER_QUANTITY_LABEL,
  DIAPER_PEE_COLOR_LABEL,
  DIAPER_POOP_COLOR_LABEL,
  DIAPER_TEXTURE_LABEL,
  isDiaperSignificant,
} from '@/lib/eventSystem';

// ─── Constants ───────────────────────────────────────────────────────────────

const ORANGE = 'hsl(32,80%,57%)';
const font   = 'Nunito, sans-serif';

const QUANTITY_OPTIONS   = Object.entries(DIAPER_QUANTITY_LABEL).map(([v, l]) => ({ value: v, label: l }));
const PEE_COLOR_OPTIONS  = Object.entries(DIAPER_PEE_COLOR_LABEL).map(([v, l]) => ({ value: v, label: l }));
const POOP_COLOR_OPTIONS = Object.entries(DIAPER_POOP_COLOR_LABEL).map(([v, l]) => ({ value: v, label: l }));
const TEXTURE_OPTIONS    = Object.entries(DIAPER_TEXTURE_LABEL).map(([v, l]) => ({ value: v, label: l }));

// ─── Sub-components ──────────────────────────────────────────────────────────

function ChipRow({
  options, value, onToggle, disabled = false, wrap = false,
}: {
  options: { value: string; label: string }[];
  value: string;
  onToggle: (v: string) => void;
  disabled?: boolean;
  wrap?: boolean;
}) {
  return (
    <div className={`flex gap-2 ${wrap ? 'flex-wrap' : 'overflow-x-auto pb-1'}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => !disabled && onToggle(opt.value)}
          disabled={disabled}
          className="py-2 px-3 rounded-2xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap flex-shrink-0 disabled:opacity-60"
          style={{
            backgroundColor: value === opt.value ? ORANGE : 'hsl(var(--muted))',
            color: value === opt.value ? 'white' : 'hsl(var(--ninho-brown))',
            fontFamily: font,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'hsl(var(--border))' }}>
      <span className="text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>{label}</span>
      <span className="text-sm font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: font }}>{value}</span>
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface DiaperDetailSheetProps {
  log: RoutineLog | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

// ─── Main component ──────────────────────────────────────────────────────────

export function DiaperDetailSheet({ log, open, onClose, onUpdated }: DiaperDetailSheetProps) {
  const [editMode, setEditMode] = useState(false);
  const [saving,   setSaving]   = useState(false);

  // Edit fields
  const [quantity,        setQuantity]        = useState('');
  const [peeColor,        setPeeColor]        = useState('');
  const [poopColor,       setPoopColor]       = useState('');
  const [texture,         setTexture]         = useState('');
  const [notes,           setNotes]           = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

  // Initialise from log on open
  useEffect(() => {
    if (open && log) {
      setEditMode(false);
      const p = parsePayload(log.notes);
      setQuantity(String(p.quantity ?? ''));
      setPeeColor(String(p.pee_color ?? ''));
      setPoopColor(String(p.poop_color ?? ''));
      setTexture(String(p.poop_texture ?? ''));
      setNotes(getUserNotes(log.notes) ?? '');
      setIncludeInReport(Boolean(p.include_in_report));
    }
  }, [open, log]);

  if (!log) return null;

  const p    = parsePayload(log.notes);
  const kind = String(p.kind ?? p.diaper_type ?? '');
  const showPee  = kind === 'pee'  || kind === 'both';
  const showPoop = kind === 'poop' || kind === 'both';

  const kindLabel     = DIAPER_KIND_LABEL[kind] ?? 'Troca';
  const isSignificant = isDiaperSignificant(p);

  // ─── Save ──────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    try {
      const existingPayload = parsePayload(log.notes);
      const updated: Record<string, unknown> = { ...existingPayload };

      if (quantity)                    updated.quantity      = quantity;      else delete updated.quantity;
      if (showPee  && peeColor)        updated.pee_color     = peeColor;      else delete updated.pee_color;
      if (showPoop && poopColor)       updated.poop_color    = poopColor;     else delete updated.poop_color;
      if (showPoop && texture)         updated.poop_texture  = texture;       else delete updated.poop_texture;
      if (includeInReport)             updated.include_in_report = true;      else delete updated.include_in_report;

      const { error } = await supabase
        .from('routine_logs')
        .update({ notes: makePayloadNotes(updated, notes) })
        .eq('id', log.id);

      if (error) throw error;
      toast({ title: '✓ Alterações salvas' });
      setEditMode(false);
      onUpdated();
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

  // ─── Render ────────────────────────────────────────────────────────────

  const userNote = getUserNotes(log.notes);

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl pb-safe"
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        <div className="px-1 pt-2 pb-6 max-h-[85vh] overflow-y-auto space-y-5">

          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                style={{ backgroundColor: 'hsl(32,80%,57%,0.12)' }}>
                🧷
              </div>
              <div>
                <p className="text-base font-bold leading-tight"
                  style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                  Troca
                </p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                  {fmtTime(log.start_time)}
                </p>
              </div>
            </div>

            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95"
                style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))', fontFamily: font }}
              >
                ✏️ Editar
              </button>
            )}
          </div>

          {/* Significance note — informational only, no diagnosis */}
          {isSignificant && (
            <div className="px-4 py-3 rounded-2xl" style={{ backgroundColor: 'hsl(var(--muted))' }}>
              <p className="text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                ℹ️ Esta troca tem informações que podem ser úteis em uma consulta médica.
              </p>
            </div>
          )}

          {/* Read-only detail view */}
          {!editMode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
              <DetailRow label="Tipo" value={kindLabel} />
              {p.quantity     && <DetailRow label="Quantidade"     value={DIAPER_QUANTITY_LABEL[String(p.quantity)]    ?? String(p.quantity)} />}
              {p.pee_color    && <DetailRow label="Cor do xixi"    value={DIAPER_PEE_COLOR_LABEL[String(p.pee_color)]  ?? String(p.pee_color)} />}
              {p.poop_color   && <DetailRow label="Cor do cocô"    value={DIAPER_POOP_COLOR_LABEL[String(p.poop_color)] ?? String(p.poop_color)} />}
              {p.poop_texture && <DetailRow label="Consistência"   value={DIAPER_TEXTURE_LABEL[String(p.poop_texture)] ?? String(p.poop_texture)} />}
              {p.include_in_report && <DetailRow label="Relatório médico" value="Incluído ✓" />}
              {userNote && (
                <div className="pt-3">
                  <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                    Observações
                  </p>
                  <p className="text-sm" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: font }}>
                    {userNote}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Edit view */}
          {editMode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

              {/* Quantity */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Quantidade</Label>
                <ChipRow options={QUANTITY_OPTIONS} value={quantity} onToggle={v => setQuantity(prev => prev === v ? '' : v)} />
              </div>

              {/* Pee color */}
              {showPee && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Cor do xixi</Label>
                  <ChipRow options={PEE_COLOR_OPTIONS} value={peeColor} onToggle={v => setPeeColor(prev => prev === v ? '' : v)} />
                </div>
              )}

              {/* Poop color */}
              {showPoop && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Cor do cocô</Label>
                  <ChipRow options={POOP_COLOR_OPTIONS} value={poopColor} onToggle={v => setPoopColor(prev => prev === v ? '' : v)} wrap />
                </div>
              )}

              {/* Poop texture */}
              {showPoop && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Consistência</Label>
                  <ChipRow options={TEXTURE_OPTIONS} value={texture} onToggle={v => setTexture(prev => prev === v ? '' : v)} wrap />
                </div>
              )}

              {/* Note */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Observações (opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Alguma observação..."
                  className="rounded-2xl border-border resize-none"
                  rows={2}
                />
              </div>

              {/* Report toggle */}
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
                style={{ backgroundColor: 'hsl(var(--muted))' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: font }}>
                    Incluir no relatório médico
                  </p>
                  <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                    Marca para inclusão futura
                  </p>
                </div>
                <Switch checked={includeInReport} onCheckedChange={setIncludeInReport} />
              </div>

              {/* Action row */}
              <div className="flex gap-3">
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold"
                  style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))', fontFamily: font }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold disabled:opacity-60 transition-all active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${ORANGE}, hsl(var(--ninho-mauve)))`,
                    color: 'white',
                    fontFamily: font,
                  }}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
