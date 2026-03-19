/**
 * HomePage — Ninho daily assistant home screen.
 *
 * Product role: answer "What matters now?" — not summarize data.
 *  1. Header: greeting + child + age context
 *  2. Main assistant block: ONE message, ONE action — always contextual
 *  3. Daily summary: 4 metric cards — strong number, useful subtext
 *  4. Priorities: what needs attention (clickable items)
 *  5. Quick actions: 4 locked shortcuts
 *  6. Recent activity: last 5 events, only if useful
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

const SAGE         = 'hsl(152,15%,55%)';
const FEED_COLOR   = 'hsl(152,15%,55%)';
const SLEEP_COLOR  = 'hsl(270,12%,42%)';
const DIAPER_COLOR = 'hsl(32,80%,57%)';
const AMBER        = 'hsl(37,90%,55%)';

// ─── Priority item ─────────────────────────────────────────────────────────

function PriorityItem({
  emoji,
  title,
  body,
  ctaLabel,
  onCta,
}: {
  emoji: string;
  title: string;
  body: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  return (
    <button
      onClick={onCta}
      className="w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.99]"
      style={{
        backgroundColor: `color-mix(in srgb, ${AMBER} 7%, hsl(var(--card)))`,
        border: `1px solid color-mix(in srgb, ${AMBER} 18%, transparent)`,
      }}
    >
      <span className="text-[18px] mt-0.5 flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold font-quicksand text-foreground">{title}</p>
        <p className="text-[12px] text-muted-foreground font-nunito mt-0.5 leading-snug">{body}</p>
      </div>
      {ctaLabel && (
        <span
          className="text-[11px] font-bold font-nunito px-2.5 py-1.5 rounded-xl text-white flex-shrink-0"
          style={{ backgroundColor: AMBER }}
        >
          {ctaLabel}
        </span>
      )}
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const { activeChild, loading: childLoading, error: childError } = useActiveChild();

  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  // ─── Load today's logs ──────────────────────────────────────────────────
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

  // ─── Derived stats ──────────────────────────────────────────────────────
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

  // ─── Age context ────────────────────────────────────────────────────────
  const ageCtx    = activeChild ? getAgeContext(activeChild.birth_date) : null;
  const insights  = analyzeDayPatterns(logs);
  const ageMonths = ageCtx?.months ?? 99;
  const isNewborn = ageMonths < 3;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  // ─── Main assistant message — ONE message, always contextual ────────────
  // Priority: active session → overdue feed → no sleep today → empty day
  const assistantMessage = (() => {
    if (logsLoading || !activeChild) return null;

    // 1. Active sleep session
    if (ongoingSleep) {
      const sinceStr = fmtTimeSince(ongoingSleep.start_time);
      return {
        emoji: '😴',
        title: 'Sono em andamento',
        body: `Iniciado há ${sinceStr}. Toque para encerrar quando acordar.`,
        path: '/sleep',
        cta: 'Ver sono',
        tone: 'info' as const,
      };
    }

    // 2. Feed overdue
    if (lastFeed && ageCtx?.idealFeedIntervalMin) {
      const minSince = Math.floor((Date.now() - new Date(lastFeed.start_time).getTime()) / 60000);
      const ideal    = ageCtx.idealFeedIntervalMin;
      if (minSince >= ideal * 0.9) {
        const h = Math.floor(minSince / 60);
        const m = minSince % 60;
        const timeStr = h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
        return {
          emoji: '🤱',
          title: `Última mamada há ${timeStr}`,
          body: 'Pode ser hora de alimentar novamente.',
          path: '/breastfeeding',
          cta: 'Registrar',
          tone: 'nudge' as const,
        };
      }
    }

    // 3. No sleep logged today after noon
    if (logs.length > 0 && sleepSec === 0 && !ongoingSleep && hour >= 12) {
      return {
        emoji: '😴',
        title: 'Nenhum sono registrado hoje',
        body: 'Registre os períodos de sono para acompanhar o descanso.',
        path: '/sleep',
        cta: 'Registrar',
        tone: 'nudge' as const,
      };
    }

    // 4. Truly empty day
    if (logs.length === 0) {
      return {
        emoji: '👶',
        title: 'Ainda não há registros hoje',
        body: 'Comece registrando a primeira atividade do dia.',
        path: '/breastfeeding',
        cta: 'Registrar agora',
        tone: 'empty' as const,
      };
    }

    return null;
  })();

  // ─── Priority items (what needs attention) ──────────────────────────────
  const priorities: { emoji: string; title: string; body: string; cta: string; path: string }[] = [];

  if (!logsLoading && activeChild) {
    // No consultation scheduled
    priorities.push({
      emoji: '📅',
      title: 'Nenhuma consulta agendada',
      body: 'Manter o calendário de consultas em dia ajuda no acompanhamento do desenvolvimento.',
      cta: 'Agendar',
      path: '/saude',
    });

    // Upcoming vaccine hint (age-based, simple rule)
    if (ageMonths <= 24) {
      priorities.push({
        emoji: '💉',
        title: 'Verifique o calendário de vacinas',
        body: `Vacinas são importantes nessa fase de crescimento. Confira o que está pendente.`,
        cta: 'Ver vacinas',
        path: '/saude',
      });
    }

    // Low diaper count after evening
    if (diaperCount < 4 && hour >= 18) {
      priorities.push({
        emoji: '🧷',
        title: 'Poucas trocas de fralda hoje',
        body: `Foram ${diaperCount} troca${diaperCount === 1 ? '' : 's'} registradas. Verifique se está adequado para a idade.`,
        cta: 'Registrar',
        path: '/diaper',
      });
    }
  }

  // ─── Supporting sublines for metric cards ───────────────────────────────
  const feedSub = (() => {
    if (feedCount === 0) return 'Nenhum registro hoje';
    if (insights.avgFeedIntervalMin) return `Intervalo médio: ${insights.avgFeedIntervalMin}min`;
    if (lastFeed) return `Última há ${fmtTimeSince(lastFeed.start_time)}`;
    return feedCount === 1 ? '1 registro hoje' : `${feedCount} registros hoje`;
  })();

  const sleepSub = (() => {
    if (ongoingSleep) return 'Em andamento agora';
    if (sleepSec === 0) {
      if (hour >= 12) return 'Nenhum sono registrado hoje';
      return 'Ainda cedo no dia';
    }
    if (insights.hasLongSleep) return 'Incluindo sono longo';
    if (lastSleep?.end_time) return `Último: ${fmtRangeDuration(lastSleep.start_time, lastSleep.end_time)}`;
    return 'Sono registrado';
  })();

  const diaperSub = (() => {
    if (diaperCount === 0) return 'Nenhum registro hoje';
    return diaperCount === 1 ? '1 troca hoje' : `${diaperCount} trocas hoje`;
  })();

  // ─── Metric cards ────────────────────────────────────────────────────────
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
      value: 'Nenhuma',
      sub: 'Nenhuma consulta agendada',
      empty: true,
      color: 'hsl(var(--primary))',
      action: { label: 'Agendar', path: '/saude' },
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
      value: 'Nenhuma',
      sub: 'Nenhuma consulta agendada',
      empty: true,
      color: 'hsl(var(--primary))',
      action: { label: 'Agendar', path: '/saude' },
    },
  ];

  const metrics = isNewborn ? metricsNewborn : metricsOlder;
  const quickActions = getOrderedQuickActions(ageMonths);
  const previewLogs  = logs.slice(0, 5);

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
          <Skeleton className="h-28 rounded-2xl" />
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

            {/* ── 1. MAIN ASSISTANT BLOCK ────────────────────────────── */}
            {!logsLoading && assistantMessage && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1.5px solid hsl(var(--border))' }}
              >
                <div
                  className="px-4 py-4"
                  style={{ backgroundColor: 'hsl(var(--card))' }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-[22px] flex-shrink-0 mt-0.5">{assistantMessage.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold font-quicksand text-foreground leading-tight">
                        {assistantMessage.title}
                      </p>
                      <p className="text-[12px] text-muted-foreground font-nunito mt-1 leading-snug">
                        {assistantMessage.body}
                      </p>
                    </div>
                  </div>
                  {assistantMessage.path && assistantMessage.cta && (
                    <button
                      onClick={() => navigate(assistantMessage.path!)}
                      className="mt-3 w-full py-2.5 rounded-xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95"
                      style={{ backgroundColor: SAGE }}
                    >
                      {assistantMessage.cta}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── 2. DAILY SUMMARY ──────────────────────────────────── */}
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

            {/* ── 3. PRIORITIES — what needs attention ──────────────── */}
            {!logsLoading && priorities.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 text-muted-foreground font-nunito">
                  Atenção
                </p>
                <div className="space-y-2">
                  {priorities.map((p, i) => (
                    <PriorityItem
                      key={i}
                      emoji={p.emoji}
                      title={p.title}
                      body={p.body}
                      ctaLabel={p.cta}
                      onCta={() => navigate(p.path)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── 4. QUICK ACTIONS ──────────────────────────────────── */}
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

            {/* ── 5. RECENT ACTIVITY ────────────────────────────────── */}
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-nunito">
                  Atividade recente
                </p>
                <p className="text-[11px] text-muted-foreground font-nunito capitalize">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
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
                    O dia ainda não começou
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
                      onClick={() => navigate('/rotina')}
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
