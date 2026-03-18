import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { FeedDetailSheet } from '@/components/routine/FeedDetailSheet';
import { EventCard } from '@/components/events/EventCard';
import { ActiveSessionBanner } from '@/components/layout/ActiveSessionBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { fmtTimeSince, parsePayload } from '@/lib/routineUtils';
import type { RoutineLog } from '@/lib/eventSystem';

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
        { emoji: '🧷', label: 'Fraldas', value: String(diapers) },
        { emoji: '😴', label: 'Sono', value: sleepLabel },
      ].map(s => (
        <div key={s.label} className="flex-1 rounded-2xl py-3 flex flex-col items-center gap-0.5"
          style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <span className="text-lg">{s.emoji}</span>
          <p className="text-base font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>{s.value}</p>
          <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── FAB ───────────────────────────────────────────────────────────────────
function FAB({ onBreastfeed, onBottle, onSleep, onDiaper }: {
  onBreastfeed: () => void; onBottle: () => void; onSleep: () => void; onDiaper: () => void;
}) {
  const [open, setOpen] = useState(false);
  const actions = [
    { emoji: '🤱', label: 'Amamentar', onClick: onBreastfeed, color: 'hsl(152,15%,55%)' },
    { emoji: '🍼', label: 'Mamadeira',  onClick: onBottle,     color: 'hsl(200,40%,50%)' },
    { emoji: '😴', label: 'Sono',       onClick: onSleep,      color: 'hsl(270,12%,52%)' },
    { emoji: '🧷', label: 'Fralda',     onClick: onDiaper,     color: 'hsl(32,80%,57%)' },
  ];
  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <div className="fixed bottom-24 right-5 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {open && actions.map((a, i) => (
            <motion.div key={a.label} initial={{ opacity: 0, y: 12, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }} transition={{ duration: 0.16, delay: i * 0.05 }}
              className="flex items-center gap-2">
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
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      {/* Header */}
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

      {/* Active session surface */}
      <ActiveSessionBanner />

      <div className="px-5 pt-4">
        {childLoading ? (
          <div className="space-y-3">
            <div className="flex gap-2">{[0,1,2].map(i => <Skeleton key={i} className="flex-1 h-20 rounded-2xl" />)}</div>
            {[0,1,2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        ) : !activeChild ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <p className="text-3xl mb-3">👶</p>
            <p className="text-base font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>Nenhuma criança ativa</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {logs.length > 0 && <DailyStats logs={logs} />}
            <p className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              Eventos de hoje
            </p>
            {logsLoading ? (
              <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
            ) : logs.length === 0 ? (
              <div className="rounded-2xl px-5 py-10 text-center"
                style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <p className="text-4xl mb-3">🌤️</p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>Nenhum evento registrado hoje</p>
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>Toque no + para começar.</p>
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
