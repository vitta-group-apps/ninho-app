/**
 * HomePage — Ninho DS v2 harmonized home screen.
 *
 * Polish v2.1:
 * - Header band uses a calm, non-gradient solid mauve background
 * - Child identity block has more breathing room
 * - Section labels have consistent spacing above them
 * - Metric cards are in a tighter grid with better proportions
 * - Quick actions grid has equal columns with proper tap targets
 * - Timeline section header shows today's date
 * - Empty state is more intentional and less dense
 */

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
import { SummaryMetricCard, QuickActionTile } from '@/components/ds';
import type { RoutineLog } from '@/lib/eventSystem';

// DS semantic color tokens
const FEED_COLOR   = 'hsl(152,15%,55%)';
const SLEEP_COLOR  = 'hsl(270,12%,42%)';
const DIAPER_COLOR = 'hsl(32,80%,57%)';
const BOTTLE_COLOR = 'hsl(200,40%,50%)';

export default function HomePage() {
  const navigate = useNavigate();
  const { activeChild, loading: childLoading, error: childError } = useActiveChild();

  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  const [detailLog, setDetailLog] = useState<RoutineLog | null>(null);
  const [detailKind, setDetailKind] = useState<'breastfeed' | null>(null);

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
      navigate(`/diaper/edit/${log.id}`);
    }
  }

  function closeDetail() { setDetailLog(null); setDetailKind(null); }

  // ─── Daily stats ───────────────────────────────────────────────
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

  // Today's date label
  const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header — calm solid mauve, no gradient */}
      <div
        className="px-5 pt-12 pb-6"
        style={{ backgroundColor: 'hsl(270,12%,38%)' }}
      >
        <p className="text-[13px] text-white/65 mb-2.5 font-nunito font-medium">
          {greeting} 👋
        </p>
        <ChildSwitcher />
      </div>

      {/* Error banner */}
      {childError && (
        <div
          className="mx-4 mt-4 px-4 py-3 rounded-2xl flex items-center gap-2"
          style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)', border: '1px solid hsl(var(--destructive) / 0.2)' }}
        >
          <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 text-destructive" />
          <p className="text-xs text-destructive font-nunito">
            Não foi possível carregar os dados da criança.
          </p>
        </div>
      )}

      {childLoading ? (
        <div className="px-4 pt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[0,1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : !activeChild ? (
        <div className="flex flex-col items-center justify-center px-4 pt-16 text-center">
          <p className="text-[17px] font-bold font-quicksand text-foreground">Nenhuma criança encontrada</p>
          <p className="text-sm mt-1.5 text-muted-foreground font-nunito">Complete o cadastro para ver o painel.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="pb-10"
        >
          {/* Active session surface — sits just below hero */}
          <div className="pt-3">
            <ActiveSessionBanner />
          </div>

          <div className="px-4 mt-4 space-y-6">

            {/* ── Summary metrics ─────────────────────────────────── */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 text-muted-foreground font-nunito">
                Resumo do dia
              </p>
              <div className="grid grid-cols-2 gap-3">
                <SummaryMetricCard
                  emoji="🤱" label="Mamadas" accentColor={FEED_COLOR}
                  value={logsLoading ? '...' : feedCount > 0 ? `${feedCount}×` : 'Nenhuma'}
                  sub={feedCount > 0 ? 'hoje' : undefined}
                  empty={!logsLoading && feedCount === 0}
                />
                <SummaryMetricCard
                  emoji="🧷" label="Fraldas" accentColor={DIAPER_COLOR}
                  value={logsLoading ? '...' : diaperCount > 0 ? `${diaperCount}×` : 'Nenhuma'}
                  sub={diaperCount > 0 ? 'hoje' : undefined}
                  empty={!logsLoading && diaperCount === 0}
                />
                <SummaryMetricCard
                  emoji="😴" label="Sono" accentColor={SLEEP_COLOR}
                  value={logsLoading ? '...' : sleepLabel ?? (ongoingSleep ? 'Em andamento' : '—')}
                  sub={lastSleepSub}
                  empty={!logsLoading && !sleepLabel && !ongoingSleep}
                />
                <SummaryMetricCard
                  emoji="📅" label="Próx. consulta" accentColor="hsl(var(--primary))"
                  value="—" empty
                />
              </div>
            </div>

            {/* ── Quick actions — 4 tiles ──────────────────────────── */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 text-muted-foreground font-nunito">
                Registrar agora
              </p>
              <div className="grid grid-cols-4 gap-2.5">
                <QuickActionTile emoji="🤱" label="Amamentar" accentColor={FEED_COLOR}   onClick={() => navigate('/breastfeeding')} />
                <QuickActionTile emoji="🍼" label="Mamadeira"  accentColor={BOTTLE_COLOR} onClick={() => navigate('/bottle')} />
                <QuickActionTile emoji="😴" label="Sono"       accentColor={SLEEP_COLOR}  onClick={() => navigate('/sleep')} />
                <QuickActionTile emoji="🧷" label="Fralda"     accentColor={DIAPER_COLOR} onClick={() => navigate('/diaper/new')} />
              </div>
            </div>

            {/* ── Today's timeline ─────────────────────────────────── */}
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-nunito">
                  Hoje
                </p>
                <p className="text-[11px] text-muted-foreground font-nunito capitalize">
                  {todayLabel}
                </p>
              </div>

              {logsError && (
                <div
                  className="px-4 py-3 rounded-2xl mb-3 flex items-center gap-2"
                  style={{ backgroundColor: 'hsl(var(--destructive) / 0.08)', border: '1px solid hsl(var(--destructive) / 0.15)' }}
                >
                  <ExclamationCircleIcon className="w-4 h-4 text-destructive" />
                  <p className="text-xs text-destructive font-nunito">{logsError}</p>
                </div>
              )}

              {logsLoading ? (
                <div className="space-y-2.5">
                  {[0,1,2].map(i => <Skeleton key={i} className="h-[72px] rounded-2xl" />)}
                </div>
              ) : logs.length === 0 ? (
                <div className="rounded-2xl px-5 py-10 text-center bg-card border border-border">
                  <p className="text-4xl mb-3">🌤️</p>
                  <p className="text-[15px] font-bold font-quicksand text-foreground">Nenhum evento hoje</p>
                  <p className="text-[13px] mt-1.5 text-muted-foreground font-nunito leading-snug">
                    Use os botões acima para começar a registrar.
                  </p>
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

      <FeedDetailSheet
        log={detailKind === 'breastfeed' ? detailLog : null}
        open={detailKind === 'breastfeed' && !!detailLog}
        onClose={closeDetail}
        onUpdated={loadLogs}
      />
    </div>
  );
}
