/**
 * Ninho Priority Engine v1
 *
 * Rule-based prioritization system that drives assistant behavior
 * across Home, Saúde, and Rotina.
 *
 * Priority levels (ascending severity):
 *   4. health_risk     — vaccines overdue, symptoms, medication, no consult
 *   3. missing_care    — essential care not logged today
 *   2. suggested_next  — contextual next action based on patterns
 *   1. context         — age/phase awareness, education
 *
 * Rules:
 *   - Only ONE main assistant message (highest priority)
 *   - Max 3 "Atenção" items (deduplicated from main message)
 *   - Every item must be actionable
 *   - No duplication between main block and attention list
 *   - If nothing urgent: guide next useful action
 */

import type { RoutineLog } from '@/lib/eventSystem';
import { getAgeContext } from '@/lib/eventSystem';
import { vaccineSchedule } from '@/data/vaccineSchedule';

// ─── Types ─────────────────────────────────────────────────────────────────

export type PriorityLevel = 'health_risk' | 'missing_care' | 'suggested_next' | 'context';

export interface PriorityItem {
  id: string;
  level: PriorityLevel;
  emoji: string;
  title: string;
  body: string;
  ctaLabel: string;
  path: string;
}

export interface AssistantMessage {
  emoji: string;
  title: string;
  body: string;
  ctaLabel: string;
  path: string;
  tone: 'info' | 'nudge' | 'empty' | 'health';
}

export interface PriorityEngineResult {
  /** The single most important message for the top assistant block */
  mainMessage: AssistantMessage | null;
  /** Up to 3 attention items (main message id excluded) */
  attentionItems: PriorityItem[];
}

// ─── Vaccine state helpers ─────────────────────────────────────────────────

export function getVaccineState(birthDate: string, ageMonths: number) {
  const overdueVaccines = vaccineSchedule.filter(v => {
    const vaccineAgeMonths = v.ageMonths ?? 0;
    return vaccineAgeMonths <= ageMonths;
  });

  const upcomingVaccines = vaccineSchedule.filter(v => {
    const vaccineAgeMonths = v.ageMonths ?? 0;
    return vaccineAgeMonths > ageMonths && vaccineAgeMonths <= ageMonths + 3;
  });

  const nextVaccineMonths = vaccineSchedule
    .filter(v => (v.ageMonths ?? 0) > ageMonths)
    .sort((a, b) => (a.ageMonths ?? 0) - (b.ageMonths ?? 0))[0];

  return {
    overdueCount: overdueVaccines.length,
    upcomingCount: upcomingVaccines.length,
    nextVaccine: nextVaccineMonths,
    upcomingVaccines,
  };
}

// ─── Main Engine ──────────────────────────────────────────────────────────

