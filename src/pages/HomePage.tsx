/**
 * HomePage — Ninho daily assistant home screen.
 *
 * Product role: answer "What matters now?" — not just summarize data.
 * - Single strong assistant message at the top
 * - Summary cards with contextual intelligence
 * - Consultation card: contextual empty state with real CTA
 * - Quick actions remain data-driven (locked at 4)
 * - Recent activity capped and useful
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { ChildSwitcher } from '@/components/home/ChildSwitcher';
import { fmtRangeDuration, fmtTimeSince } from '@/lib/routineUtils';
import { EventCard } from '@/components/events/EventCard';
import { ActiveSessionBanner } from '@/components/layout/ActiveSessionBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { SummaryMetricCard, QuickActionTile } from '@/components/ds';
import type { RoutineLog } from '@/lib/eventSystem';
import { analyzeDayPatterns, getAgeContext } from '@/lib/eventSystem';
import { getOrderedQuickActions } from '@/config/quickActions';

const SAGE        = 'hsl(152,15%,55%)';
const FEED_COLOR  = 'hsl(152,15%,55%)';
const SLEEP_COLOR = 'hsl(270,12%,42%)';
const DIAPER_COLOR= 'hsl(32,80%,57%)';

export default function HomePage() {
  const navigate = useNavigate();
  const { activeChild, loading: childLoading, error: childError } = useActiveChild();

  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  // ─── Load today's logs ────────────────────────────────────────────────────
  const loadLogs = useCallback(async () => {
    if (!activeChild) return;
    setLogsLoading(true);
    setLogsError(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('child_id', activeChild.id)
        .gte('start_time', today.toISOString())
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

  // ─── Derived stats ────────────────────────────────────────────────────────
  const feedLogs    = logs.filter(l => l.type === 'feed');
  const feedCount   = feedLogs.length;
  const diaperCount = logs.filter(l => l.type === 'diaper').length;
  const sleepLogs   = logs.filter(l => l.type === 'sleep' && l.end_time);
  const sleepSec    = sleepLogs.reduce((acc, l) => {
    return acc + Math.floor((new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000);
  }, 0);
  const sleepH     = Math.floor(sleepSec / 3600);
  const sleepM     = Math.floor((sleepSec % 3600) / 60);
  const sleepLabel = sleepSec > 0 ? (sleepH > 0 ? `${sleepH}h ${sleepM}m` : `${sleepM}m`) : null;
  const ongoingSleep = logs.find(l => l.type === 'sleep' && !l.end_time);
  const lastSleep    = [...logs].reverse().find(l => l.type === 'sleep');
  const lastFeed     = feedLogs[0]; // newest first

  // ─── Age context ──────────────────────────────────────────────────────────
  const ageCtx  = activeChild ? getAgeContext(activeChild.birth_date) : null;
  const insights = analyzeDayPatterns(logs);
  const ageMonths = ageCtx?.months ?? 99;
  const isNewborn = ageMonths < 3;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // ─── Assistant message — single, high-signal, never generic ──────────────
  // Priority: active session > overdue feed > no sleep logged > empty day
  const assistantMessage = (() => {
    if (logsLoading || !activeChild) return null;

    if (ongoingSleep) {
      return {
        emoji: '😴',
        text: 'Sono em andamento',
        path: '/sleep',
        cta: 'Ver sono',
        tone: 'info' as const,
      };
    }

    if (lastFeed && ageCtx?.idealFeedIntervalMin) {
      const minSince = Math.floor(
        (Date.now() - new Date(lastFeed.start_time).getTime()) / 60000
      );
      const ideal = ageCtx.idealFeedIntervalMin;
      if (minSince >= ideal * 0.9) {
        const h = Math.floor(minSince / 60);
        const m = minSince % 60;
        const timeStr = h > 0 ? `${h}h${m > 0 ? `${m}m` : ''}` : `${m}min`;
        return {
          emoji: '🤱',
          text: `Última mamada há ${timeStr}`,
          path: '/breastfeeding',
          cta: 'Registrar',
          tone: 'nudge' as const,
        };
      }
    }

    // No sleep at all today after noon
    if (logs.length > 0 && sleepSec === 0 && !ongoingSleep && new Date().getHours() >= 12) {
      return {
        emoji: '😴',
        text: 'Nenhum sono registrado hoje',
        path: '/sleep',
        cta: 'Registrar',
        tone: 'nudge' as const,
      };
    }

    // Truly empty day
    if (logs.length === 0) {
      return {
        emoji: '👶',
        text: 'Registre a primeira atividade do dia',
        path: '/breastfeeding',
        cta: 'Começar',
        tone: 'empty' as const,
      };
    }

    return null;
  })();

  // ─── Supporting lines for each metric card ────────────────────────────────
  const feedSub = (() => {
    if (feedCount === 0) {
      if (lastFeed) return `Última mamada há ${fmtTimeSince(lastFeed.start_time)}`;
      return 'Nenhuma mamada registrada hoje';
    }
    if (insights.avgFeedIntervalMin) return `~${insights.avgFeedIntervalMin}min entre mamadas`;
    if (lastFeed) return `Última há ${fmtTimeSince(lastFeed.start_time)}`;
    return feedCount === 1 ? '1 mamada hoje' : `${feedCount} mamadas hoje`;
  })();

  const sleepSub = (() => {
    if (ongoingSleep) return 'Em andamento agora';
    if (sleepSec === 0) {
      if (new Date().getHours() >= 12) return 'Nenhum sono registrado hoje';
      return 'Ainda cedo para registrar sono';
    }
    if (insights.hasLongSleep) return 'Sono longo — ótimo!';
    if (lastSleep?.end_time) return `Último: ${fmtRangeDuration(lastSleep.start_time, lastSleep.end_time)}`;
    return 'Sono registrado hoje';
  })();

  const diaperSub = (() => {
    if (diaperCount === 0) return 'Nenhuma troca registrada hoje';
    if (diaperCount === 1) return '1 troca hoje';
    return `${diaperCount} trocas hoje`;
  })();

  // ─── Metric cards ─────────────────────────────────────────────────────────
  const metricsNewborn = [
    {
      emoji: '🤱', label: 'Mamadas',
      value: logsLoading ? '…' : `${feedCount}`,
      sub: logsLoading ? '' : feedSub,
      empty: !logsLoading && feedCount === 0,
      color: FEED_COLOR,
    },
    {
      emoji: '🧷', label: 'Fraldas',
      value: logsLoading ? '…' : `${diaperCount}`,
      sub: logsLoading ? '' : diaperSub,
      empty: !logsLoading && diaperCount === 0,
      color: DIAPER_COLOR,
    },
    {
      emoji: '😴', label: 'Sono',
      value: logsLoading ? '…' : (sleepLabel ?? (ongoingSleep ? '…' : '0')),
      sub: logsLoading ? '' : sleepSub,
      empty: !logsLoading && !sleepLabel && !ongoingSleep,
      color: SLEEP_COLOR,
    },
    {
      emoji: '📅', label: 'Consulta',
      value: '—',
      sub: 'Sem consulta agendada',
      empty: true,
      color: 'hsl(var(--primary))',
      action: { label: 'Agendar', path: '/health' },
    },
  ];

  const metricsOlder = [
    {
      emoji: '😴', label: 'Sono',
      value: logsLoading ? '…' : (sleepLabel ?? (ongoingSleep ? '…' : '0')),
      sub: logsLoading ? '' : sleepSub,
      empty: !logsLoading && !sleepLabel && !ongoingSleep,
      color: SLEEP_COLOR,
    },
    {
      emoji: '🤱', label: 'Mamadas',
      value: logsLoading ? '…' : `${feedCount}`,
      sub: logsLoading ? '' : feedSub,
      empty: !logsLoading && feedCount === 0,
      color: FEED_COLOR,
    },
    {
      emoji: '🧷', label: 'Fraldas',
      value: logsLoading ? '…' : `${diaperCount}`,
      sub: logsLoading ? '' : diaperSub,
      empty: !logsLoading && diaperCount === 0,
      color: DIAPER_COLOR,
    },
    {
      emoji: '📅', label: 'Consulta',
      value: '—',
      sub: 'Sem consulta agendada',
      empty: true,
      color: 'hsl(var(--primary))',
      action: { label: 'Agendar', path: '/health' },
    },
  ];

  const metrics = isNewborn ? metricsNewborn : metricsOlder;

  // ─── Quick actions ────────────────────────────────────────────────────────
  const quickActions = getOrderedQuickActions(ageMonths);

  // Home preview: latest 5 events only
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

            {/* ── Resumo do dia — 2×2 grid ─────────────────────────── */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 text-muted-foreground font-nunito">
                Resumo do dia
              </p>
              <div className="grid grid-cols-2 gap-3">
                {metrics.map(m => (
                  <div key={m.label} className="flex flex-col">
                    <SummaryMetricCard
                      emoji={m.emoji}
                      label={m.label}
                      value={m.value}
                      sub={m.sub}
                      empty={m.empty}
                      accentColor={m.color}
                    />
                    {'action' in m && m.action && m.empty && (
                      <button
                        onClick={() => navigate(m.action!.path)}
                        className="mt-1.5 w-full py-2 rounded-xl text-[11px] font-bold font-nunito text-center transition-all active:scale-95"
                        style={{
                          backgroundColor: 'hsl(var(--muted))',
                          color: 'hsl(var(--muted-foreground))',
                        }}
                      >
                        {m.action!.label}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Assistant guidance — single high-signal message ───── */}
            {assistantMessage && !logsLoading && (
              <div
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                style={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1.5px solid hsl(var(--border))',
                }}
              >
                <span className="text-[20px] flex-shrink-0">{assistantMessage.emoji}</span>
                <p className="flex-1 text-[13px] font-semibold font-nunito text-foreground leading-snug">
                  {assistantMessage.text}
                </p>
                {assistantMessage.path && assistantMessage.cta && (
                  <button
                    onClick={() => navigate(assistantMessage.path!)}
                    className="text-[12px] font-bold font-nunito px-3 py-1.5 rounded-xl text-white transition-all active:scale-95 flex-shrink-0"
                    style={{ backgroundColor: SAGE }}
                  >
                    {assistantMessage.cta}
                  </button>
                )}
              </div>
            )}

            {/* ── Registrar agora — locked 4-tile grid ──────────────── */}
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

            {/* ── Hoje — lightweight preview ────────────────────────── */}
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
                    O dia ainda está em branco
                  </p>
                  <p className="text-[13px] mt-1.5 text-muted-foreground font-nunito leading-snug">
                    Use os atalhos acima para registrar a primeira atividade.
                  </p>
                </div>
              ) : (
                <div className="pb-2">
                  {previewLogs.map((log, idx) => (
                    <EventCard
                      key={log.id}
                      log={log}
                      isLast={idx === previewLogs.length - 1}
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
    </div>
  );
}
