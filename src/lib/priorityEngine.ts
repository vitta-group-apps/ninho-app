/**
 * Ninho Priority Engine v2
 *
 * Rule-based engine driving ONE main assistant message + up to 3 attention items.
 *
 * Priority levels (descending severity):
 *   4. health_risk     — vaccines due/overdue, symptoms, medication, missing consult when critical
 *   3. missing_care    — essential care not logged today (age-gated)
 *   2. suggested_next  — contextual next action based on patterns / time
 *   1. context         — age/phase awareness, education
 *
 * Rules:
 *   — Exactly ONE main assistant message (highest priority wins)
 *   — Max 3 "Atenção" items (main message id excluded)
 *   — No duplicated meaning between main block and attention list
 *   — Every item must be actionable (has a path)
 *   — Consultation alert appears AT MOST ONCE (either main OR attention, never both)
 *   — If nothing urgent: guide next useful action, never show dead text
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
    const vm = v.ageMonths ?? 0;
    return vm <= ageMonths;
  });

  const upcomingVaccines = vaccineSchedule.filter(v => {
    const vm = v.ageMonths ?? 0;
    return vm > ageMonths && vm <= ageMonths + 3;
  });

  const nextVaccineMonths = vaccineSchedule
    .filter(v => (v.ageMonths ?? 0) > ageMonths)
    .sort((a, b) => (a.ageMonths ?? 0) - (b.ageMonths ?? 0))[0];

  return {
    overdueCount:    overdueVaccines.length,
    upcomingCount:   upcomingVaccines.length,
    nextVaccine:     nextVaccineMonths,
    upcomingVaccines,
  };
}

// ─── Age bucket helper ─────────────────────────────────────────────────────

type AgeBucket =
  | 'newborn'      // 0–7d
  | 'early_infant' // 8d–1m
  | 'infant_1_6'   // 1–6m
  | 'infant_6_12'  // 6–12m
  | 'toddler_1_2'  // 1–2y
  | 'toddler_2_6'  // 2–6y
  | 'child';       // 6y+

function getAgeBucket(ageMonths: number): AgeBucket {
  if (ageMonths < 0.25)  return 'newborn';
  if (ageMonths < 1)     return 'early_infant';
  if (ageMonths < 6)     return 'infant_1_6';
  if (ageMonths < 12)    return 'infant_6_12';
  if (ageMonths < 24)    return 'toddler_1_2';
  if (ageMonths < 72)    return 'toddler_2_6';
  return 'child';
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

  const ageCtx    = getAgeContext(activeChild.birth_date);
  const ageMonths = ageCtx.months;
  const childName = activeChild.name;
  const bucket    = getAgeBucket(ageMonths);

  // ─── Derive log states ─────────────────────────────────────────────────
  const feedLogs     = logs.filter(l => l.type === 'feed');
  const diaperLogs   = logs.filter(l => l.type === 'diaper');
  const sleepLogs    = logs.filter(l => l.type === 'sleep' && l.end_time);
  const ongoingSleep = logs.find(l => l.type === 'sleep' && !l.end_time);
  const lastFeed     = feedLogs[0]; // logs are newest-first

  const sleepSec = sleepLogs.reduce((acc, l) =>
    acc + Math.floor((new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000), 0);

  const vaccineState = getVaccineState(activeChild.birth_date, ageMonths);

  // Track whether consultation alert was used as main message
  let consultationUsedAsMain = false;

  // ─── Build all candidate items ────────────────────────────────────────

  const allItems: PriorityItem[] = [];

  // ── HEALTH RISK (level 4) ──────────────────────────────────────────────

  // Vaccines upcoming (active vaccination phase ≤ 24m)
  if (ageMonths <= 48 && vaccineState.upcomingCount > 0) {
    const nextV = vaccineState.upcomingVaccines[0];
    allItems.push({
      id: 'vaccines-upcoming',
      level: 'health_risk',
      emoji: '💉',
      title: `Vacina prevista: ${nextV.shortName}`,
      body: `${nextV.doses} está próxima — ${nextV.ageLabel}. Confirme com o pediatra.`,
      ctaLabel: 'Ver vacinas',
      path: '/health',
    });
  }

  // ── MISSING CARE (level 3) — age-gated ────────────────────────────────

  // No feeds today (critical for newborns/infants < 12m)
  const feedThresholdHour = bucket === 'newborn' || bucket === 'early_infant' ? 6 : 8;
  if (feedLogs.length === 0 && hour >= feedThresholdHour && ageMonths < 12) {
    allItems.push({
      id: 'no-feeds-today',
      level: 'missing_care',
      emoji: '🤱',
      title: 'Nenhuma mamada registrada hoje',
      body: 'Inicie registrando a próxima mamada para acompanhar a alimentação.',
      ctaLabel: 'Registrar',
      path: '/breastfeeding',
    });
  }

  // No diapers today (concerning after midday for < 24m)
  if (diaperLogs.length === 0 && hour >= 14 && ageMonths < 24) {
    allItems.push({
      id: 'no-diapers-today',
      level: 'missing_care',
      emoji: '🧷',
      title: 'Nenhuma fralda registrada hoje',
      body: `Registrar trocas ajuda a monitorar a hidratação e saúde de ${childName}.`,
      ctaLabel: 'Registrar',
      path: '/diaper/new',
    });
  }

  // Low diaper count in the evening (newborn / early infant)
  if (diaperLogs.length > 0 && diaperLogs.length < 4 && hour >= 18 &&
      (bucket === 'newborn' || bucket === 'early_infant')) {
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

  // No sleep today (for < 6m, only after early afternoon)
  if (sleepSec === 0 && !ongoingSleep && hour >= 13 && ageMonths < 6) {
    allItems.push({
      id: 'no-sleep-today',
      level: 'missing_care',
      emoji: '😴',
      title: 'Nenhum sono registrado hoje',
      body: 'Bebês nessa fase dormem bastante durante o dia. Registre os períodos de sono.',
      ctaLabel: 'Registrar',
      path: '/sleep',
    });
  }

  // ── SUGGESTED NEXT (level 2) ───────────────────────────────────────────

  // Feed overdue (time-based suggestion) — only if feeds exist and age < 24m
  if (lastFeed && ageCtx.idealFeedIntervalMin && ageMonths < 24) {
    const minSince = Math.floor((Date.now() - new Date(lastFeed.start_time).getTime()) / 60000);
    const ideal    = ageCtx.idealFeedIntervalMin;
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

  // Growth tracking missing (show only once as suggested, not always)
  if (ageMonths >= 1 && ageMonths <= 36 && logs.length > 0) {
    allItems.push({
      id: 'no-growth',
      level: 'suggested_next',
      emoji: '📏',
      title: 'Registre peso e altura',
      body: `Acompanhar o crescimento de ${childName} facilita o acompanhamento pediátrico.`,
      ctaLabel: 'Ver',
      path: '/health',
    });
  }

  // Consultation — ONLY as suggested_next, NEVER as health_risk
  // This prevents it from appearing as main message and also separately in attention
  allItems.push({
    id: 'no-consultation',
    level: 'suggested_next',
    emoji: '🩺',
    title: 'Nenhuma consulta agendada',
    body: 'Consultas regulares facilitam o acompanhamento e previnem problemas.',
    ctaLabel: 'Ver',
    path: '/health',
  });

  // Sort by priority level
  const levelOrder: Record<PriorityLevel, number> = {
    health_risk: 4, missing_care: 3, suggested_next: 2, context: 1,
  };
  allItems.sort((a, b) => levelOrder[b.level] - levelOrder[a.level]);

  // ─── Determine main message ───────────────────────────────────────────

  let mainMessage: AssistantMessage | null = null;
  let mainItemId: string | null = null;

  // Active sleep session overrides everything
  if (ongoingSleep) {
    const diffMs  = Date.now() - new Date(ongoingSleep.start_time).getTime();
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
    mainItemId = 'ongoing-sleep'; // synthetic id — no match in allItems
  } else if (allItems.length > 0) {
    // Take highest-priority item — but skip consultation as MAIN message
    // (it lives in attention only)
    const top = allItems.find(i => i.id !== 'no-consultation') ?? allItems[0];
    const toneMap: Record<PriorityLevel, AssistantMessage['tone']> = {
      health_risk: 'health', missing_care: 'nudge',
      suggested_next: 'nudge', context: 'info',
    };

    if (top.id === 'no-consultation') {
      consultationUsedAsMain = false;
    } else {
      mainItemId = top.id;
    }

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
      title: 'Nenhum registro hoje',
      body: 'Use os atalhos abaixo para começar a registrar as atividades do dia.',
      ctaLabel: 'Registrar agora',
      path: '/breastfeeding',
      tone: 'empty',
    };
  }

  // ─── Attention items (exclude main item, max 3) ────────────────────────
  // Also: if consultation was not used as main, it can appear in attention once.
  // But it is still de-duped from whatever is already the main.

  const attentionItems = allItems
    .filter(item => item.id !== mainItemId)
    .slice(0, 3);

  return { mainMessage, attentionItems };
}
