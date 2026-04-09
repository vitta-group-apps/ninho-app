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

import { useHomeData } from '@/hooks/useHomeData';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExclamationCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { useAuth } from '@/hooks/useAuth';
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

const FEED_COLOR   = '#789687';
const SLEEP_COLOR  = '#806e84';
const DIAPER_COLOR = '#C8894A';
const AMBER_BG     = '#FDF3E9';
const AMBER_BORDER = '#f0d5b0';
const SAGE         = '#789687';

function AttentionItem({
  emoji, title, body, ctaLabel, onCta
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
      style={{ backgroundColor: AMBER_BG, border: `1px solid ${AMBER_BORDER}` }}
    >
      <span className="text-[18px] mt-0.5 flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold font-quicksand leading-snug" style={{ color: '#2C2C2C' }}>
          {title}
        </p>
        <p className="text-[12px] font-nunito mt-0.5 leading-snug" style={{ color: '#7A7A7A' }}>
          {body}
        </p>
      </div>
      {ctaLabel && (
        <span
          className="text-[11px] font-bold font-nunito px-2.5 py-1.5 rounded-xl text-white flex-shrink-0 self-center"
          style={{ backgroundColor: DIAPER_COLOR }}
        >
          {ctaLabel}
        </span>
      )}
    </button>
  );
}

