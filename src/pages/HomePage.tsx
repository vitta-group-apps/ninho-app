/**
 * HomePage — Ninho Daily Decision Center
 *
 * Role: Answer "What matters now?" in under 3 seconds.
 *
 * Structure:
 *   1. Header: greeting + child switcher + age context
 *   2. Active session banner
 *   3. Main assistant block: ONE message, ONE action (priority engine driven)
 *   4. Daily summary: 4 metric cards with truthful, contextual values
 *   5. Attention: up to 3 items (deduplicated from main block)
 *   6. Quick actions: 4 shortcuts ordered by age relevance
 *   7. Recent activity: last 5 events (only if records exist)
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
import { runPriorityEngine } from '@/lib/priorityEngine';

const SAGE         = 'hsl(152,15%,50%)';
const FEED_COLOR   = 'hsl(152,15%,55%)';
const SLEEP_COLOR  = 'hsl(270,12%,42%)';
const DIAPER_COLOR = 'hsl(32,80%,57%)';
const AMBER        = 'hsl(37,90%,55%)';

// ─── Attention item ───────────────────────────────────────────────────────

function AttentionItem({
  emoji, title, body, ctaLabel, onCta,
}: {
  emoji: string; title: string; body: string;
  ctaLabel?: string; onCta?: () => void;
}) {
  return (
    <button
      onClick={onCta}
      className="w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.99]"
      style={{
        backgroundColor: `color-mix(in srgb, ${AMBER} 7%, hsl(var(--card)))`,
        border: `1px solid color-mix(in srgb, ${AMBER} 20%, transparent)`,
      }}
    >
      <span className="text-[18px] mt-0.5 flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold font-quicksand text-foreground leading-snug">{title}</p>
        <p className="text-[12px] text-muted-foreground font-nunito mt-0.5 leading-snug">{body}</p>
      </div>
      {ctaLabel && (
        <span
          className="text-[11px] font-bold font-nunito px-2.5 py-1.5 rounded-xl text-white flex-shrink-0 self-center"
          style={{ backgroundColor: AMBER }}
        >
          {ctaLabel}
        </span>
      )}
    </button>
  );
}

// ─── Consultation card (special behavior) ────────────────────────────────

function ConsultationCard({ onSchedule }: { onSchedule: () => void }) {
  return (
    <div
      className="flex-1 min-w-0 rounded-2xl overflow-hidden border"
      style={{ borderColor: `color-mix(in srgb, ${SAGE} 20%, hsl(var(--border)))` }}
    >
      <div className="px-4 pt-4 pb-3 bg-card flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] flex-shrink-0"
            style={{ backgroundColor: `color-mix(in srgb, ${SAGE} 16%, transparent)` }}
          >
            📅
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-nunito leading-none">
            Consulta
          </p>
        </div>
        {/* Empty state content */}
        <div className="flex-1">
          <p className="text-[13px] font-bold font-quicksand text-foreground leading-tight">
            Sem consulta agendada
          </p>
          <p className="text-[10px] text-muted-foreground font-nunito mt-1 leading-tight">
            Agende o próximo acompanhamento
          </p>
        </div>
        {/* CTA */}
        <button
          onClick={onSchedule}
          className="mt-3 w-full py-2 rounded-xl text-[11px] font-bold font-nunito text-center transition-all active:scale-95"
          style={{
            backgroundColor: `color-mix(in srgb, ${SAGE} 14%, transparent)`,
            color: SAGE,
            border: `1px solid color-mix(in srgb, ${SAGE} 25%, transparent)`,
          }}
        >
          Agendar
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const { activeChild, loading: childLoading, error: childError } = useActiveChild();

  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  // Consultation count — used by priority engine to avoid false "no consultation" alerts
  const [consultationCount, setConsultationCount] = useState(-1);
  const [appliedVaccineCount, setAppliedVaccineCount] = useState(-1);

  // ─── Load today's logs ─────────────────────────────────────────────────
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

  // ─── Derived states ───────────────────────────────────────────────────
  const feedLogs    = logs.filter(l => l.type === 'feed');
  const feedCount   = feedLogs.length;
  const diaperCount = logs.filter(l => l.type === 'diaper').length;
  const sleepLogs   = logs.filter(l => l.type === 'sleep' && l.end_time);
  const sleepSec    = sleepLogs.reduce((acc, l) => {
    return acc + Math.floor(
      (new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000
    );
  }, 0);
  const sleepH       = Math.floor(sleepSec / 3600);
  const sleepM       = Math.floor((sleepSec % 3600) / 60);
  const sleepLabel   = sleepSec > 0 ? (sleepH > 0 ? `${sleepH}h ${sleepM}m` : `${sleepM}m`) : null;
  const ongoingSleep = logs.find(l => l.type === 'sleep' && !l.end_time);
  const lastSleep    = [...logs].reverse().find(l => l.type === 'sleep');
  const lastFeed     = feedLogs[0];

  const ageCtx    = activeChild ? getAgeContext(activeChild.birth_date) : null;
  const insights  = analyzeDayPatterns(logs);
  const ageMonths = ageCtx?.months ?? 99;
  const isNewborn = ageMonths < 3;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  // ─── Priority engine ───────────────────────────────────────────────────
  const { mainMessage, attentionItems } = runPriorityEngine({
    logs,
    logsLoading,
    activeChild,
    hour,
  });

  // ─── Metric card sublines ──────────────────────────────────────────────
  const feedSub = (() => {
    if (feedCount === 0) return 'Nenhum registro hoje';
    if (insights.avgFeedIntervalMin) return `Intervalo médio: ${insights.avgFeedIntervalMin}min`;
    if (lastFeed) return `Última há ${fmtTimeSince(lastFeed.start_time)}`;
    return feedCount === 1 ? '1 registro' : `${feedCount} registros`;
  })();

  const sleepSub = (() => {
    if (ongoingSleep) return 'Em andamento agora';
    if (sleepSec === 0) return hour >= 12 ? 'Nenhum sono hoje' : 'Ainda cedo no dia';
    if (insights.hasLongSleep) return 'Sono longo registrado';
    if (lastSleep?.end_time) return `Último: ${fmtRangeDuration(lastSleep.start_time, lastSleep.end_time)}`;
    return 'Sono registrado';
  })();

  const diaperSub = (() => {
    if (diaperCount === 0) return 'Nenhum registro hoje';
    return diaperCount === 1 ? '1 troca registrada' : `${diaperCount} trocas hoje`;
  })();

  // ─── Metric cards ──────────────────────────────────────────────────────
  // Newborn: feeds first | Older: sleep first
  const metricsNewborn = [
    {
      id: 'feeds', emoji: '🤱', label: 'Mamadas',
      value: logsLoading ? '…' : `${feedCount}`,
      sub: logsLoading ? '' : feedSub,
      empty: !logsLoading && feedCount === 0, color: FEED_COLOR,
    },
    {
      id: 'diapers', emoji: '🧷', label: 'Fraldas',
      value: logsLoading ? '…' : `${diaperCount}`,
      sub: logsLoading ? '' : diaperSub,
      empty: !logsLoading && diaperCount === 0, color: DIAPER_COLOR,
    },
    {
      id: 'sleep', emoji: '😴', label: 'Sono',
      value: logsLoading ? '…' : (sleepLabel ?? (ongoingSleep ? '…' : '0')),
      sub: logsLoading ? '' : sleepSub,
      empty: !logsLoading && !sleepLabel && !ongoingSleep, color: SLEEP_COLOR,
    },
  ];

  const metricsOlder = [
    {
      id: 'sleep', emoji: '😴', label: 'Sono',
      value: logsLoading ? '…' : (sleepLabel ?? (ongoingSleep ? '…' : '0')),
      sub: logsLoading ? '' : sleepSub,
      empty: !logsLoading && !sleepLabel && !ongoingSleep, color: SLEEP_COLOR,
    },
    {
      id: 'feeds', emoji: '🤱', label: 'Mamadas',
      value: logsLoading ? '…' : `${feedCount}`,
      sub: logsLoading ? '' : feedSub,
      empty: !logsLoading && feedCount === 0, color: FEED_COLOR,
    },
    {
      id: 'diapers', emoji: '🧷', label: 'Fraldas',
      value: logsLoading ? '…' : `${diaperCount}`,
      sub: logsLoading ? '' : diaperSub,
      empty: !logsLoading && diaperCount === 0, color: DIAPER_COLOR,
    },
  ];

  const metrics = isNewborn ? metricsNewborn : metricsOlder;
  const quickActions = getOrderedQuickActions(ageMonths);
  const previewLogs  = logs.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div
        className="px-5 pb-5"
        style={{
          paddingTop: 'max(48px, env(safe-area-inset-top))',
          backgroundColor: 'hsl(270,12%,38%)',
        }}
      >
        <p className="text-[12px] text-white/60 mb-2 font-nunito font-medium tracking-wide">
          {greeting} 👋
        </p>
        <ChildSwitcher />
        {ageCtx && (
          <p className="text-[11px] text-white/45 mt-1.5 font-nunito">{ageCtx.phaseHint}</p>
        )}
      </div>

      {/* Error */}
      {childError && (
        <div
          className="mx-4 mt-4 px-4 py-3 rounded-2xl flex items-center gap-2"
          style={{
            backgroundColor: 'hsl(var(--destructive) / 0.08)',
            border: '1px solid hsl(var(--destructive) / 0.18)',
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
        <div className="flex flex-col items-center justify-center px-6 pt-16 text-center">
          <p className="text-[17px] font-bold font-quicksand text-foreground">
            Nenhuma criança encontrada
          </p>
          <p className="text-[13px] mt-1.5 text-muted-foreground font-nunito">
            Complete o cadastro para ver o painel.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="pb-10"
        >
          {/* Active session banner */}
          <div className="pt-3">
            <ActiveSessionBanner />
          </div>

          <div className="px-4 mt-4 space-y-6">

            {/* ── 1. MAIN ASSISTANT BLOCK ──────────────────────────── */}
            {!logsLoading && mainMessage && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1.5px solid hsl(var(--border))' }}
              >
                <div className="px-4 py-4 bg-card">
                  <div className="flex items-start gap-3">
                    <span className="text-[22px] flex-shrink-0 mt-0.5">{mainMessage.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold font-quicksand text-foreground leading-tight">
                        {mainMessage.title}
                      </p>
                      <p className="text-[12px] text-muted-foreground font-nunito mt-1 leading-snug">
                        {mainMessage.body}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(mainMessage.path)}
                    className="mt-3 w-full py-2.5 rounded-xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95"
                    style={{ backgroundColor: SAGE }}
                  >
                    {mainMessage.ctaLabel}
                  </button>
                </div>
              </div>
            )}

            {/* ── 2. DAILY SUMMARY ─────────────────────────────────── */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 text-muted-foreground font-nunito">
                Resumo do dia
              </p>
              {/* 3 routine metrics in a row */}
              <div className="flex gap-3 mb-3">
                {metrics.map(m => (
                  <SummaryMetricCard
                    key={m.id}
                    emoji={m.emoji}
                    label={m.label}
                    value={m.value}
                    sub={m.sub}
                    empty={m.empty}
                    accentColor={m.color}
                  />
                ))}
              </div>
              {/* Consultation card — full-width, contextual empty state */}
              <ConsultationCard onSchedule={() => navigate('/health')} />
            </div>

            {/* ── 3. ATTENTION — what needs action ─────────────────── */}
            {!logsLoading && attentionItems.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 text-muted-foreground font-nunito">
                  Atenção
                </p>
                <div className="space-y-2">
                  {attentionItems.map(item => (
                    <AttentionItem
                      key={item.id}
                      emoji={item.emoji}
                      title={item.title}
                      body={item.body}
                      ctaLabel={item.ctaLabel}
                      onCta={() => navigate(item.path)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── 4. QUICK ACTIONS ─────────────────────────────────── */}
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

            {/* ── 5. RECENT ACTIVITY ───────────────────────────────── */}
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-nunito">
                  Atividade recente
                </p>
                <p className="text-[11px] text-muted-foreground font-nunito capitalize">
                  {new Date().toLocaleDateString('pt-BR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
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
                    Nenhum registro ainda
                  </p>
                  <p className="text-[13px] mt-1.5 text-muted-foreground font-nunito leading-snug">
                    Use os atalhos acima para registrar a primeira atividade do dia.
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
                      Ver todos os {logs.length} eventos →
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
