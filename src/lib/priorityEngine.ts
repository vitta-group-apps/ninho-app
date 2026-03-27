/**
 * Ninho Priority Engine v3
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
 *   — Growth prompt only surfaces when age ≥ 1m and no growth data exists (not every session)
 *   — If nothing urgent: guide next useful action, never show dead text
 *
 * Age buckets drive which signals are emphasized:
 *   newborn (0–7d)      → feeding, diapers, first consult, birth vaccines
 *   early_infant (8–28d) → feeding rhythm, diapers, sleep, vaccine confirmation
 *   infant_1_2m (1–2m)  → vaccines at 2m, feeding, growth baseline
 *   infant_3_6m (3–6m)  → vaccine cadence, growth, feeding, sleep
 *   infant_6_12m (6–12m) → vaccines, growth, consultations, symptoms
 *   toddler_1_2y (1–2y) → vaccines, consultations, growth, medications
 *   toddler_2_6y (2–6y) → consultations, medications, symptoms, growth
 *   child_6plus (6y+)   → consultations, medications, vaccine schedule
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

// ─── Age bucket ────────────────────────────────────────────────────────────

export type AgeBucket =
  | 'newborn'        // 0–7 days  (<0.25m)
  | 'early_infant'   // 8–28 days (0.25–1m)
  | 'infant_1_2m'    // 1–2 months
  | 'infant_3_6m'    // 3–6 months
  | 'infant_6_12m'   // 6–12 months
  | 'toddler_1_2y'   // 1–2 years
  | 'toddler_2_6y'   // 2–6 years
  | 'child_6plus';   // 6+ years

export function getAgeBucket(ageMonths: number): AgeBucket {
  const ageDays = ageMonths * 30.44;
  if (ageDays < 8)   return 'newborn';
  if (ageDays < 29)  return 'early_infant';
  if (ageMonths < 3) return 'infant_1_2m';
  if (ageMonths < 6) return 'infant_3_6m';
  if (ageMonths < 12) return 'infant_6_12m';
  if (ageMonths < 24) return 'toddler_1_2y';
  if (ageMonths < 72) return 'toddler_2_6y';
  return 'child_6plus';
}

// ─── Vaccine state helpers ─────────────────────────────────────────────────

export function getVaccineState(birthDate: string, ageMonths: number) {
  // Vaccines whose scheduled age window has been reached — need confirmation
  const dueVaccines = vaccineSchedule.filter(v => {
    const vm = v.ageMonths ?? 0;
    return vm <= ageMonths;
  });

  // Vaccines coming up in the next 3 months
  const upcomingVaccines = vaccineSchedule.filter(v => {
    const vm = v.ageMonths ?? 0;
    return vm > ageMonths && vm <= ageMonths + 3;
  });

  const nextVaccine = vaccineSchedule
    .filter(v => (v.ageMonths ?? 0) > ageMonths)
    .sort((a, b) => (a.ageMonths ?? 0) - (b.ageMonths ?? 0))[0];

  return {
    dueCount:        dueVaccines.length,
    upcomingCount:   upcomingVaccines.length,
    nextVaccine,
    upcomingVaccines,
    dueVaccines,
  };
}

// ─── Feed threshold by age bucket ─────────────────────────────────────────

/** How many hours with no feeds is worth surfacing (soft prompt, not alarm) */
function getFeedThresholdHours(bucket: AgeBucket): number | null {
  switch (bucket) {
    case 'newborn':      return 2.5;
    case 'early_infant': return 3;
    case 'infant_1_2m':  return 3.5;
    case 'infant_3_6m':  return 4;
    case 'infant_6_12m': return 5;
    default: return null; // > 12m: feeding interval not surfaced as alert
  }
}

/** How late in the day before surfacing "no feeds today" */
function getFeedAlertHour(bucket: AgeBucket): number {
  switch (bucket) {
    case 'newborn':
    case 'early_infant': return 6;
    default: return 8;
  }
}

// ─── Main Engine ──────────────────────────────────────────────────────────

