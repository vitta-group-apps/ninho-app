/**
 * DiaperDetailSheet — Detail + edit view for diaper events.
 * Opened identically from Home timeline and Rotina timeline.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  parsePayload, makePayloadNotes, getUserNotes, fmtTime,
  type RoutineLog,
} from '@/lib/routineUtils';
import {
  DIAPER_KIND_LABEL, DIAPER_QUANTITY_LABEL, DIAPER_COLOR_LABEL, DIAPER_TEXTURE_LABEL,
} from '@/lib/eventSystem';

const QUANTITY_OPTIONS = [
  { value: 'little', label: DIAPER_QUANTITY_LABEL.little },
  { value: 'medium', label: DIAPER_QUANTITY_LABEL.medium },
  { value: 'large', label: DIAPER_QUANTITY_LABEL.large },
];

const COLOR_OPTIONS = Object.entries(DIAPER_COLOR_LABEL).map(([v, l]) => ({ value: v, label: l }));
const TEXTURE_OPTIONS = Object.entries(DIAPER_TEXTURE_LABEL).map(([v, l]) => ({ value: v, label: l }));

const ORANGE = 'hsl(32,80%,57%)';

interface DiaperDetailSheetProps {
  log: RoutineLog | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function DiaperDetailSheet({ log, open, onClose, onUpdated }: DiaperDetailSheetProps) {
  const [editing, setEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editTexture, setEditTexture] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editReport, setEditReport] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!log) return null;

  const p = parsePayload(log.notes);
  const kind = String(p.kind ?? p.diaper_type ?? '');
  const quantity = String(p.quantity ?? '');
  const color = String(p.color ?? '');
  const texture = String(p.texture ?? '');
  const userNotes = getUserNotes(log.notes);
  const includeInReport = String(p.include_in_report) === 'true';
  const hasDetails = !!(quantity || color || texture || userNotes || includeInReport);
  const isPoop = kind === 'poop' || kind === 'both';

  function startEdit() {
    setEditQuantity(quantity);
    setEditColor(color);
    setEditTexture(texture);
    setEditNotes(userNotes ?? '');
    setEditReport(includeInReport);
    setEditing(true);
  }

  function cancelEdit() { setEditing(false); }

  async function saveEdit() {
    setSaving(true);
    try {
      const newPayload: Record<string, unknown> = { ...p, _notes: undefined };
      if (editQuantity) newPayload.quantity = editQuantity; else delete newPayload.quantity;
      if (editColor) newPayload.color = editColor; else delete newPayload.color;
      if (editTexture) newPayload.texture = editTexture; else delete newPayload.texture;
      if (editReport) newPayload.include_in_report = true; else delete newPayload.include_in_report;

      const { error } = await supabase.from('routine_logs')
        .update({ notes: makePayloadNotes(newPayload, editNotes) })
        .eq('id', log.id);
      if (error) throw error;
      toast({ title: '✓ Alterações salvas' });
      setEditing(false);
      onUpdated?.();
      onClose();
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const kindLabel = DIAPER_KIND_LABEL[kind] ?? kind;
  const quantityLabel = DIAPER_QUANTITY_LABEL[quantity] ?? '';
  const colorLabel = DIAPER_COLOR_LABEL[color] ?? '';
  const textureLabel = DIAPER_TEXTURE_LABEL[texture] ?? '';

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) { setEditing(false); onClose(); } }}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl pb-safe"
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="px-1 pt-2 space-y-4"
        >
          {/* Header */}
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
              🧷 Troca
            </p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              {fmtTime(log.start_time)}
            </p>
          </div>

          {/* Kind badge */}
          <div className="text-center">
            <span
              className="inline-block px-5 py-2.5 rounded-2xl text-base font-bold"
              style={{ backgroundColor: `${ORANGE}18`, color: ORANGE, fontFamily: 'Nunito, sans-serif' }}
            >
              {kindLabel || '—'}
            </span>
          </div>

          {/* Details grid (view mode) */}
          {!editing && hasDetails && (
            <div className="space-y-2">
              {quantityLabel && (
                <DetailRow label="Quantidade" value={quantityLabel} />
              )}
              {colorLabel && (
                <DetailRow label="Cor" value={colorLabel} />
              )}
              {textureLabel && (
                <DetailRow label="Consistência" value={textureLabel} />
              )}
              {userNotes && (
                <p className="text-sm px-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                  💬 {userNotes}
                </p>
              )}
              {includeInReport && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
                  style={{ backgroundColor: 'hsl(var(--ninho-mauve) / 0.08)', border: '1px solid hsl(var(--ninho-mauve) / 0.2)' }}
                >
                  <span className="text-sm">📋</span>
                  <p className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-mauve))', fontFamily: 'Nunito, sans-serif' }}>
                    Incluída no relatório médico
                  </p>
                </div>
              )}
            </div>
          )}

          {/* View mode edit button */}
          {!editing && (
            <button
              onClick={startEdit}
              className="w-full py-3 rounded-2xl text-sm font-bold text-center transition-all active:scale-95"
              style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
            >
              ✏️ Editar
            </button>
          )}

          {/* Edit mode */}
          {editing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                Editar informações
              </p>

              {/* Quantity */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Quantidade</Label>
                <div className="flex gap-2">
                  {QUANTITY_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setEditQuantity(v => v === opt.value ? '' : opt.value)}
                      className="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95"
                      style={{
                        backgroundColor: editQuantity === opt.value ? ORANGE : 'hsl(var(--muted))',
                        color: editQuantity === opt.value ? 'white' : 'hsl(var(--ninho-brown))',
                        fontFamily: 'Nunito, sans-serif',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color (poop-related) */}
              {isPoop && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Cor</Label>
                  <Select value={editColor} onValueChange={setEditColor}>
                    <SelectTrigger className="h-11 rounded-2xl border-border">
                      <SelectValue placeholder="Selecionar cor (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Texture (poop-related) */}
              {isPoop && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Consistência</Label>
                  <div className="flex gap-2">
                    {TEXTURE_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setEditTexture(v => v === opt.value ? '' : opt.value)}
                        className="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95"
                        style={{
                          backgroundColor: editTexture === opt.value ? ORANGE : 'hsl(var(--muted))',
                          color: editTexture === opt.value ? 'white' : 'hsl(var(--ninho-brown))',
                          fontFamily: 'Nunito, sans-serif',
                        }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                placeholder="Observações..." className="rounded-2xl border-border resize-none" rows={2} />

              {/* Report toggle */}
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}>
                  Incluir no relatório médico
                </p>
                <Switch checked={editReport} onCheckedChange={setEditReport} />
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-3">
                <button onClick={cancelEdit}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
                  style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}>
                  Cancelar
                </button>
                <button onClick={saveEdit} disabled={saving}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${ORANGE}, hsl(var(--ninho-mauve)))`, color: 'white', fontFamily: 'Nunito, sans-serif' }}>
                  {saving ? 'Salvando...' : '✓ Salvar'}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl"
      style={{ backgroundColor: 'hsl(var(--muted))' }}>
      <p className="text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}>{value}</p>
    </div>
  );
}
