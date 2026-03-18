/**
 * Ninho Unified Event System v3 — Intelligence + Navigation Layer
 *
 * Single source of truth for how every routine event is:
 *  - titled / summarized / badged / colored / detailed
 *  - analyzed for anomalies (pattern intelligence)
 *  - navigated to (every event type is now tappable)
 *
 * Intelligence rules (LOCKED):
 *  - Hints only show when GENUINELY relevant — not on every event
 *  - Never alarming — supportive and quiet
 *  - Feed: short < 5min, long > 45min (only breastfeed)
 *  - Sleep: short < 20min, long > 4h (only completed sessions)
 *  - Diaper: notable colors only (red, black, white poop; dark yellow pee)
 *  - NO hints for normal events
 *
 * Edit rule (v3): ALL event types are tappable and navigate to a detail screen.
 * No modals for editing.
 */

import type { Tables } from '@/integrations/supabase/types';
import { parsePayload, getUserNotes, fmtDurationShort, fmtTime, fmtRangeDuration } from '@/lib/routineUtils';

export type RoutineLog = Tables<'routine_logs'>;
export type EventType = 'feed' | 'sleep' | 'diaper' | 'note';

// ─── Detail behavior ───────────────────────────────────────────────────────

export type DetailKind = 'breastfeed' | 'diaper' | 'sleep' | 'bottle' | 'none';

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
  /** Navigation path for this event (all events navigate, no modals) */
  editPath: string;
  /** Intelligence hint — shown as InlineStatusPill ONLY when genuinely notable */
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
// Rules are conservative — only trigger on clear anomalies.

export function isDiaperSignificant(p: Record<string, string | number>): boolean {
  const poopColor = String(p.poop_color ?? '');
  const peeColor  = String(p.pee_color ?? '');
  const texture   = String(p.poop_texture ?? '');
  return (
    ['red', 'black', 'white'].includes(poopColor) ||
    texture === 'mucus_like' ||
    peeColor === 'dark_yellow'
  );
}

function getDiaperHint(p: Record<string, string | number>): string | null {
  const poopColor = String(p.poop_color ?? '');
  const peeColor  = String(p.pee_color ?? '');
  const texture   = String(p.poop_texture ?? '');
  // Only surface genuinely notable signals
  if (['red', 'black', 'white'].includes(poopColor)) return 'Cor incomum';
  if (texture === 'mucus_like') return 'Com muco';
  if (peeColor === 'dark_yellow') return 'Xixi escuro';
  return null; // Normal diaper — no hint
}

