/**
 * FeedDetailSheet — shared detail view for breastfeeding sessions.
 * Used identically from Home timeline and Rotina timeline.
 */

import { motion } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  parsePayload,
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

interface FeedDetailSheetProps {
  log: RoutineLog | null;
  open: boolean;
  onClose: () => void;
}

export function FeedDetailSheet({ log, open, onClose }: FeedDetailSheetProps) {
  if (!log) return null;

  const p = parsePayload(log.notes);
  const totalSec = Number(p.total_seconds ?? 0);
  const leftSec = Number(p.left_seconds ?? 0);
  const rightSec = Number(p.right_seconds ?? 0);
  const switches = Number(p.switches ?? 0);
  const tags = String(p.tags ?? '').split(',').filter(Boolean);
  const userNotes = getUserNotes(log.notes);
  const includeInReport = p.include_in_report === true || p.include_in_report === 'true';
  const isManual = p.mode === 'manual';

  const startTime = fmtTime(log.start_time);
  const endTime = log.end_time ? fmtTime(log.end_time) : null;

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl pb-safe"
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="px-1 pt-2 space-y-5"
        >
          {/* ── Header ── */}
          <div className="text-center">
            <p
              className="text-xl font-bold"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}
            >
              🤱 Amamentação
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
            >
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
              <p
                className="text-4xl font-bold tabular-nums"
                style={{ color: 'hsl(var(--ninho-sage))', fontFamily: 'Quicksand, sans-serif' }}
              >
                {fmtDurationShort(totalSec)}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
              >
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
                  <div
                    key={s.label}
                    className="flex-1 rounded-2xl p-3 text-center"
                    style={{ backgroundColor: s.bg }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: s.color }}>
                      {s.label}
                    </p>
                    <p
                      className="text-lg font-bold mt-0.5"
                      style={{ color: s.color, fontFamily: 'Quicksand, sans-serif' }}
                    >
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Visual bar */}
              {totalSec > 0 && (
                <div
                  className="h-2 rounded-full overflow-hidden flex"
                  style={{ backgroundColor: 'hsl(var(--muted))' }}
                >
                  <div
                    style={{
                      width: `${(leftSec / totalSec) * 100}%`,
                      background: 'hsl(var(--ninho-sage))',
                      borderRadius: '9999px 0 0 9999px',
                    }}
                  />
                  {rightSec > 0 && (
                    <div
                      style={{
                        width: `${(rightSec / totalSec) * 100}%`,
                        background: 'hsl(var(--ninho-mauve))',
                        borderRadius: '0 9999px 9999px 0',
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Observation tags ── */}
          {tags.length > 0 && (
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-wide mb-2"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
              >
                Observações
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map(t => (
                  <span
                    key={t}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: 'hsl(var(--ninho-sage) / 0.1)',
                      color: 'hsl(var(--ninho-sage))',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    {TAG_LABELS[t] ?? t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Free-text notes ── */}
          {userNotes && (
            <p
              className="text-sm"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
            >
              💬 {userNotes}
            </p>
          )}

          {/* ── Medical report badge ── */}
          {includeInReport && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
              style={{
                backgroundColor: 'hsl(var(--ninho-mauve) / 0.08)',
                border: '1px solid hsl(var(--ninho-mauve) / 0.2)',
              }}
            >
              <span className="text-sm">📋</span>
              <p
                className="text-xs font-semibold"
                style={{ color: 'hsl(var(--ninho-mauve))', fontFamily: 'Nunito, sans-serif' }}
              >
                Incluída no relatório médico
              </p>
            </div>
          )}
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
