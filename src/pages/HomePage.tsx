import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { ChildSwitcher } from '@/components/home/ChildSwitcher';
import { parsePayload, fmtRangeDuration } from '@/lib/routineUtils';
import { FeedDetailSheet } from '@/components/routine/FeedDetailSheet';
import { EventCard } from '@/components/events/EventCard';
import { ActiveSessionBanner } from '@/components/layout/ActiveSessionBanner';
import { Skeleton } from '@/components/ui/skeleton';
import type { RoutineLog } from '@/lib/eventSystem';

// ─── Summary Card ──────────────────────────────────────────────────────────
interface SummaryCardProps {
  emoji: string; label: string; value: string; sub?: string; empty?: boolean; color: string;
}
function SummaryCard({ emoji, label, value, sub, empty, color }: SummaryCardProps) {
  return (
    <div className="flex-1 min-w-0 rounded-2xl p-4 flex flex-col gap-2"
      style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
        style={{ backgroundColor: `${color}20` }}>
        {emoji}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>{label}</p>
        <p className={`text-sm font-bold leading-tight mt-0.5 ${empty ? 'opacity-40' : ''}`}
          style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>{value}</p>
        {sub && <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Quick Action ──────────────────────────────────────────────────────────
function QuickAction({ emoji, label, onClick, color }: { emoji: string; label: string; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95"
      style={{ backgroundColor: `${color}15`, border: `1.5px solid ${color}30` }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}25` }}>
        <span className="text-lg">{emoji}</span>
      </div>
      <span className="text-[11px] font-bold leading-tight text-center px-1" style={{ color, fontFamily: 'Nunito, sans-serif' }}>{label}</span>
    </button>
  );
}

// ─── Main HomePage ─────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const { activeChild, loading: childLoading, error: childError } = useActiveChild();

  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  const [feedOpen, setFeedOpen] = useState(false);

  // Detail state for feed detail sheet only (diaper now uses full-screen)
  const [detailLog, setDetailLog] = useState<RoutineLog | null>(null);
  const [detailKind, setDetailKind] = useState<'breastfeed' | 'diaper' | null>(null);

  const loadLogs = useCallback(async () => {
    if (!activeChild) return;
    setLogsLoading(true); setLogsError(null);
    try {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const { data, error } = await supabase.from('routine_logs').select('*')
        .eq('child_id', activeChild.id).gte('start_time', todayStart.toISOString())
        .order('start_time', { ascending: false });
      if (error) throw error;
      setLogs(data ?? []);
    } catch { setLogsError('Não foi possível carregar os eventos de hoje.'); }
    finally { setLogsLoading(false); }
  }, [activeChild]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  function handleTap(log: RoutineLog) {
    const p = parsePayload(log.notes);
    if (log.type === 'feed' && p.session_type === 'breastfeed') {
      setDetailLog(log); setDetailKind('breastfeed');
    } else if (log.type === 'diaper') {
      // Navigate to full-screen edit
      navigate(`/diaper/edit/${log.id}`);
    }
  }

  function closeDetail() { setDetailLog(null); setDetailKind(null); }

  // ─── Derived daily stats ───────────────────────────────────────────────
  const feedCount   = logs.filter(l => l.type === 'feed').length;
  const diaperCount = logs.filter(l => l.type === 'diaper').length;
  const sleepLogs   = logs.filter(l => l.type === 'sleep' && l.end_time);
  const sleepSec    = sleepLogs.reduce((acc, l) => {
    return acc + Math.floor((new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000);
  }, 0);
  const sleepH = Math.floor(sleepSec / 3600);
  const sleepM = Math.floor((sleepSec % 3600) / 60);
  const sleepLabel = sleepSec > 0 ? (sleepH > 0 ? `${sleepH}h ${sleepM}m` : `${sleepM}m`) : null;
  const ongoingSleep = logs.find(l => l.type === 'sleep' && !l.end_time);
  const lastSleep = logs.find(l => l.type === 'sleep');
  const lastSleepSub = ongoingSleep
    ? 'em andamento'
    : lastSleep?.end_time
    ? `Duração: ${fmtRangeDuration(lastSleep.start_time, lastSleep.end_time)}`
    : undefined;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const sageHex   = 'hsl(152,15%,55%)';
  const mauveHex  = 'hsl(270,12%,52%)';
  const orangeHex = 'hsl(32,80%,57%)';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      {/* Hero header */}
      <div className="px-5 pt-12 pb-5"
        style={{ background: 'linear-gradient(135deg, hsl(var(--ninho-mauve)), hsl(var(--ninho-sage)))' }}>
        <p className="text-sm text-white/70 mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>{greeting} 👋</p>
        <ChildSwitcher />
      </div>

      {childError && (
        <div className="mx-5 mt-4 px-4 py-3 rounded-2xl flex items-center gap-2"
          style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)', border: '1px solid hsl(var(--destructive) / 0.2)' }}>
          <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--destructive))' }} />
          <p className="text-xs" style={{ color: 'hsl(var(--destructive))', fontFamily: 'Nunito, sans-serif' }}>
            Não foi possível carregar os dados da criança.
          </p>
        </div>
      )}

      {childLoading ? (
        <div className="px-5 pt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">{[0,1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : !activeChild ? (
        <div className="flex flex-col items-center justify-center px-5 pt-16 text-center">
          <p className="text-base font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>Nenhuma criança encontrada</p>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>Complete o cadastro para ver o painel.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="pb-8 space-y-5">

          {/* Active session surface */}
          <ActiveSessionBanner />

          <div className="px-5 space-y-5">
            {/* Summary cards */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>Resumo do dia</p>
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard emoji="🤱" label="Mamadas" color={sageHex}
                  value={logsLoading ? '...' : feedCount > 0 ? `${feedCount}x` : 'Nenhuma'}
                  sub={feedCount > 0 ? 'hoje' : undefined} empty={!logsLoading && feedCount === 0} />
                <SummaryCard emoji="🧷" label="Fraldas" color={orangeHex}
                  value={logsLoading ? '...' : diaperCount > 0 ? `${diaperCount}x` : 'Nenhuma'}
                  sub={diaperCount > 0 ? 'hoje' : undefined} empty={!logsLoading && diaperCount === 0} />
                <SummaryCard emoji="😴" label="Sono" color={mauveHex}
                  value={logsLoading ? '...' : sleepLabel ?? (ongoingSleep ? 'Em andamento' : 'Nenhum')}
                  sub={lastSleepSub} empty={!logsLoading && !sleepLabel && !ongoingSleep} />
                <SummaryCard emoji="📅" label="Próxima consulta" color="#9B6B9B"
                  value="Nenhuma agendada" empty />
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>Registrar agora</p>
              <div className="flex gap-3">
                <QuickAction emoji="🤱" label="Mamada"  onClick={() => setFeedOpen(true)}         color={sageHex} />
                <QuickAction emoji="😴" label="Sono"    onClick={() => navigate('/sleep')}          color={mauveHex} />
                <QuickAction emoji="🧷" label="Fralda"  onClick={() => navigate('/diaper/new')}     color={orangeHex} />
              </div>
            </div>

            {/* Daily timeline */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>Hoje</p>
              {logsError && (
                <div className="px-4 py-3 rounded-2xl mb-3 flex items-center gap-2"
                  style={{ backgroundColor: 'hsl(var(--destructive) / 0.08)', border: '1px solid hsl(var(--destructive) / 0.15)' }}>
                  <ExclamationCircleIcon className="w-4 h-4" style={{ color: 'hsl(var(--destructive))' }} />
                  <p className="text-xs" style={{ color: 'hsl(var(--destructive))', fontFamily: 'Nunito, sans-serif' }}>{logsError}</p>
                </div>
              )}
              {logsLoading ? (
                <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
              ) : logs.length === 0 ? (
                <div className="rounded-2xl px-5 py-8 text-center"
                  style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <p className="text-3xl mb-2">🌤️</p>
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>Nenhum evento registrado hoje</p>
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>Use os botões acima para começar.</p>
                </div>
              ) : (
                <div className="pb-2">
                  {logs.map((log, idx) => (
                    <EventCard key={log.id} log={log} isLast={idx === logs.length - 1} onTap={handleTap} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <FeedSheet open={feedOpen} onClose={() => setFeedOpen(false)} onSaved={loadLogs} />
      <FeedDetailSheet
        log={detailKind === 'breastfeed' ? detailLog : null}
        open={detailKind === 'breastfeed' && !!detailLog}
        onClose={closeDetail}
        onUpdated={loadLogs}
      />
      {/* Diaper detail now uses full-screen route (/diaper/edit/:logId) */}
    </div>
  );
}