export function runPriorityEngine(params: {
  logs: RoutineLog[];
  logsLoading: boolean;
  activeChild: { id: string; birth_date: string; name: string } | null;
  hour: number;
}): PriorityEngineResult {
  const { logs, logsLoading, activeChild, hour } = params;

  if (logsLoading || !activeChild) {
    return { mainMessage: null, attentionItems: [] };
  }

  const ageCtx = getAgeContext(activeChild.birth_date);
  const ageMonths = ageCtx.months;
  const childName = activeChild.name;

  // ─── Derive log states ─────────────────────────────────────────────────
  const feedLogs    = logs.filter(l => l.type === 'feed');
  const diaperLogs  = logs.filter(l => l.type === 'diaper');
  const sleepLogs   = logs.filter(l => l.type === 'sleep' && l.end_time);
  const ongoingSleep = logs.find(l => l.type === 'sleep' && !l.end_time);
  const lastFeed    = feedLogs[0]; // logs are newest-first

  const sleepSec = sleepLogs.reduce((acc, l) => {
    return acc + Math.floor(
      (new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000
    );
  }, 0);

  const vaccineState = getVaccineState(activeChild.birth_date, ageMonths);

  // ─── Build all candidate items ────────────────────────────────────────

  const allItems: PriorityItem[] = [];

  // — HEALTH RISK items (level 4) —

  // Pending vaccines (only for children ≤ 24 months — active vaccination phase)
  if (ageMonths <= 24 && vaccineState.upcomingCount > 0) {
    const nextV = vaccineState.upcomingVaccines[0];
    allItems.push({
      id: 'vaccines-upcoming',
      level: 'health_risk',
      emoji: '💉',
      title: `Vacina prevista: ${nextV.shortName}`,
      body: `${nextV.doses} está próxima. Confirme o agendamento com o pediatra.`,
      ctaLabel: 'Ver vacinas',
      path: '/health',
    });
  }

  // No consultation scheduled (always relevant)
  allItems.push({
    id: 'no-consultation',
    level: 'health_risk',
    emoji: '🩺',
    title: 'Nenhuma consulta agendada',
    body: 'Manter as consultas em dia facilita o acompanhamento do desenvolvimento.',
    ctaLabel: 'Agendar',
    path: '/health',
  });

  // — MISSING CARE items (level 3) —

  // No feeds today (critical for newborns/infants)
  if (feedLogs.length === 0 && hour >= 8 && ageMonths < 12) {
    allItems.push({
      id: 'no-feeds-today',
      level: 'missing_care',
      emoji: '🤱',
      title: 'Nenhuma mamada registrada hoje',
      body: 'Inicie registrando a próxima mamada para acompanhar a alimentação do dia.',
      ctaLabel: 'Registrar',
      path: '/breastfeeding',
    });
  }

  // No diapers today (concerning after midday)
  if (diaperLogs.length === 0 && hour >= 14 && ageMonths < 24) {
    allItems.push({
      id: 'no-diapers-today',
      level: 'missing_care',
      emoji: '🧷',
      title: 'Nenhuma fralda registrada hoje',
      body: 'Registrar trocas ajuda a monitorar a hidratação e saúde de Rafael.',
      ctaLabel: 'Registrar',
      path: '/diaper/new',
    });
  }

  // Low diaper count in the evening
  if (diaperLogs.length > 0 && diaperLogs.length < 4 && hour >= 18 && ageMonths < 12) {
    allItems.push({
      id: 'low-diapers',
      level: 'missing_care',
      emoji: '🧷',
      title: `Poucas trocas hoje (${diaperLogs.length})`,
      body: `Recém-nascidos trocam em média 6–8 fraldas por dia. Verifique se está adequado.`,
      ctaLabel: 'Registrar',
      path: '/diaper/new',
    });
  }

  // No sleep today after midday
  if (sleepSec === 0 && !ongoingSleep && hour >= 13 && ageMonths < 6) {
    allItems.push({
      id: 'no-sleep-today',
      level: 'missing_care',
      emoji: '😴',
      title: 'Nenhum sono registrado hoje',
      body: 'Bebês nessa fase dormem muito durante o dia. Registre os períodos de sono.',
      ctaLabel: 'Registrar',
      path: '/sleep',
    });
  }

  // — SUGGESTED NEXT items (level 2) —

  // Feed overdue (time-based suggestion)
  if (lastFeed && ageCtx.idealFeedIntervalMin) {
    const minSince = Math.floor((Date.now() - new Date(lastFeed.start_time).getTime()) / 60000);
    const ideal = ageCtx.idealFeedIntervalMin;
    if (minSince >= ideal * 0.85 && !allItems.find(i => i.id === 'no-feeds-today')) {
      const h = Math.floor(minSince / 60);
      const m = minSince % 60;
      const timeStr = h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
      allItems.push({
        id: 'feed-overdue',
        level: 'suggested_next',
        emoji: '🤱',
        title: `Última mamada há ${timeStr}`,
        body: 'Pode ser hora de alimentar novamente.',
        ctaLabel: 'Registrar',
        path: '/breastfeeding',
      });
    }
  }

  // Growth tracking missing (no growth records)
  if (ageMonths >= 1 && ageMonths <= 24) {
    allItems.push({
      id: 'no-growth',
      level: 'suggested_next',
      emoji: '📏',
      title: 'Registre peso e altura',
      body: `Acompanhar o crescimento de ${childName} facilita o acompanhamento pediátrico.`,
      ctaLabel: 'Registrar',
      path: '/health',
    });
  }

  // Sort by priority level (health_risk > missing_care > suggested_next > context)
  const levelOrder: Record<PriorityLevel, number> = {
    health_risk: 4, missing_care: 3, suggested_next: 2, context: 1,
  };

  allItems.sort((a, b) => levelOrder[b.level] - levelOrder[a.level]);

  // ─── Determine main message ───────────────────────────────────────────

  let mainMessage: AssistantMessage | null = null;

  // Active sleep session overrides everything
  if (ongoingSleep) {
    const diffMs = Date.now() - new Date(ongoingSleep.start_time).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    const timeStr = h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
    mainMessage = {
      emoji: '😴',
      title: 'Sono em andamento',
      body: `${childName} está dormindo há ${timeStr}. Encerre quando acordar.`,
      ctaLabel: 'Ver sono',
      path: '/sleep',
      tone: 'info',
    };
  } else if (allItems.length > 0) {
    // Take the highest priority item as main message
    const top = allItems[0];
    const toneMap: Record<PriorityLevel, AssistantMessage['tone']> = {
      health_risk: 'health', missing_care: 'nudge',
      suggested_next: 'nudge', context: 'info',
    };
    mainMessage = {
      emoji: top.emoji,
      title: top.title,
      body: top.body,
      ctaLabel: top.ctaLabel,
      path: top.path,
      tone: toneMap[top.level],
    };
  } else if (logs.length === 0) {
    mainMessage = {
      emoji: '👶',
      title: 'Registre a primeira atividade',
      body: 'Use os atalhos abaixo para começar a acompanhar o dia.',
      ctaLabel: 'Registrar agora',
      path: '/breastfeeding',
      tone: 'empty',
    };
  }

  // ─── Attention items (exclude main message id, max 3) ─────────────────

  const mainId = mainMessage && allItems[0]?.title === mainMessage.title ? allItems[0].id : null;
  const attentionItems = allItems
    .filter(item => item.id !== mainId)
    .slice(0, 3);

  return { mainMessage, attentionItems };
}
