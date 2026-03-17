import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { FeedSheet, SleepSheet, DiaperSheet } from '@/components/home/QuickLogSheets';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  getLogMeta,
  getUserNotes,
  fmtTime,
  fmtTimeSince,
  fmtDurationShort,
  parsePayload,
  type RoutineLog,
} from '@/lib/routineUtils';

// ─── Session Detail Modal ─────────────────────────────────────────────────

function FeedDetailSheet({ log, open, onClose }: { log: RoutineLog | null; open: boolean; onClose: () => void }) {
  if (!log) return null;
  const p = parsePayload(log.notes);
  const totalSec = Number(p.total_seconds ?? 0);
  const leftSec = Number(p.left_seconds ?? 0);
  const rightSec = Number(p.right_seconds ?? 0);
  const switches = Number(p.switches ?? 0);
  const tags = String(p.tags ?? '').split(',').filter(Boolean);
  const userNotes = getUserNotes(log.notes);
  const includeInReport = Boolean(p.include_in_report);

  const startTime = new Date(log.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const endTime = log.end_time ? new Date(log.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;

  const TAG_LABELS: Record<string, string> = {
    mamou_bem: '😊 Mamou bem',
    inquieto: '😟 Inquieto',
    dormiu: '😴 Dormiu durante',
    desconforto: '😣 Desconforto',
    pega_boa: '👍 Pega boa',
    rejeitou_lado: '↩️ Rejeitou lado',
  };

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe" style={{ backgroundColor: 'hsl(var(--card))' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="px-1 pt-2 space-y-4"
        >
          {/* Header */}
          <div className="text-center">
            <p className="text-xl" style={{ fontFamily: 'Quicksand, sans-serif', color: 'hsl(var(--ninho-brown))', fontWeight: 700 }}>
              🤱 Amamentação
            </p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              {startTime}{endTime ? ` – ${endTime}` : ''}
            </p>
          </div>

          {/* Total */}
          {totalSec > 0 && (
            <div className="text-center">
              <p className="text-4xl font-bold tabular-nums" style={{ color: 'hsl(var(--ninho-sage))', fontFamily: 'Quicksand, sans-serif' }}>
                {fmtDurationShort(totalSec)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>duração total</p>
            </div>
          )}

          {/* E / D breakdown */}
          {(leftSec > 0 || rightSec > 0) && (
            <>
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

              {/* Visual bar */}
              {totalSec > 0 && (
                <div className="h-2 rounded-full overflow-hidden flex" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  <div style={{ width: `${(leftSec / totalSec) * 100}%`, background: 'hsl(var(--ninho-sage))', borderRadius: '9999px 0 0 9999px' }} />
                  {rightSec > 0 && (
                    <div style={{ width: `${(rightSec / totalSec) * 100}%`, background: 'hsl(var(--ninho-mauve))', borderRadius: '0 9999px 9999px 0' }} />
                  )}
                </div>
              )}
            </>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                Observações
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map(t => (
                  <span
                    key={t}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'hsl(var(--ninho-sage) / 0.1)', color: 'hsl(var(--ninho-sage))', fontFamily: 'Nunito, sans-serif' }}
                  >
                    {TAG_LABELS[t] ?? t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Free notes */}
          {userNotes && (
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              💬 {userNotes}
            </p>
          )}

          {/* Medical report flag */}
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
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Timeline Item ─────────────────────────────────────────────────────────

function TimelineItem({ log, isLast, onTap }: { log: RoutineLog; isLast: boolean; onTap: () => void }) {
  const meta = getLogMeta(log);
  const userNotes = getUserNotes(log.notes);
  const isFeed = log.type === 'feed';
  const p = isFeed ? parsePayload(log.notes) : null;
  const isBreastfeed = p?.session_type === 'breastfeed';

  return (
    <div className="flex items-stretch gap-3">
      <div className="flex flex-col items-center w-12 flex-shrink-0">
        <span className="text-[11px] font-semibold text-center leading-tight pt-2.5"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
          {fmtTime(log.start_time)}
        </span>
        {!isLast && <div className="w-px flex-1 mt-1" style={{ backgroundColor: 'hsl(var(--border))' }} />}
      </div>

      <button
        onClick={isBreastfeed ? onTap : undefined}
        className={`flex-1 rounded-2xl px-3 py-3 mb-3 flex items-center gap-3 text-left w-full ${isBreastfeed ? 'active:scale-[0.98] transition-transform' : ''}`}
        style={{
          backgroundColor: 'hsl(var(--card))',
          border: `1px solid ${isBreastfeed ? 'hsl(var(--ninho-sage) / 0.25)' : 'hsl(var(--border))'}`,
          cursor: isBreastfeed ? 'pointer' : 'default',
        }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: meta.bgColor }}>
          <span className="text-lg">{meta.emoji}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
              {meta.label}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {meta.durationBadge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: meta.bgColor, color: meta.color }}>
                  {meta.durationBadge}
                </span>
              )}
              {isBreastfeed && (
                <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>›</span>
              )}
            </div>
          </div>
          {meta.sub && (
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              {meta.sub}
            </p>
          )}
          {userNotes && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              💬 {userNotes}
            </p>
          )}
        </div>
      </button>
    </div>
  );
}

// ─── Daily stats ───────────────────────────────────────────────────────────
function DailyStats({ logs }: { logs: RoutineLog[] }) {
  const feeds = logs.filter(l => l.type === 'feed').length;
  const diapers = logs.filter(l => l.type === 'diaper').length;
  const sleepSec = logs.filter(l => l.type === 'sleep' && l.end_time).reduce((acc, l) => {
    return acc + Math.floor((new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000);
  }, 0);
  const h = Math.floor(sleepSec / 3600);
  const m = Math.floor((sleepSec % 3600) / 60);
  const sleepLabel = sleepSec > 0 ? (h > 0 ? `${h}h${m}m` : `${m}m`) : '—';

  return (
    <div className="flex gap-2 mb-5">
      {[
        { emoji: '🤱', label: 'Mamadas', value: String(feeds) },
        { emoji: '🧷', label: 'Trocas', value: String(diapers) },
        { emoji: '😴', label: 'Sono', value: sleepLabel },
      ].map(s => (
        <div key={s.label} className="flex-1 rounded-2xl py-3 flex flex-col items-center gap-0.5"
          style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <span className="text-lg">{s.emoji}</span>
          <p className="text-base font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
            {s.value}
          </p>
          <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── FAB ───────────────────────────────────────────────────────────────────
function FAB({ onFeed, onSleep, onDiaper }: { onFeed: () => void; onSleep: () => void; onDiaper: () => void }) {
  const [open, setOpen] = useState(false);
  const actions = [
    { emoji: '🤱', label: 'Amamentar', onClick: onFeed, color: 'hsl(152,15%,55%)' },
    { emoji: '😴', label: 'Sono', onClick: onSleep, color: 'hsl(270,12%,52%)' },
    { emoji: '🧷', label: 'Troca', onClick: onDiaper, color: '#E8A045' },
  ];
  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <div className="fixed bottom-24 right-5 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {open && actions.map((a, i) => (
            <motion.div key={a.label} initial={{ opacity: 0, y: 12, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              transition={{ duration: 0.16, delay: i * 0.05 }} className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: 'hsl(var(--card))', color: a.color, fontFamily: 'Nunito, sans-serif', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                {a.label}
              </span>
              <button onClick={() => { a.onClick(); setOpen(false); }}
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90"
                style={{ backgroundColor: a.color }}>
                <span className="text-xl">{a.emoji}</span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        <button onClick={() => setOpen(v => !v)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
          style={{ background: 'linear-gradient(135deg, hsl(var(--ninho-mauve)), hsl(var(--ninho-sage)))' }}>
          <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}
            className="text-2xl text-white font-bold leading-none">+</motion.span>
        </button>
      </div>
    </>
  );
}

// ─── Main RotinaPage ───────────────────────────────────────────────────────
export default function RotinaPage() {
  const { activeChild, loading: childLoading } = useActiveChild();
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);
  const [diaperOpen, setDiaperOpen] = useState(false);
  const [detailLog, setDetailLog] = useState<RoutineLog | null>(null);

  const lastFeed = logs.find(l => l.type === 'feed');

  const loadLogs = useCallback(async () => {
    if (!activeChild) return;
    setLogsLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('child_id', activeChild.id)
        .gte('start_time', todayStart.toISOString())
        .order('start_time', { ascending: false });
      if (error) throw error;
      setLogs(data ?? []);
    } catch { /* silent */ } finally { setLogsLoading(false); }
  }, [activeChild]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      <div className="px-5 pt-14 pb-5"
        style={{ background: 'linear-gradient(135deg, hsl(var(--ninho-sage)), hsl(var(--ninho-mauve)))' }}>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>Rotina</h1>
        <p className="text-sm text-white/70 mt-0.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {activeChild ? activeChild.name : 'Hoje'}
        </p>
        {lastFeed && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15">
            <span className="text-sm">🤱</span>
            <p className="text-xs text-white/90 font-semibold" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Última mamada há {fmtTimeSince(lastFeed.start_time)}
            </p>
          </div>
        )}
      </div>

      <div className="px-5 pt-5">
        {childLoading ? (
          <div className="space-y-3">
            <div className="flex gap-2">{[0, 1, 2].map(i => <Skeleton key={i} className="flex-1 h-20 rounded-2xl" />)}</div>
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        ) : !activeChild ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <p className="text-3xl mb-3">👶</p>
            <p className="text-base font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
              Nenhuma criança ativa
            </p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {logs.length > 0 && <DailyStats logs={logs} />}
            <p className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              Eventos de hoje
            </p>
            {logsLoading ? (
              <div className="space-y-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
            ) : logs.length === 0 ? (
              <div className="rounded-2xl px-5 py-10 text-center"
                style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <p className="text-4xl mb-3">🌤️</p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                  Nenhum evento registrado hoje
                </p>
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                  Toque no + para começar.
                </p>
              </div>
            ) : (
              <div>
                {logs.map((log, idx) => (
                  <TimelineItem
                    key={log.id}
                    log={log}
                    isLast={idx === logs.length - 1}
                    onTap={() => setDetailLog(log)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {activeChild && (
        <FAB onFeed={() => setFeedOpen(true)} onSleep={() => setSleepOpen(true)} onDiaper={() => setDiaperOpen(true)} />
      )}

      <FeedSheet open={feedOpen} onClose={() => setFeedOpen(false)} onSaved={loadLogs} />
      <SleepSheet open={sleepOpen} onClose={() => setSleepOpen(false)} onSaved={loadLogs} />
      <DiaperSheet open={diaperOpen} onClose={() => setDiaperOpen(false)} onSaved={loadLogs} />
      <FeedDetailSheet log={detailLog} open={!!detailLog} onClose={() => setDetailLog(null)} />
    </div>
  );
}
