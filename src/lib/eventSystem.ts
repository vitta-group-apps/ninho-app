/**
 * Ninho Unified Event System v2 — Intelligence Layer
 *
 * Single source of truth for how every routine event is:
 *  - titled / summarized / badged / colored / detailed
 *  - analyzed for anomalies (pattern intelligence)
 *
 * Intelligence is SUBTLE — never alarmist.
 * Anomalies surface as InlineStatusPill hints, not error states.
 */

import type { Tables } from '@/integrations/supabase/types';
import { parsePayload, getUserNotes, fmtDurationShort, fmtTime, fmtRangeDuration } from '@/lib/routineUtils';

export type RoutineLog = Tables<'routine_logs'>;
export type EventType = 'feed' | 'sleep' | 'diaper' | 'note';

// ─── Detail behavior ───────────────────────────────────────────────────────

export type DetailKind =
  | 'breastfeed'
  | 'diaper'
  | 'sleep'
  | 'none';

// ─── Event presentation ────────────────────────────────────────────────────

export interface EventPresentation {
  title: string;
  emoji: string;
  color: string;
  bgColor: string;
  summary: string;
  badge: string | null;
  observationPreview: string | null;
  detailKind: DetailKind;
  tappable: boolean;
  /** Intelligence hint — shown as InlineStatusPill if present */
  hint?: { label: string; variant: 'active' | 'paused' | 'info' } | null;
  /** Whether this event was flagged as medically notable */
  isSignificant?: boolean;
  /** For report toggle display in detail view */
  includeInReport?: boolean;
}

// ─── Diaper label dictionaries ─────────────────────────────────────────────

export const DIAPER_KIND_LABEL: Record<string, string> = {
  pee:  'Xixi',
  poop: 'Cocô',
  both: 'Xixi + Cocô',
};

export const DIAPER_QUANTITY_LABEL: Record<string, string> = {
  small:  'pouca',
  medium: 'média',
  large:  'grande',
};

export const DIAPER_PEE_COLOR_LABEL: Record<string, string> = {
  clear:       'transparente',
  pale_yellow: 'amarelo claro',
  dark_yellow: 'amarelo escuro',
  other:       'outra cor',
};

export const DIAPER_POOP_COLOR_LABEL: Record<string, string> = {
  yellow: 'amarelo',
  green:  'verde',
  brown:  'marrom',
  dark:   'escuro',
  red:    'avermelhado',
  black:  'preto',
  white:  'branco',
  other:  'outra cor',
};

export const DIAPER_TEXTURE_LABEL: Record<string, string> = {
  liquid:     'líquido',
  pasty:      'pastoso',
  soft:       'macio',
  firm:       'firme',
  mucus_like: 'com muco',
  other:      'outro',
};

// ─── Intelligence: anomaly detection ───────────────────────────────────────

/**
 * Returns a subtle hint label if this diaper has medically notable signals.
 * Only surface, never alarm.
 */
export function isDiaperSignificant(p: Record<string, string | number>): boolean {
  const poopColor   = String(p.poop_color ?? '');
  const peeColor    = String(p.pee_color ?? '');
  const texture     = String(p.poop_texture ?? '');
  const notableColors = ['red', 'black', 'white'];
  const notableTextures = ['mucus_like'];
  const notablePeeColors = ['dark_yellow'];
  return (
    notableColors.includes(poopColor) ||
    notableTextures.includes(texture) ||
    notablePeeColors.includes(peeColor)
  );
}

function getDiaperHint(p: Record<string, string | number>): string | null {
  const poopColor = String(p.poop_color ?? '');
  const peeColor  = String(p.pee_color ?? '');
  const texture   = String(p.poop_texture ?? '');

  if (['red', 'black', 'white'].includes(poopColor)) return 'Cor incomum';
  if (texture === 'mucus_like') return 'Com muco';
  if (peeColor === 'dark_yellow') return 'Xixi escuro';
  return null;
}

