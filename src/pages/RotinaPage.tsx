/**
 * RotinaPage — Ninho DS v2 harmonized routine timeline.
 *
 * Polish v2.1:
 * - Header band uses solid sage (no gradient)
 * - DailyStats uses the shared 3-column metric row
 * - Timeline section has consistent label spacing
 * - FAB uses solid mauve — no gradient
 * - Last feed indicator is better integrated into header
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { FeedDetailSheet } from '@/components/routine/FeedDetailSheet';
import { EventCard } from '@/components/events/EventCard';
import { ActiveSessionBanner } from '@/components/layout/ActiveSessionBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { fmtTimeSince, parsePayload } from '@/lib/routineUtils';
import { SummaryMetricCard } from '@/components/ds';
import type { RoutineLog } from '@/lib/eventSystem';

const FEED_COLOR   = 'hsl(152,15%,55%)';
const SLEEP_COLOR  = 'hsl(270,12%,42%)';
const DIAPER_COLOR = 'hsl(32,80%,57%)';

// ─── Daily Stats row ───────────────────────────────────────────────────────
function DailyStats({ logs }: { logs: RoutineLog[] }) {
  const feeds   = logs.filter(l => l.type === 'feed').length;
  const diapers = logs.filter(l => l.type === 'diaper').length;
  const sleepSec = logs.filter(l => l.type === 'sleep' && l.end_time).reduce((acc, l) => {
    return acc + Math.floor((new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000);
  }, 0);
  const h = Math.floor(sleepSec / 3600);
  const m = Math.floor((sleepSec % 3600) / 60);
  const sleepLabel = sleepSec > 0 ? (h > 0 ? `${h}h ${m}m` : `${m}m`) : '—';

  return (
    <div className="flex gap-2.5 mb-6">
      <SummaryMetricCard emoji="🤱" label="Mamadas"  value={feeds > 0 ? `${feeds}×` : '—'}   accentColor={FEED_COLOR} empty={feeds === 0} />
      <SummaryMetricCard emoji="🧷" label="Fraldas"  value={diapers > 0 ? `${diapers}×` : '—'} accentColor={DIAPER_COLOR} empty={diapers === 0} />
      <SummaryMetricCard emoji="😴" label="Sono"     value={sleepLabel}      accentColor={SLEEP_COLOR} empty={sleepSec === 0} />
    </div>
  );
}

// ─── FAB ──────────────────────────────────────────────────────────────────
function FAB({ onBreastfeed, onBottle, onSleep, onDiaper }: {
  onBreastfeed: () => void; onBottle: () => void; onSleep: () => void; onDiaper: () => void;
}) {
  const [open, setOpen] = useState(false);
  const actions = [
    { emoji: '🤱', label: 'Amamentar', onClick: onBreastfeed, color: FEED_COLOR },
    { emoji: '🍼', label: 'Mamadeira',  onClick: onBottle,     color: 'hsl(200,40%,50%)' },
    { emoji: '😴', label: 'Sono',       onClick: onSleep,      color: SLEEP_COLOR },
    { emoji: '🧷', label: 'Fralda',     onClick: onDiaper,     color: DIAPER_COLOR },
  ];

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setOpen(false)} />}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2.5">
        <AnimatePresence>
          {open && actions.map((a, i) => (
            <motion.div key={a.label}
              initial={{ opacity: 0, x: 12, scale: 0.88 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.9 }}
              transition={{ duration: 0.15, delay: i * 0.04 }}
              className="flex items-center gap-2.5"
            >
              <span
                className="text-[12px] font-bold px-3 py-1.5 rounded-full font-nunito"
                style={{
                  color: a.color,
                  backgroundColor: 'hsl(var(--card))',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
                  border: `1px solid color-mix(in srgb, ${a.color} 20%, transparent)`,
                }}
              >
                {a.label}
              </span>
              <button
                onClick={() => { a.onClick(); setOpen(false); }}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 text-white"
                style={{
                  backgroundColor: a.color,
                  boxShadow: `0 3px 10px color-mix(in srgb, ${a.color} 40%, transparent)`,
                }}
              >
                <span className="text-xl">{a.emoji}</span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Main FAB — solid mauve, no gradient */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 text-white"
          style={{
            backgroundColor: 'hsl(270,12%,42%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          }}
        >
          <motion.div
            animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}
          >
            <PlusIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
          </motion.div>
        </button>
      </div>
    </>
  );
}

