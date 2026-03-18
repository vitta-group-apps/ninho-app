/**
 * HomePage — Ninho DS v2 home screen.
 *
 * Responsibility: context-first, summary-first, action-first, lightweight.
 * - NO search or filters here (those live in Rotina)
 * - NO heavy timeline duplication
 * - "Hoje" area is a concise preview only (max ~5 events, no grouping)
 * - Quick actions are data-driven via config/quickActions.ts (locked at 4)
 * - Summary cards are age-adapted
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { ChildSwitcher } from '@/components/home/ChildSwitcher';
import { fmtRangeDuration } from '@/lib/routineUtils';
import { EventCard } from '@/components/events/EventCard';
import { ActiveSessionBanner } from '@/components/layout/ActiveSessionBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { SummaryMetricCard, QuickActionTile } from '@/components/ds';
import type { RoutineLog } from '@/lib/eventSystem';
import { analyzeDayPatterns, getAgeContext } from '@/lib/eventSystem';
import { getOrderedQuickActions } from '@/config/quickActions';

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
    setLogsLoading(true);
    setLogsError(null);
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
    } catch {
      setLogsError('Não foi possível carregar os eventos de hoje.');
    } finally {
      setLogsLoading(false);
    }
  }, [activeChild]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  function handleTap(log: RoutineLog) {
    const p = parsePayload(log.notes);
    if (log.type === 'feed' && p.session_type === 'breastfeed') {
      setDetailLog(log);
      setDetailKind('breastfeed');
    } else if (log.type === 'diaper') {
      navigate(`/diaper/edit/${log.id}`);
    }
  }

  // ─── Daily stats ───────────────────────────────────────────────────────────
  const feedCount = logs.filter(l => l.type === 'feed').length;
  const diaperCount = logs.filter(l => l.type === 'diaper').length;
  const sleepLogs = logs.filter(l => l.type === 'sleep' && l.end_time);
  const sleepSec = sleepLogs.reduce((acc, l) => {
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

  // ─── Age context + intelligence ────────────────────────────────────────────
  const ageCtx = activeChild ? getAgeContext(activeChild.birth_date) : null;
  const insights = analyzeDayPatterns(logs);
  const ageMonths = ageCtx?.months ?? 99;
  const isNewborn = ageMonths < 3;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // ─── Contextual next-action suggestion ─────────────────────────────────────
  // Only shown when there's genuinely useful guidance — not as noise
  const nextActionSuggestion = (() => {
    if (logsLoading || !activeChild) return null;

    // If there's an active sleep session, don't suggest anything else
    if (ongoingSleep) return null;

    const lastFeed = logs.find(l => l.type === 'feed');
    if (lastFeed && ageCtx?.idealFeedIntervalMin) {
      const minSinceLastFeed = Math.floor(
        (Date.now() - new Date(lastFeed.start_time).getTime()) / 60000
      );
      const ideal = ageCtx.idealFeedIntervalMin;
      // Suggest feeding if past 80% of ideal interval
      if (minSinceLastFeed >= ideal * 0.8) {
        const h = Math.floor(minSinceLastFeed / 60);
        const m = minSinceLastFeed % 60;
        const label = h > 0 ? `${h}h${m > 0 ? `${m}m` : ''} desde a última mamada` : `${m}min desde a última mamada`;
        return { emoji: '🤱', text: label, path: '/breastfeeding' };
      }
    }

    // If no events at all today, suggest starting
    if (logs.length === 0) {
      return { emoji: '👶', text: 'Nenhum registro hoje ainda', path: null };
    }

    return null;
  })();

  // ─── Age-adapted metric cards (locked 4-card grid) ─────────────────────────
  const FEED_COLOR   = 'hsl(152,15%,55%)';
  const SLEEP_COLOR  = 'hsl(270,12%,42%)';
  const DIAPER_COLOR = 'hsl(32,80%,57%)';

  const metricsNewborn = [
    {
      emoji: '🤱', label: 'Mamadas',
      value: logsLoading ? '...' : feedCount > 0 ? `${feedCount}×` : '—',
      sub: insights.avgFeedIntervalMin
        ? `~${insights.avgFeedIntervalMin}min entre mamadas`
        : feedCount > 0 ? 'hoje' : undefined,
      empty: !logsLoading && feedCount === 0,
      color: FEED_COLOR,
    },
    {
      emoji: '🧷', label: 'Fraldas',
      value: logsLoading ? '...' : diaperCount > 0 ? `${diaperCount}×` : '—',
      sub: diaperCount > 0 ? 'hoje' : undefined,
      empty: !logsLoading && diaperCount === 0,
      color: DIAPER_COLOR,
    },
    {
      emoji: '😴', label: 'Sono',
      value: logsLoading ? '...' : sleepLabel ?? (ongoingSleep ? 'Em andamento' : '—'),
      sub: insights.hasLongSleep ? 'Sono longo' : lastSleepSub,
      empty: !logsLoading && !sleepLabel && !ongoingSleep,
      color: SLEEP_COLOR,
    },
    {
      emoji: '📅', label: 'Próx. consulta',
      value: '—', empty: true,
      color: 'hsl(var(--primary))',
    },
  ];

  const metricsOlder = [
    {
      emoji: '😴', label: 'Sono',
      value: logsLoading ? '...' : sleepLabel ?? (ongoingSleep ? 'Em andamento' : '—'),
      sub: insights.hasLongSleep ? 'Sono longo' : lastSleepSub,
      empty: !logsLoading && !sleepLabel && !ongoingSleep,
      color: SLEEP_COLOR,
    },
    {
      emoji: '🤱', label: 'Mamadas',
      value: logsLoading ? '...' : feedCount > 0 ? `${feedCount}×` : '—',
      sub: insights.avgFeedIntervalMin
        ? `~${insights.avgFeedIntervalMin}min entre mamadas`
        : feedCount > 0 ? 'hoje' : undefined,
      empty: !logsLoading && feedCount === 0,
      color: FEED_COLOR,
    },
    {
      emoji: '🧷', label: 'Fraldas',
      value: logsLoading ? '...' : diaperCount > 0 ? `${diaperCount}×` : '—',
      sub: diaperCount > 0 ? 'hoje' : undefined,
      empty: !logsLoading && diaperCount === 0,
      color: DIAPER_COLOR,
    },
    {
      emoji: '📅', label: 'Próx. consulta',
      value: '—', empty: true,
      color: 'hsl(var(--primary))',
    },
  ];

  const metrics = isNewborn ? metricsNewborn : metricsOlder;

  // ─── Data-driven quick actions (locked at 4) ───────────────────────────────
  const quickActions = getOrderedQuickActions(ageMonths);

  // Home preview: show first 5 events only — this is a preview, not a full history
  const previewLogs = logs.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header band */}
      <div className="px-5 pt-12 pb-5" style={{ backgroundColor: 'hsl(270,12%,38%)' }}>
        <p className="text-[13px] text-white/65 mb-2 font-nunito font-medium">{greeting} 👋</p>
        <ChildSwitcher />
        {ageCtx && (
          <p className="text-[11px] text-white/50 mt-1.5 font-nunito">{ageCtx.phaseHint}</p>
        )}
      </div>

      {childError && (
        <div
          className="mx-4 mt-4 px-4 py-3 rounded-2xl flex items-center gap-2"
          style={{
            backgroundColor: 'hsl(var(--destructive) / 0.1)',
            border: '1px solid hsl(var(--destructive) / 0.2)',
          }}
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
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : !activeChild ? (
        <div className="flex flex-col items-center justify-center px-4 pt-16 text-center">
          <p className="text-[17px] font-bold font-quicksand text-foreground">
            Nenhuma criança encontrada
          </p>
          <p className="text-sm mt-1.5 text-muted-foreground font-nunito">
            Complete o cadastro para ver o painel.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pb-10"
        >
          {/* Active session banner */}
          <div className="pt-3">
            <ActiveSessionBanner />
          </div>

          <div className="px-4 mt-4 space-y-6">

            {/* ── Resumo do dia — 2×2 grid ───────────────────────────────── */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 text-muted-foreground font-nunito">
                Resumo do dia
              </p>
              <div className="grid grid-cols-2 gap-3">
                {metrics.map(m => (
                  <SummaryMetricCard
                    key={m.label}
                    emoji={m.emoji}
                    label={m.label}
                    value={m.value}
                    sub={m.sub}
                    empty={m.empty}
                    accentColor={m.color}
                  />
                ))}
              </div>
            </div>

            {/* ── Próxima ação sugerida — only when relevant ─────────────── */}
            {nextActionSuggestion && !logsLoading && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1.5px solid hsl(var(--border))',
                }}
              >
                <span className="text-[20px]">{nextActionSuggestion.emoji}</span>
                <p className="flex-1 text-[13px] font-semibold font-nunito text-foreground">
                  {nextActionSuggestion.text}
                </p>
                {nextActionSuggestion.path && (
                  <button
                    onClick={() => navigate(nextActionSuggestion.path!)}
                    className="text-[12px] font-bold font-nunito px-3 py-1.5 rounded-xl text-white transition-all active:scale-95"
                    style={{ backgroundColor: 'hsl(152,15%,55%)' }}
                  >
                    Registrar
                  </button>
                )}
              </div>
            )}

            {/* ── Registrar agora — locked 4-tile grid ───────────────────── */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 text-muted-foreground font-nunito">
                Registrar agora
              </p>
              <div className="grid grid-cols-4 gap-2.5">
                {quickActions.map(a => (
                  <QuickActionTile
                    key={a.id}
                    emoji={a.emoji}
                    label={a.label}
                    accentColor={a.accentColorVar}
                    onClick={() => navigate(a.path)}
                  />
                ))}
              </div>
            </div>

            {/* ── Hoje — lightweight preview ─────────────────────────────── */}
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
                  style={{
                    backgroundColor: 'hsl(var(--destructive) / 0.08)',
                    border: '1px solid hsl(var(--destructive) / 0.15)',
                  }}
                >
                  <ExclamationCircleIcon className="w-4 h-4 text-destructive" />
                  <p className="text-xs text-destructive font-nunito">{logsError}</p>
                </div>
              )}

              {logsLoading ? (
                <div className="space-y-2.5">
                  {[0, 1, 2].map(i => <Skeleton key={i} className="h-[72px] rounded-2xl" />)}
                </div>
              ) : logs.length === 0 ? (
                <div className="rounded-2xl px-5 py-10 text-center bg-card border border-border">
                  <p className="text-4xl mb-3">🌤️</p>
                  <p className="text-[15px] font-bold font-quicksand text-foreground">
                    Dia ainda em branco
                  </p>
                  <p className="text-[13px] mt-1.5 text-muted-foreground font-nunito leading-snug">
                    Toque em um dos atalhos acima para começar.
                  </p>
                </div>
              ) : (
                <div className="pb-2">
                  {previewLogs.map((log, idx) => (
                    <EventCard
                      key={log.id}
                      log={log}
                      isLast={idx === previewLogs.length - 1}
                      onTap={handleTap}
                    />
                  ))}
                  {logs.length > 5 && (
                    <button
                      onClick={() => navigate('/routine')}
                      className="w-full py-3 text-[12px] font-semibold font-nunito text-center rounded-2xl mt-1 transition-colors"
                      style={{
                        color: 'hsl(var(--muted-foreground))',
                        backgroundColor: 'hsl(var(--muted))',
                      }}
                    >
                      Ver todos os {logs.length} eventos de hoje →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <FeedDetailSheet
        log={detailKind === 'breastfeed' ? detailLog : null}
        open={detailKind === 'breastfeed' && !!detailLog}
        onClose={() => { setDetailLog(null); setDetailKind(null); }}
        onUpdated={loadLogs}
      />
    </div>
  );
}