function getSleepHint(log: RoutineLog): string | null {
  if (!log.end_time) return null; // Ongoing — no hint yet
  const sec = Math.floor(
    (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 1000
  );
  if (sec <= 0) return null;
  if (sec > 4 * 3600) return 'Sono longo';       // > 4h
  if (sec < 20 * 60)  return 'Soneca curta';     // < 20min
  return null; // Normal range — no hint
}

function getFeedHint(p: Record<string, string | number>): string | null {
  if (p.session_type !== 'breastfeed') return null; // Only for breastfeeding
  const totalSec = Number(p.total_seconds ?? 0);
  if (totalSec <= 0) return null; // Manual entry — no hint
  if (totalSec > 45 * 60) return 'Mamada longa';  // > 45min
  if (totalSec < 5 * 60)  return 'Mamada curta';  // < 5min
  return null; // Normal range — no hint
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

// ─── Feed summary builder ──────────────────────────────────────────────────

function buildFeedSummary(p: Record<string, string | number>): string {
  if (p.session_type === 'breastfeed') {
    const l  = Number(p.left_seconds ?? 0);
    const r  = Number(p.right_seconds ?? 0);
    const sw = Number(p.switches ?? 0);
    const parts: string[] = [];
    if (l > 0) parts.push(`Esq: ${fmtDurationShort(l)}`);
    if (r > 0) parts.push(`Dir: ${fmtDurationShort(r)}`);
    if (sw > 0) parts.push(`${sw} troca${sw > 1 ? 's' : ''}`);
    return parts.join(' · ') || 'Amamentação';
  }
  const method = String(p.feeding_method ?? '');
  const methodMap: Record<string, string> = {
    breast: 'Seio', bottle: 'Mamadeira', formula: 'Fórmula',
  };
  const label  = methodMap[method] ?? 'Mamada';
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
  Manhã:     '🌅',
  Tarde:     '☀️',
  Noite:     '🌙',
  Madrugada: '🌃',
};

export function groupLogsByTimeOfDay(
  logs: RoutineLog[],
): { group: TimeOfDay; logs: RoutineLog[] }[] {
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

// ─── Pattern analysis ─────────────────────────────────────────────────────

export interface DayInsights {
  avgFeedIntervalMin: number | null;
  feedingIrregular: boolean;
  totalSleepSec: number;
  hasLongSleep: boolean;
  diaperCountLow: boolean;
}

export function analyzeDayPatterns(logs: RoutineLog[]): DayInsights {
  const feedLogs = logs
    .filter(l => l.type === 'feed')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const sleepLogs   = logs.filter(l => l.type === 'sleep' && !!l.end_time);
  const diaperLogs  = logs.filter(l => l.type === 'diaper');

  let avgFeedIntervalMin: number | null = null;
  let feedingIrregular = false;
  if (feedLogs.length >= 2) {
    const intervals: number[] = [];
    for (let i = 1; i < feedLogs.length; i++) {
      const diffMin = (
        new Date(feedLogs[i].start_time).getTime() -
        new Date(feedLogs[i - 1].start_time).getTime()
      ) / 60000;
      intervals.push(diffMin);
    }
    avgFeedIntervalMin = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
    const avg = avgFeedIntervalMin;
    feedingIrregular = intervals.some(iv => iv > avg * 2.5 || iv < avg * 0.3);
  }

  const totalSleepSec = sleepLogs.reduce((acc, l) => {
    return acc + Math.floor(
      (new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000
    );
  }, 0);

  const hasLongSleep = sleepLogs.some(l => {
    const sec = Math.floor(
      (new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000
    );
    return sec > 4 * 3600;
  });

  const diaperCountLow = diaperLogs.length < 4 && new Date().getHours() >= 18;

  return { avgFeedIntervalMin, feedingIrregular, totalSleepSec, hasLongSleep, diaperCountLow };
}

// ─── Age-based priority ────────────────────────────────────────────────────

export interface AgeContext {
  months: number;
  primaryFocus: 'feeding' | 'sleep' | 'development';
  phaseHint: string;
  idealFeedIntervalMin: number | null;
  maxSleepStretchHours: number;
}

export function getAgeContext(birthDate: string): AgeContext {
  const diffMs = Date.now() - new Date(birthDate + 'T00:00:00').getTime();
  const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));

  if (months < 1) return {
    months,
    primaryFocus: 'feeding',
    phaseHint: 'Recém-nascido · alimentação frequente',
    idealFeedIntervalMin: 120,
    maxSleepStretchHours: 3,
  };
  if (months < 3) return {
    months,
    primaryFocus: 'feeding',
    phaseHint: `${months}m · crescimento acelerado`,
    idealFeedIntervalMin: 150,
    maxSleepStretchHours: 4,
  };
  if (months < 6) return {
    months,
    primaryFocus: 'feeding',
    phaseHint: `${months}m · explorando o mundo`,
    idealFeedIntervalMin: 180,
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
// v3: ALL events are tappable and navigate via editPath — no modals.

export function getEventPresentation(log: RoutineLog): EventPresentation {
  const p = parsePayload(log.notes);
  const userNotes = getUserNotes(log.notes);
  const includeInReport = Boolean(p.include_in_report);

  switch (log.type) {
    // ── FEED ────────────────────────────────────────────────────────────────
    case 'feed': {
      const isBreastfeed = p.session_type === 'breastfeed';
      const totalSec = Number(p.total_seconds ?? 0);
      const tags = String(p.tags ?? '');
      const hasObs = tags.length > 0 || !!userNotes;
      const hintLabel = getFeedHint(p);

      return {
        title: isBreastfeed
          ? 'Amamentação'
          : (String(p.feeding_method ?? '') === 'formula' ? 'Fórmula' : 'Mamadeira'),
        emoji: isBreastfeed ? '🤱' : '🍼',
        color: 'hsl(152,15%,55%)',
        bgColor: 'color-mix(in srgb, hsl(152,15%,55%) 12%, transparent)',
        summary: buildFeedSummary(p),
        badge: isBreastfeed && totalSec > 0 ? fmtDurationShort(totalSec) : null,
        observationPreview: hasObs && userNotes ? userNotes.slice(0, 50) : null,
        detailKind: isBreastfeed ? 'breastfeed' : 'bottle',
        tappable: true,
        editPath: isBreastfeed ? `/feed/detail/${log.id}` : `/bottle/edit/${log.id}`,
        hint: hintLabel ? { label: hintLabel, variant: 'info' } : null,
        includeInReport,
      };
    }

    // ── SLEEP ───────────────────────────────────────────────────────────────
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
        tappable: true,
        editPath: `/sleep/detail/${log.id}`,
        hint: hintLabel ? { label: hintLabel, variant: 'info' } : null,
        includeInReport,
      };
    }

    // ── DIAPER ──────────────────────────────────────────────────────────────
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
        editPath: `/diaper/edit/${log.id}`,
        isSignificant: significant,
        hint: hintLabel ? { label: hintLabel, variant: 'info' } : null,
        includeInReport,
      };
    }

    // ── NOTE ────────────────────────────────────────────────────────────────
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
        editPath: '',
      };
  }
}

// ─── Re-export helpers needed by sheets ───────────────────────────────────
export { fmtTime };