// ─── Main RotinaPage ───────────────────────────────────────────────────────
export default function RotinaPage() {
  const navigate = useNavigate();
  const { activeChild, loading: childLoading } = useActiveChild();
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [detailLog, setDetailLog] = useState<RoutineLog | null>(null);
  const [detailKind, setDetailKind] = useState<'breastfeed' | null>(null);

  const lastFeed = logs.find(l => l.type === 'feed');

  const loadLogs = useCallback(async () => {
    if (!activeChild) return;
    setLogsLoading(true);
    try {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const { data, error } = await supabase.from('routine_logs').select('*')
        .eq('child_id', activeChild.id).gte('start_time', todayStart.toISOString())
        .order('start_time', { ascending: false });
      if (error) throw error;
      setLogs(data ?? []);
    } catch { /* silent */ } finally { setLogsLoading(false); }
  }, [activeChild]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  function handleTap(log: RoutineLog) {
    const p = parsePayload(log.notes);
    if (log.type === 'feed' && p.session_type === 'breastfeed') {
      setDetailLog(log); setDetailKind('breastfeed');
    } else if (log.type === 'diaper') {
      navigate(`/diaper/edit/${log.id}`);
    }
  }

  function closeDetail() { setDetailLog(null); setDetailKind(null); }

  return (
    <div className="min-h-screen pb-28 bg-background">
      {/* Header band — solid sage */}
      <div
        className="px-5 pt-14 pb-5"
        style={{ backgroundColor: 'hsl(152,15%,45%)' }}
      >
        <h1 className="text-[22px] font-bold text-white font-quicksand leading-tight">Rotina</h1>
        <p className="text-[13px] text-white/70 mt-0.5 font-nunito">
          {activeChild ? activeChild.name : 'Hoje'}
        </p>
        {lastFeed && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15">
            <span className="text-[13px]">🤱</span>
            <p className="text-[12px] text-white/90 font-semibold font-nunito">
              Última mamada há {fmtTimeSince(lastFeed.start_time)}
            </p>
          </div>
        )}
      </div>

      {/* Active session surface */}
      <div className="pt-3">
        <ActiveSessionBanner />
      </div>

      <div className="px-4 pt-4">
        {childLoading ? (
          <div className="space-y-3">
            <div className="flex gap-2">{[0,1,2].map(i => <Skeleton key={i} className="flex-1 h-24 rounded-2xl" />)}</div>
            {[0,1,2].map(i => <Skeleton key={i} className="h-[72px] rounded-2xl" />)}
          </div>
        ) : !activeChild ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <p className="text-4xl mb-3">👶</p>
            <p className="text-[16px] font-bold font-quicksand text-foreground">Nenhuma criança ativa</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {logs.length > 0 && <DailyStats logs={logs} />}

            <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 text-muted-foreground font-nunito">
              Eventos de hoje
            </p>

            {logsLoading ? (
              <div className="space-y-2.5">
                {[0,1,2].map(i => <Skeleton key={i} className="h-[72px] rounded-2xl" />)}
              </div>
            ) : logs.length === 0 ? (
              <div className="rounded-2xl px-5 py-10 text-center bg-card border border-border">
                <p className="text-4xl mb-3">🌤️</p>
                <p className="text-[15px] font-bold font-quicksand text-foreground">
                  Nenhum evento hoje
                </p>
                <p className="text-[13px] mt-1.5 text-muted-foreground font-nunito leading-snug">
                  Toque no + para registrar.
                </p>
              </div>
            ) : (
              <div>
                {logs.map((log, idx) => (
                  <EventCard key={log.id} log={log} isLast={idx === logs.length - 1} onTap={handleTap} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {activeChild && (
        <FAB
          onBreastfeed={() => navigate('/breastfeeding')}
          onBottle={() => navigate('/bottle')}
          onSleep={() => navigate('/sleep')}
          onDiaper={() => navigate('/diaper/new')}
        />
      )}

      <FeedDetailSheet
        log={detailKind === 'breastfeed' ? detailLog : null}
        open={detailKind === 'breastfeed' && !!detailLog}
        onClose={closeDetail}
        onUpdated={loadLogs}
      />
    </div>
  );
}