export function runPriorityEngine(params: {
  logs: RoutineLog[];
  logsLoading: boolean;
  activeChild: { id: string; birth_date: string; name: string } | null;
  hour: number;
  /** Optional: whether the child health profile has growth data */
  hasGrowthData?: boolean;
  /** Optional: pass consultations count to avoid showing "no consult" when they exist */
  consultationCount?: number;
  /** Optional: applied vaccine count to adjust vaccine logic */
  appliedVaccineCount?: number;
}): PriorityEngineResult {
  const {
    logs, logsLoading, activeChild, hour,
    hasGrowthData = false,
    consultationCount = -1,   // -1 = unknown (default: may show)
    appliedVaccineCount = -1, // -1 = unknown
  } = params;

  if (logsLoading || !activeChild) {
    return { mainMessage: null, attentionItems: [] };
  }

  const ageCtx    = getAgeContext(activeChild.birth_date);
  const ageMonths = ageCtx.months;
  const childName = activeChild.name;
  const bucket    = getAgeBucket(ageMonths);

  // ─── Age-aware thresholds ─────────────────────────────────────────────

  /**
   * Days since last growth measurement before surfacing it
   * Depends on age bucket — more frequent in early infancy
   */
  function getGrowthSuggestDays(b: AgeBucket): number {
    switch (b) {
      case 'newborn':      return 14;
      case 'early_infant': return 14;
      case 'infant_1_2m':  return 21;
      case 'infant_3_6m':  return 30;
      case 'infant_6_12m': return 45;
      case 'toddler_1_2y': return 60;
      case 'toddler_2_6y': return 90;
      default: return 180;
    }
  }

  /**
   * Days before a consultation is "missing" — varies by age
   */
  function getConsultThresholdDays(b: AgeBucket): number | null {
    switch (b) {
      case 'newborn':      return 14;   // Should have newborn consult within 2 weeks
      case 'early_infant': return 30;
      case 'infant_1_2m':  return 45;
      case 'infant_3_6m':  return 60;
      case 'infant_6_12m': return 90;
      case 'toddler_1_2y': return 120;
      case 'toddler_2_6y': return 180;
      default: return 365;
    }
  }

  // ─── Derive log states ─────────────────────────────────────────────────
  const feedLogs     = logs.filter(l => l.type === 'feed');
  const diaperLogs   = logs.filter(l => l.type === 'diaper');
  const sleepLogs    = logs.filter(l => l.type === 'sleep' && l.endTime);
  const ongoingSleep = logs.find(l => l.type === 'sleep' && !l.endTime);
  const lastFeed     = feedLogs[0]; // logs are newest-first

  const sleepSec = sleepLogs.reduce((acc, l) =>
    acc + Math.floor((new Date(l.endTime!).getTime() - new Date(l.startTime).getTime()) / 1000), 0);

  const vaccineState = getVaccineState(activeChild.birth_date, ageMonths);
  // Adjust "due" count by subtracting already-applied if known
  const dueUnconfirmed = appliedVaccineCount >= 0
    ? Math.max(0, vaccineState.dueCount - appliedVaccineCount)
    : vaccineState.dueCount;

  // ─── Build all candidate items ────────────────────────────────────────

  const allItems: PriorityItem[] = [];

  // ══ HEALTH RISK (level 4) ══════════════════════════════════════════════

  // Vaccines — active vaccination phase (≤ 4y) with unconfirmed doses
  if (ageMonths <= 48 && dueUnconfirmed > 0) {
    const first = vaccineState.dueVaccines[0];
    allItems.push({
      id: 'vaccines-due',
      level: 'health_risk',
      emoji: '💉',
      title: `${dueUnconfirmed} vacina${dueUnconfirmed > 1 ? 's' : ''} a confirmar`,
      body: first
        ? `${first.shortName} (${first.doses}) está prevista para esta fase. Registre quando for aplicada.`
        : 'Confirme as doses aplicadas para manter o histórico atualizado.',
      ctaLabel: 'Ver vacinas',
      path: '/health',
    });
  } else if (ageMonths <= 48 && vaccineState.upcomingCount > 0) {
    const next = vaccineState.upcomingVaccines[0];
    allItems.push({
      id: 'vaccines-upcoming',
      level: 'suggested_next',
      emoji: '💉',
      title: `Vacina prevista: ${next.shortName}`,
      body: `${next.doses} — ${next.ageLabel}. Confirme com o pediatra quando for aplicada.`,
      ctaLabel: 'Ver vacinas',
      path: '/health',
    });
  }

  // ══ MISSING CARE (level 3) — age-gated, soft prompts ══════════════════

  const feedAlertHour = getFeedAlertHour(bucket);

  // No feeds today — only surface for age < 12m after a threshold hour
  if (feedLogs.length === 0 && hour >= feedAlertHour && ageMonths < 12) {
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

  // No diapers today — concerning after midday for < 24m
  if (diaperLogs.length === 0 && hour >= 14 && ageMonths < 24) {
    allItems.push({
      id: 'no-diapers-today',
      level: 'missing_care',
      emoji: '🧷',
      title: 'Nenhuma fralda registrada hoje',
      body: `Registrar trocas ajuda a monitorar hidratação e saúde de ${childName}.`,
      ctaLabel: 'Registrar',
      path: '/diaper/new',
    });
  }

  // Very low diaper count in the evening (newborn / early infant only)
  if (
    diaperLogs.length > 0 && diaperLogs.length < 4 && hour >= 18 &&
    (bucket === 'newborn' || bucket === 'early_infant')
  ) {
    allItems.push({
      id: 'low-diapers',
      level: 'missing_care',
      emoji: '🧷',
      title: `Poucas trocas registradas (${diaperLogs.length})`,
      body: `Recém-nascidos trocam em média 6–8 fraldas por dia. Vale verificar.`,
      ctaLabel: 'Registrar',
      path: '/diaper/new',
    });
  }

  // No sleep today (only for < 6m, only after early afternoon)
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

  // ══ SUGGESTED NEXT (level 2) ═══════════════════════════════════════════

  // Feed interval suggestion — time-based, age-gated
  const feedThresholdH = getFeedThresholdHours(bucket);
  if (lastFeed && feedThresholdH && ageMonths < 12 && !allItems.find(i => i.id === 'no-feeds-today')) {
    const minSince = Math.floor((Date.now() - new Date(lastFeed.start_time).getTime()) / 60000);
    if (minSince >= feedThresholdH * 60 * 0.85) {
      const h = Math.floor(minSince / 60);
      const m = minSince % 60;
      const timeStr = h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
      allItems.push({
        id: 'feed-interval',
        level: 'suggested_next',
        emoji: '🤱',
        title: `Última mamada há ${timeStr}`,
        body: 'Pode ser hora de alimentar novamente.',
        ctaLabel: 'Registrar',
        path: '/breastfeeding',
      });
    }
  }

  // Growth tracking — only surface if no data AND age in relevant range
  if (ageMonths >= 1 && ageMonths <= 36 && !hasGrowthData && logs.length >= 3) {
    allItems.push({
      id: 'growth-missing',
      level: 'suggested_next',
      emoji: '📏',
      title: 'Registre peso e altura',
      body: `Acompanhar o crescimento de ${childName} facilita o histórico pediátrico.`,
      ctaLabel: 'Ver',
      path: '/health',
    });
  }

  // Consultation — only surface if consultationCount is known to be 0,
  // and only if age threshold suggests it's relevant.
  // NEVER surface if consultations already exist (consultationCount > 0).
  // NEVER surface if consultationCount === -1 (unknown — to avoid false positives).
  const consultThresholdDays = getConsultThresholdDays(bucket);
  if (
    consultationCount === 0 &&
    consultThresholdDays !== null &&
    ageMonths >= 0
  ) {
    allItems.push({
      id: 'no-consultation',
      level: 'suggested_next',
      emoji: '🩺',
      title: 'Nenhuma consulta registrada',
      body: 'Consultas regulares facilitam o acompanhamento desta fase.',
      ctaLabel: 'Registrar',
      path: '/health',
    });
  }

  // ── Sort by priority level ──────────────────────────────────────────────
  const levelOrder: Record<PriorityLevel, number> = {
    health_risk: 4, missing_care: 3, suggested_next: 2, context: 1,
  };
  allItems.sort((a, b) => levelOrder[b.level] - levelOrder[a.level]);

  // ─── Determine main message ───────────────────────────────────────────

  let mainMessage: AssistantMessage | null = null;
  let mainItemId: string | null = null;

  // Ongoing sleep session always wins as main message
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
    mainItemId = 'ongoing-sleep'; // synthetic — no match in allItems
  } else if (allItems.length > 0) {
    // Highest-priority item — prefer health/missing over suggested_next for main block
    const healthOrMissing = allItems.find(i => i.level === 'health_risk' || i.level === 'missing_care');
    const top = healthOrMissing ?? allItems.find(i => i.id !== 'no-consultation') ?? allItems[0];

    const toneMap: Record<PriorityLevel, AssistantMessage['tone']> = {
      health_risk: 'health', missing_care: 'nudge',
      suggested_next: 'nudge', context: 'info',
    };

    mainItemId = top.id;
    mainMessage = {
      emoji: top.emoji,
      title: top.title,
      body: top.body,
      ctaLabel: top.ctaLabel,
      path: top.path,
      tone: toneMap[top.level],
    };
  } else if (logs.length === 0 && hour >= getFeedAlertHour(bucket)) {
    mainMessage = {
      emoji: '👶',
      title: 'Sem registros hoje ainda',
      body: 'Use os atalhos abaixo para registrar as primeiras atividades do dia.',
      ctaLabel: 'Registrar agora',
      path: '/breastfeeding',
      tone: 'empty',
    };
  } else if (logs.length > 0) {
    // Day is going well — contextual positive message
    const lastFeedMsg = lastFeed
      ? `Última mamada há ${Math.floor((Date.now() - new Date(lastFeed.start_time).getTime()) / 60000)}min.`
      : '';
    mainMessage = {
      emoji: '✅',
      title: 'Dia acompanhado',
      body: `${logs.length} evento${logs.length > 1 ? 's' : ''} registrado${logs.length > 1 ? 's' : ''} hoje. ${lastFeedMsg}`.trim(),
      ctaLabel: 'Ver rotina',
      path: '/routine',
      tone: 'info',
    };
  }

  // ─── Attention items (exclude main item, max 3) ────────────────────────
  const attentionItems = allItems
    .filter(item => item.id !== mainItemId)
    .slice(0, 3);

  return { mainMessage, attentionItems };
}
