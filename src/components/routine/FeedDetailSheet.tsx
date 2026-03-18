/**
 * FeedDetailSheet — shared detail + edit view for breastfeeding sessions.
 * Used identically from Home timeline and Rotina timeline.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  parsePayload,
  makePayloadNotes,
  getUserNotes,
  fmtDurationShort,
  fmtTime,
  type RoutineLog,
} from '@/lib/routineUtils';

const TAG_LABELS: Record<string, string> = {
  mamou_bem: '😊 Mamou bem',
  inquieto: '😟 Inquieto',
  dormiu: '😴 Dormiu durante',
  desconforto: '😣 Desconforto',
  pega_boa: '👍 Pega boa',
  rejeitou_lado: '↩️ Rejeitou lado',
};

const ALL_TAGS = Object.keys(TAG_LABELS);

interface FeedDetailSheetProps {
  log: RoutineLog | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function FeedDetailSheet({ log, open, onClose, onUpdated }: FeedDetailSheetProps) {
  const [editing, setEditing] = useState(false);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [editReport, setEditReport] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!log) return null;

  const p = parsePayload(log.notes);
  const totalSec = Number(p.total_seconds ?? 0);
  const leftSec = Number(p.left_seconds ?? 0);
  const rightSec = Number(p.right_seconds ?? 0);
  const switches = Number(p.switches ?? 0);
  const tags = String(p.tags ?? '').split(',').filter(Boolean);
  const userNotes = getUserNotes(log.notes);
  const includeInReport = String(p.include_in_report) === 'true';
  const isManual = p.mode === 'manual';

  const startTime = fmtTime(log.start_time);
  const endTime = log.end_time ? fmtTime(log.end_time) : null;

  function startEdit() {
    setEditTags([...tags]);
    setEditNotes(userNotes ?? '');
    setEditReport(includeInReport);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function toggleEditTag(id: string) {
    setEditTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      // Rebuild payload with updated fields
      const newPayload: Record<string, unknown> = { ...p };
      if (editTags.length > 0) {
        newPayload.tags = editTags.join(',');
      } else {
        delete newPayload.tags;
      }
      if (editReport) {
        newPayload.include_in_report = true;
      } else {
        delete newPayload.include_in_report;
      }
      // Remove _notes from payload (it goes via makePayloadNotes)
      delete newPayload._notes;

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

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) { setEditing(false); onClose(); } }}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl pb-safe"
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        <VisuallyHidden><SheetTitle>Detalhes da amamentação</SheetTitle></VisuallyHidden>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="px-1 pt-2 space-y-5"
        >
          {/* ── Header ── */}
          <div className="text-center">
            <p className="text-xl font-bold"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
              🤱 Amamentação
            </p>
            <p className="text-xs mt-1"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              {startTime}{endTime ? ` – ${endTime}` : ''}
              {isManual && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                  manual
                </span>
              )}
            </p>
          </div>

          {/* ── Total duration ── */}
          {totalSec > 0 && (
            <div className="text-center">
              <p className="text-4xl font-bold tabular-nums"
                style={{ color: 'hsl(var(--ninho-sage))', fontFamily: 'Quicksand, sans-serif' }}>
                {fmtDurationShort(totalSec)}
              </p>
              <p className="text-xs mt-0.5"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                duração total
              </p>
            </div>
          )}

          {/* ── E / Trocas / D breakdown ── */}
          {(leftSec > 0 || rightSec > 0) && (
            <div className="space-y-2.5">
              <div className="flex gap-2">
                {[
                  { label: 'Esquerdo', value: fmtDurationShort(leftSec), color: 'hsl(var(--ninho-sage))', bg: 'hsl(var(--ninho-sage) / 0.08)' },
                  { label: 'Trocas', value: String(switches), color: 'hsl(var(--ninho-brown))', bg: 'hsl(var(--muted))' },
                  { label: 'Direito', value: fmtDurationShort(rightSec), color: 'hsl(var(--ninho-mauve))', bg: 'hsl(var(--ninho-mauve) / 0.08)' },
                ].map(s => (
                  <div key={s.label} className="flex-1 rounded-2xl p-3 text-center" style={{ backgroundColor: s.bg }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: s.color }}>{s.label}</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: s.color, fontFamily: 'Quicksand, sans-serif' }}>{s.value}</p>
                  </div>
                ))}
              </div>
              {totalSec > 0 && (
                <div className="h-2 rounded-full overflow-hidden flex" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  <div style={{ width: `${(leftSec / totalSec) * 100}%`, background: 'hsl(var(--ninho-sage))', borderRadius: '9999px 0 0 9999px' }} />
                  {rightSec > 0 && (
                    <div style={{ width: `${(rightSec / totalSec) * 100}%`, background: 'hsl(var(--ninho-mauve))', borderRadius: '0 9999px 9999px 0' }} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── VIEW MODE ── */}
          {!editing && (
            <>
              {/* Observation tags */}
              {tags.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2"
                    style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                    Observações
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(t => (
                      <span key={t} className="px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: 'hsl(var(--ninho-sage) / 0.1)', color: 'hsl(var(--ninho-sage))', fontFamily: 'Nunito, sans-serif' }}>
                        {TAG_LABELS[t] ?? t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Free-text notes */}
              {userNotes && (
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                  💬 {userNotes}
                </p>
              )}

              {/* Medical report badge */}
              {includeInReport && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
                  style={{ backgroundColor: 'hsl(var(--ninho-mauve) / 0.08)', border: '1px solid hsl(var(--ninho-mauve) / 0.2)' }}>
                  <span className="text-sm">📋</span>
                  <p className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-mauve))', fontFamily: 'Nunito, sans-serif' }}>
                    Incluída no relatório médico
                  </p>
                </div>
              )}

              {/* Edit button */}
              <button onClick={startEdit}
                className="w-full py-3 rounded-2xl text-sm font-bold text-center transition-all active:scale-95"
                style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}>
                ✏️ Editar
              </button>
            </>
          )}

          {/* ── EDIT MODE ── */}
          {editing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wide"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                Editar observações
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map(id => (
                  <button key={id} onClick={() => toggleEditTag(id)}
                    className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-95"
                    style={{
                      backgroundColor: editTags.includes(id) ? 'hsl(var(--ninho-sage))' : 'hsl(var(--muted))',
                      color: editTags.includes(id) ? 'white' : 'hsl(var(--ninho-brown))',
                      fontFamily: 'Nunito, sans-serif',
                    }}>
                    {TAG_LABELS[id]}
                  </button>
                ))}
              </div>

              {/* Notes */}
              <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                placeholder="Outras observações..." className="rounded-2xl border-border resize-none" rows={2} />

              {/* Report toggle */}
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}>
                    Incluir no relatório médico
                  </p>
                </div>
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
                  style={{ background: 'linear-gradient(135deg, hsl(var(--ninho-sage)), hsl(var(--ninho-mauve)))', color: 'white', fontFamily: 'Nunito, sans-serif' }}>
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