function getSleepHint(log: RoutineLog): string | null {
  if (!log.end_time) return null;
  const sec = Math.floor((new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 1000);
  if (sec > 4 * 3600) return 'Sono longo'; // > 4h
  if (sec < 20 * 60 && sec > 0) return 'Soneca curta'; // < 20min
  return null;
}

function getFeedHint(p: Record<string, string | number>): string | null {
  if (p.session_type !== 'breastfeed') return null;
  const totalSec = Number(p.total_seconds ?? 0);
  if (totalSec > 45 * 60) return 'Mamada longa';
  if (totalSec > 0 && totalSec < 5 * 60) return 'Mamada curta';
  return null;
}

// ─── Diaper summary builders ───────────────────────────────────────────────

export function buildDiaperSummary(p: Record<string, string | number>): string {
  const kind = String(p.kind ?? p.diaper_type ?? '');
  const base = DIAPER_KIND_LABEL[kind] ?? 'Fralda';
  const parts: string[] = [base];

  const texture   = DIAPER_TEXTURE_LABEL[String(p.poop_texture ?? '')];
  const poopColor = DIAPER_POOP_COLOR_LABEL[String(p.poop_color ?? '')];
  const peeColor  = DIAPER_PEE_COLOR_LABEL[String(p.pee_color ?? '')];
  const qty       = DIAPER_QUANTITY_LABEL[String(p.quantity ?? '')];

  if (texture)        parts.push(texture);
  else if (poopColor) parts.push(poopColor);
  else if (peeColor)  parts.push(peeColor);
  else if (qty)       parts.push(qty);

  return parts.join(' · ');
}

export function buildDiaperDetail(p: Record<string, string | number>): string | null {
  const details: string[] = [];
  const kind = String(p.kind ?? p.diaper_type ?? '');
  const showPee  = kind === 'pee'  || kind === 'both';
  const showPoop = kind === 'poop' || kind === 'both';

  if (showPee) {
    const peeColor = DIAPER_PEE_COLOR_LABEL[String(p.pee_color ?? '')];
    if (peeColor) details.push(peeColor);
  }
  if (showPoop) {
    const poopColor = DIAPER_POOP_COLOR_LABEL[String(p.poop_color ?? '')];
    const texture   = DIAPER_TEXTURE_LABEL[String(p.poop_texture ?? '')];
    if (poopColor) details.push(poopColor);
    if (texture)   details.push(texture);
  }
  return details.length > 0 ? details.join(' · ') : null;
}

// ─── Feed helpers ──────────────────────────────────────────────────────────

function buildFeedSummary(p: Record<string, string | number>): string {
  if (p.session_type === 'breastfeed') {
    const l = Number(p.left_seconds ?? 0);
    const r = Number(p.right_seconds ?? 0);
    const sw = Number(p.switches ?? 0);
    const parts: string[] = [];
    if (l > 0) parts.push(`Esq: ${fmtDurationShort(l)}`);
    if (r > 0) parts.push(`Dir: ${fmtDurationShort(r)}`);
    if (sw > 0) parts.push(`${sw} troca${sw > 1 ? 's' : ''}`);
    return parts.join(' · ') || 'Amamentação';
  }
  const method = String(p.feeding_method ?? '');
  const methodMap: Record<string, string> = { breast: 'Seio', bottle: 'Mamadeira', formula: 'Fórmula' };
  const label = methodMap[method] ?? 'Mamada';
  const amount = p.amount_ml ? ` · ${p.amount_ml}ml` : '';
  return `${label}${amount}`;
}

// ─── Time-of-day grouping ──────────────────────────────────────────────────

export type TimeOfDay = 'Manhã' | 'Tarde' | 'Noite' | 'Madrugada';

export function getTimeOfDay(isoString: string): TimeOfDay {
  const h = new Date(isoString).getHours();
  if (h >= 5 && h < 12) return 'Manhã';
  if (h >= 12 && h < 18) return 'Tarde';
  if (h >= 18 && h < 22) return 'Noite';
  return 'Madrugada';
}

export const TIME_OF_DAY_EMOJI: Record<TimeOfDay, string> = {
  Manhã: '🌅',
  Tarde: '☀️',
  Noite: '🌙',
  Madrugada: '🌃',
};

/**
 * Group logs by time of day, newest-first within each group.
 * Returns ordered groups: Madrugada → Manhã → Tarde → Noite.
 */
export function groupLogsByTimeOfDay(logs: RoutineLog[]): { group: TimeOfDay; logs: RoutineLog[] }[] {
  const order: TimeOfDay[] = ['Manhã', 'Tarde', 'Noite', 'Madrugada'];
  const map = new Map<TimeOfDay, RoutineLog[]>();

  for (const log of logs) {
    const tod = getTimeOfDay(log.start_time);
    if (!map.has(tod)) map.set(tod, []);
    map.get(tod)!.push(log);
  }

  return order
    .filter(g => map.has(g))
    .map(g => ({ group: g, logs: map.get(g)! }));
}

// ─── Pattern analysis across multiple logs ────────────────────────────────

export interface DayInsights {
  /** Average minutes between feeds */
  avgFeedIntervalMin: number | null;
  /** Whether feeding frequency seems irregular */
  feedingIrregular: boolean;
  /** Total sleep seconds today */
  totalSleepSec: number;
  /** Whether there's an unusually long sleep */
  hasLongSleep: boolean;
  /** Whether diaper count is unusually low */
  diaperCountLow: boolean;
}

export function analyzeDayPatterns(logs: RoutineLog[]): DayInsights {
  const feedLogs = logs.filter(l => l.type === 'feed').sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
  const sleepLogs = logs.filter(l => l.type === 'sleep' && !!l.end_time);
  const diaperLogs = logs.filter(l => l.type === 'diaper');

  // Feed interval analysis
  let avgFeedIntervalMin: number | null = null;
  let feedingIrregular = false;
  if (feedLogs.length >= 2) {
    const intervals: number[] = [];
    for (let i = 1; i < feedLogs.length; i++) {
      const diffMin = (new Date(feedLogs[i].start_time).getTime() - new Date(feedLogs[i - 1].start_time).getTime()) / 60000;
      intervals.push(diffMin);
    }
    avgFeedIntervalMin = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
    // Irregular = any interval > 2x average or < 0.5x average
    const avg = avgFeedIntervalMin;
    feedingIrregular = intervals.some(iv => iv > avg * 2.5 || iv < avg * 0.3);
  }

  // Sleep analysis
  const totalSleepSec = sleepLogs.reduce((acc, l) => {
    return acc + Math.floor((new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000);
  }, 0);
  const hasLongSleep = sleepLogs.some(l => {
    const sec = Math.floor((new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000);
    return sec > 4 * 3600;
  });

  // Diaper count — for newborns < 6 per day is low
  const diaperCountLow = diaperLogs.length < 4 && new Date().getHours() >= 18;

  return {
    avgFeedIntervalMin,
    feedingIrregular,
    totalSleepSec,
    hasLongSleep,
    diaperCountLow,
  };
}

// ─── Age-based priority ────────────────────────────────────────────────────

export interface AgeContext {
  months: number;
  /** Primary focus for this age */
  primaryFocus: 'feeding' | 'sleep' | 'development';
  /** Hint text for Home header */
  phaseHint: string;
  /** Ideal feed interval in minutes (null = not applicable) */
  idealFeedIntervalMin: number | null;
  /** Max sleep stretch expected in hours */
  maxSleepStretchHours: number;
}

export function getAgeContext(birthDate: string): AgeContext {
  const diffMs = Date.now() - new Date(birthDate + 'T00:00:00').getTime();
  const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));

  if (months < 1) return {
    months,
    primaryFocus: 'feeding',
    phaseHint: 'Recém-nascido · alimentação frequente',
    idealFeedIntervalMin: 120, // 2h
    maxSleepStretchHours: 3,
  };
  if (months < 3) return {
    months,
    primaryFocus: 'feeding',
    phaseHint: `${months}m · crescimento acelerado`,
    idealFeedIntervalMin: 150, // 2.5h
    maxSleepStretchHours: 4,
  };
  if (months < 6) return {
    months,
    primaryFocus: 'feeding',
    phaseHint: `${months}m · explorando o mundo`,
    idealFeedIntervalMin: 180, // 3h
    maxSleepStretchHours: 6,
  };
  if (months < 12) return {
    months,
    primaryFocus: 'development',
    phaseHint: `${months}m · fases de desenvolvimento`,
    idealFeedIntervalMin: 210,
    maxSleepStretchHours: 8,
  };
  return {
    months,
    primaryFocus: 'development',
    phaseHint: `${Math.floor(months / 12)}a ${months % 12}m`,
    idealFeedIntervalMin: null,
    maxSleepStretchHours: 10,
  };
}

// ─── Main presentation builder ─────────────────────────────────────────────

export function getEventPresentation(log: RoutineLog): EventPresentation {
  const p = parsePayload(log.notes);
  const userNotes = getUserNotes(log.notes);
  const includeInReport = Boolean(p.include_in_report);

  switch (log.type) {
    // ── FEED ──────────────────────────────────────────────────────────────
    case 'feed': {
      const isBreastfeed = p.session_type === 'breastfeed';
      const totalSec = Number(p.total_seconds ?? 0);
      const tags = String(p.tags ?? '');
      const hasObs = tags.length > 0 || !!userNotes;
      const hintLabel = getFeedHint(p);

      return {
        title: isBreastfeed ? 'Amamentação' : (String(p.feeding_method ?? '') === 'formula' ? 'Fórmula' : 'Mamadeira'),
        emoji: isBreastfeed ? '🤱' : '🍼',
        color: 'hsl(152,15%,55%)',
        bgColor: 'color-mix(in srgb, hsl(152,15%,55%) 12%, transparent)',
        summary: buildFeedSummary(p),
        badge: isBreastfeed && totalSec > 0 ? fmtDurationShort(totalSec) : null,
        observationPreview: hasObs && userNotes ? userNotes.slice(0, 50) : null,
        detailKind: isBreastfeed ? 'breastfeed' : 'none',
        tappable: isBreastfeed,
        hint: hintLabel ? { label: hintLabel, variant: 'info' } : null,
        includeInReport,
      };
    }

    // ── SLEEP ─────────────────────────────────────────────────────────────
    case 'sleep': {
      const duration = log.end_time ? fmtRangeDuration(log.start_time, log.end_time) : null;
      const ongoing = !log.end_time;
      const hintLabel = getSleepHint(log);

      return {
        title: 'Sono',
        emoji: '😴',
        color: 'hsl(270,12%,52%)',
        bgColor: 'color-mix(in srgb, hsl(270,12%,52%) 12%, transparent)',
        summary: ongoing ? 'Em andamento' : (duration ? `Duração: ${duration}` : 'Sono'),
        badge: duration,
        observationPreview: userNotes ? userNotes.slice(0, 50) : null,
        detailKind: 'sleep',
        tappable: false,
        hint: hintLabel ? { label: hintLabel, variant: 'info' } : null,
        includeInReport,
      };
    }

    // ── DIAPER ────────────────────────────────────────────────────────────
    case 'diaper': {
      const kind = String(p.kind ?? p.diaper_type ?? '');
      const summary = buildDiaperSummary({ ...p, kind });
      const significant = isDiaperSignificant(p);
      const hintLabel = getDiaperHint(p);

      return {
        title: 'Fralda',
        emoji: '🧷',
        color: 'hsl(32,80%,57%)',
        bgColor: 'color-mix(in srgb, hsl(32,80%,57%) 12%, transparent)',
        summary,
        badge: null,
        observationPreview: userNotes ? userNotes.slice(0, 50) : null,
        detailKind: 'diaper',
        tappable: true,
        isSignificant: significant,
        hint: hintLabel ? { label: hintLabel, variant: 'info' } : null,
        includeInReport,
      };
    }

    // ── NOTE ──────────────────────────────────────────────────────────────
    default:
      return {
        title: 'Nota',
        emoji: '📝',
        color: 'hsl(var(--ninho-brown))',
        bgColor: 'hsl(var(--muted))',
        summary: userNotes ?? '',
        badge: null,
        observationPreview: null,
        detailKind: 'none',
        tappable: false,
      };
  }
}

// ─── Re-export helpers needed by sheets ───────────────────────────────────
export { fmtTime };