function ConsultationCard({
  onSchedule, nextDate, hasHistory
}: {
  onSchedule: () => void;
  nextDate?: string | null;
  hasHistory?: boolean;
}) {
  const upcoming = nextDate
    ? new Date(nextDate + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long',
      })
    : null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
    >
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] flex-shrink-0"
            style={{ backgroundColor: '#ebf0ed' }}>
            📅
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest font-nunito"
            style={{ color: '#7A7A7A' }}>
            Próxima consulta
          </p>
        </div>

        {upcoming ? (
          <>
            <p className="text-[13px] font-bold font-quicksand leading-tight" style={{ color: '#2C2C2C' }}>
              {upcoming}
            </p>
            <p className="text-[10px] font-nunito mt-1 leading-tight" style={{ color: '#7A7A7A' }}>
              Próxima consulta agendada
            </p>
          </>
        ) : hasHistory ? (
          <>
            <p className="text-[13px] font-bold font-quicksand leading-tight" style={{ color: '#2C2C2C' }}>
              Histórico registrado
            </p>
            <p className="text-[10px] font-nunito mt-1 leading-tight" style={{ color: '#7A7A7A' }}>
              Nenhuma próxima consulta
            </p>
          </>
        ) : (
          <>
            <p className="text-[13px] font-bold font-quicksand leading-tight" style={{ color: '#2C2C2C' }}>
              Sem consulta agendada
            </p>
            <p className="text-[10px] font-nunito mt-1 leading-tight" style={{ color: '#7A7A7A' }}>
              Agende o próximo acompanhamento
            </p>
          </>
        )}

        <button
          onClick={onSchedule}
          className="mt-3 w-full py-2 rounded-xl text-[11px] font-bold font-nunito text-center transition-all active:scale-95"
          style={{ backgroundColor: '#ebf0ed', color: SAGE, border: '1px solid #ccd9d3' }}
        >
          {upcoming ? 'Ver detalhes' : 'Agendar'}
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { activeChild, loading: childLoading, error: childError } = useActiveChild();

  const {
    logs,
    logsLoading,
    logsError,
    consultationCount,
    appliedVaccineCount,
    nextConsultDate,
    hasConsultHistory,
    reload: reloadLogs,
  } = useHomeData(activeChild?.id);

  const feedLogs    = logs.filter(l => l.type === 'feed');
  const feedCount   = feedLogs.length;
  const diaperCount = logs.filter(l => l.type === 'diaper').length;
  const sleepLogs   = logs.filter(l => l.type === 'sleep' && l.end_time);
  const sleepSec    = sleepLogs.reduce((acc, l) =>
    acc + Math.floor((new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000), 0);
  const sleepH      = Math.floor(sleepSec / 3600);
  const sleepM      = Math.floor((sleepSec % 3600) / 60);
  const sleepLabel  = sleepSec > 0 ? (sleepH > 0 ? `${sleepH}h ${sleepM}m` : `${sleepM}m`) : null;
  const ongoingSleep = logs.find(l => l.type === 'sleep' && !l.end_time);
  const lastSleep   = [...logs].reverse().find(l => l.type === 'sleep');
  const lastFeed    = feedLogs[0];

  const ageCtx    = activeChild ? getAgeContext(activeChild.birth_date) : null;
  const insights  = analyzeDayPatterns(logs);
  const ageMonths = ageCtx?.months ?? 99;
  const isNewborn = ageMonths < 3;

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  const { mainMessage, attentionItems } = runPriorityEngine({
    logs, logsLoading, activeChild, hour, consultationCount, appliedVaccineCount,
  });

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

  const diaperSub = diaperCount === 0
    ? 'Nenhum registro hoje'
    : diaperCount === 1 ? '1 troca registrada' : `${diaperCount} trocas hoje`;

  const metricsNewborn = [
    { id: 'feeds',   emoji: '🤱', label: 'Mamadas', value: logsLoading ? '…' : `${feedCount}`,   sub: logsLoading ? '' : feedSub,   empty: !logsLoading && feedCount === 0,                             color: FEED_COLOR },
    { id: 'diapers', emoji: '🧷', label: 'Fraldas', value: logsLoading ? '…' : `${diaperCount}`, sub: logsLoading ? '' : diaperSub, empty: !logsLoading && diaperCount === 0,                           color: DIAPER_COLOR },
    { id: 'sleep',   emoji: '😴', label: 'Sono',    value: logsLoading ? '…' : sleepLabel ?? (ongoingSleep ? '…' : '0'), sub: logsLoading ? '' : sleepSub, empty: !logsLoading && !sleepLabel && !ongoingSleep, color: SLEEP_COLOR },
  ];

  const metricsOlder = [
    { id: 'sleep',   emoji: '😴', label: 'Sono',    value: logsLoading ? '…' : sleepLabel ?? (ongoingSleep ? '…' : '0'), sub: logsLoading ? '' : sleepSub, empty: !logsLoading && !sleepLabel && !ongoingSleep, color: SLEEP_COLOR },
    { id: 'feeds',   emoji: '🤱', label: 'Mamadas', value: logsLoading ? '…' : `${feedCount}`,   sub: logsLoading ? '' : feedSub,   empty: !logsLoading && feedCount === 0,                             color: FEED_COLOR },
    { id: 'diapers', emoji: '🧷', label: 'Fraldas', value: logsLoading ? '…' : `${diaperCount}`, sub: logsLoading ? '' : diaperSub, empty: !logsLoading && diaperCount === 0,                           color: DIAPER_COLOR },
  ];

  const metrics      = isNewborn ? metricsNewborn : metricsOlder;
  const quickActions = getOrderedQuickActions(ageMonths);
  const previewLogs  = logs.slice(0, 5);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F5F0' }}>

     {/* HEADER */}
<div
  className="px-5 pb-6 flex-shrink-0"
  style={{
    paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
    minHeight: 52,
    backgroundColor: '#806e84',
    borderRadius: '0 0 24px 24px',
  }}
>
  <div className="flex items-start justify-between gap-3 mb-2">
    <p
      className="text-[13px] font-semibold font-nunito"
      style={{ color: 'rgba(255,255,255,0.65)' }}
    >
      {greeting}{firstName ? `, ${firstName}` : ''} 👋
    </p>

    <button
      onClick={() => navigate('/settings')}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
      style={{
        backgroundColor: 'rgba(255,255,255,0.14)',
        border: '1px solid rgba(255,255,255,0.18)',
        cursor: 'pointer',
      }}
      aria-label="Abrir configurações"
    >
      <Cog6ToothIcon className="w-5 h-5" style={{ color: 'white' }} />
    </button>
  </div>

  <ChildSwitcher />

  {ageCtx && (
    <p
      className="text-[11px] font-nunito mt-1.5"
      style={{ color: 'rgba(255,255,255,0.45)' }}
    >
      {ageCtx.phaseHint}
    </p>
  )}
</div>

      {childError && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-2xl flex items-center gap-2"
          style={{ backgroundColor: '#FCEAEA', border: '1px solid #f5caca' }}>
          <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" style={{ color: '#C04A4A' }} />
          <p className="text-xs font-nunito" style={{ color: '#C04A4A' }}>
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
          <p className="text-[17px] font-bold font-quicksand" style={{ color: '#2C2C2C' }}>
            Nenhuma criança encontrada
          </p>
          <p className="text-[13px] mt-1.5 font-nunito" style={{ color: '#7A7A7A' }}>
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
          <div className="pt-3">
            <ActiveSessionBanner />
          </div>

          <div className="px-4 mt-4 space-y-6">

            {/* MAIN ASSISTANT BLOCK */}
            {!logsLoading && mainMessage && (
              <div className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: '#fff', border: '1.5px solid #E5E0D8', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <span className="text-[22px] flex-shrink-0 mt-0.5">{mainMessage.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold font-quicksand leading-tight" style={{ color: '#2C2C2C' }}>
                        {mainMessage.title}
                      </p>
                      <p className="text-[12px] font-nunito mt-1 leading-snug" style={{ color: '#7A7A7A' }}>
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

            {/* DAILY SUMMARY */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito"
                style={{ color: '#7A7A7A' }}>
                Resumo do dia
              </p>
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
              <ConsultationCard
                onSchedule={() => navigate('/health')}
                nextDate={nextConsultDate}
                hasHistory={hasConsultHistory}
              />
            </div>

            {/* ATTENTION */}
            {!logsLoading && attentionItems.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito"
                  style={{ color: '#7A7A7A' }}>
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

            {/* QUICK ACTIONS */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito"
                style={{ color: '#7A7A7A' }}>
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

            {/* RECENT ACTIVITY */}
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] font-nunito"
                  style={{ color: '#7A7A7A' }}>
                  Atividade recente
                </p>
                <p className="text-[11px] font-nunito capitalize" style={{ color: '#7A7A7A' }}>
                  {new Date().toLocaleDateString('pt-BR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </p>
              </div>

              {logsError && (
                <div className="px-4 py-3 rounded-2xl mb-3 flex items-center gap-2"
                  style={{ backgroundColor: '#FCEAEA', border: '1px solid #f5caca' }}>
                  <ExclamationCircleIcon className="w-4 h-4" style={{ color: '#C04A4A' }} />
                  <p className="text-xs font-nunito" style={{ color: '#C04A4A' }}>{logsError}</p>
                </div>
              )}

              {logsLoading ? (
                <div className="space-y-2.5">
                  {[0, 1, 2].map(i => <Skeleton key={i} className="h-[72px] rounded-2xl" />)}
                </div>
              ) : logs.length === 0 ? (
                <div className="rounded-2xl px-5 py-10 text-center"
                  style={{ backgroundColor: '#fff', border: '1px solid #E5E0D8' }}>
                  <p className="text-4xl mb-3">🌤️</p>
                  <p className="text-[15px] font-bold font-quicksand" style={{ color: '#2C2C2C' }}>
                    Nenhum registro ainda
                  </p>
                  <p className="text-[13px] mt-1.5 font-nunito leading-snug" style={{ color: '#7A7A7A' }}>
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
                      style={{ color: '#7A7A7A', backgroundColor: '#F4F0F3' }}
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
