/**
 * Ninho Unified Event System v4 — Contract-first presentation layer
 *
 * Fonte oficial:
 *  - RoutineRecord (contracts/routine.ts)
 *  - payload = dado estruturado
 *  - notes = observação humana
 *
 * Regras:
 *  - hints só quando realmente relevantes
 *  - nada alarmista
 *  - todas as leituras usando startTime / endTime
 */

import type { RoutineRecord } from '@/lib/contracts/routine';
import { fmtDurationShort, fmtTime, fmtRangeDuration } from '@/lib/routineUtils';

export type RoutineLog = RoutineRecord;
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
  editPath: string;
  hint?: { label: string; variant: 'active' | 'paused' | 'info' } | null;
  isSignificant?: boolean;
  includeInReport?: boolean;
}

// ─── Helpers de leitura do contrato novo ───────────────────────────────────

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

export function getUserNotes(notes: string | null): string | null {
  return typeof notes === 'string' && notes.trim().length > 0 ? notes.trim() : null;
}

// ─── Diaper label dictionaries ─────────────────────────────────────────────

export const DIAPER_KIND_LABEL: Record<string, string> = {
  pee: 'Xixi',
  poop: 'Cocô',
  both: 'Xixi + Cocô',
};

export const DIAPER_QUANTITY_LABEL: Record<string, string> = {
  small: 'pouca',
  medium: 'média',
  large: 'grande',
};

export const DIAPER_PEE_COLOR_LABEL: Record<string, string> = {
  clear: 'transparente',
  pale_yellow: 'amarelo claro',
  dark_yellow: 'amarelo escuro',
  other: 'outra cor',
};

export const DIAPER_POOP_COLOR_LABEL: Record<string, string> = {
  yellow: 'amarelo',
  green: 'verde',
  brown: 'marrom',
  dark: 'escuro',
  red: 'avermelhado',
  black: 'preto',
  white: 'branco',
  other: 'outra cor',
};

export const DIAPER_TEXTURE_LABEL: Record<string, string> = {
  liquid: 'líquido',
  pasty: 'pastoso',
  soft: 'macio',
  firm: 'firme',
  mucus_like: 'com muco',
  other: 'outro',
};

// ─── Intelligence: anomaly detection ───────────────────────────────────────

type DiaperLikePayload = {
  pee?: boolean | null;
  poop?: boolean | null;
  poopColor?: string | null;
  poopTexture?: string | null;
  peeColor?: string | null;
  quantity?: string | null;
};

type FeedLikePayload = {
  mode?: 'breastfeeding' | 'bottle' | 'solid' | null;
  side?: 'left' | 'right' | 'both' | null;
  amountMl?: number | null;
  food?: string | null;
  totalSeconds?: number | null;
  method?: string | null;
};

function inferDiaperKind(payload: DiaperLikePayload): 'pee' | 'poop' | 'both' {
  const pee = payload.pee === true;
  const poop = payload.poop === true;

  if (pee && poop) return 'both';
  if (poop) return 'poop';
  return 'pee';
}

export function isDiaperSignificant(payload: DiaperLikePayload): boolean {
  const poopColor = String(payload.poopColor ?? '');
  const peeColor = String(payload.peeColor ?? '');
  const texture = String(payload.poopTexture ?? '');

  return (
    ['red', 'black', 'white'].includes(poopColor) ||
    texture === 'mucus_like' ||
    peeColor === 'dark_yellow'
  );
}

function getDiaperHint(payload: DiaperLikePayload): string | null {
  const poopColor = String(payload.poopColor ?? '');
  const peeColor = String(payload.peeColor ?? '');
  const texture = String(payload.poopTexture ?? '');

  if (['red', 'black', 'white'].includes(poopColor)) return 'Cor incomum';
  if (texture === 'mucus_like') return 'Com muco';
  if (peeColor === 'dark_yellow') return 'Xixi escuro';
  return null;
}

function getSleepHint(log: RoutineLog): string | null {
  if (!log.endTime) return null;

  const sec = Math.floor(
    (new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 1000
  );

  if (sec <= 0) return null;
  if (sec > 4 * 3600) return 'Sono longo';
  if (sec < 20 * 60) return 'Soneca curta';
  return null;
}

function getFeedHint(payload: FeedLikePayload, log: RoutineLog): string | null {
  const mode = payload.mode ?? null;
  const isBreastfeeding = mode === 'breastfeeding';

  if (!isBreastfeeding) return null;

  const totalSec =
    asNumber(payload.totalSeconds) ??
    (log.endTime
      ? Math.floor(
          (new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 1000
        )
      : 0);

  if (totalSec <= 0) return null;
  if (totalSec > 45 * 60) return 'Mamada longa';
  if (totalSec < 5 * 60) return 'Mamada curta';
  return null;
}

// ─── Summary builders ──────────────────────────────────────────────────────

export function buildDiaperSummary(payload: DiaperLikePayload): string {
  const kind = inferDiaperKind(payload);
  const base = DIAPER_KIND_LABEL[kind] ?? 'Fralda';
  const parts: string[] = [base];

  const texture = DIAPER_TEXTURE_LABEL[String(payload.poopTexture ?? '')];
  const poopColor = DIAPER_POOP_COLOR_LABEL[String(payload.poopColor ?? '')];
  const peeColor = DIAPER_PEE_COLOR_LABEL[String(payload.peeColor ?? '')];
  const qty = DIAPER_QUANTITY_LABEL[String(payload.quantity ?? '')];

  if (texture) parts.push(texture);
  else if (poopColor) parts.push(poopColor);
  else if (peeColor) parts.push(peeColor);
  else if (qty) parts.push(qty);

  return parts.join(' · ');
}

export function buildDiaperDetail(payload: DiaperLikePayload): string | null {
  const details: string[] = [];
  const kind = inferDiaperKind(payload);
  const showPee = kind === 'pee' || kind === 'both';
  const showPoop = kind === 'poop' || kind === 'both';

  if (showPee) {
    const peeColor = DIAPER_PEE_COLOR_LABEL[String(payload.peeColor ?? '')];
    if (peeColor) details.push(peeColor);
  }

  if (showPoop) {
    const poopColor = DIAPER_POOP_COLOR_LABEL[String(payload.poopColor ?? '')];
    const texture = DIAPER_TEXTURE_LABEL[String(payload.poopTexture ?? '')];
    if (poopColor) details.push(poopColor);
    if (texture) details.push(texture);
  }

  return details.length > 0 ? details.join(' · ') : null;
}

function buildFeedSummary(payload: FeedLikePayload, log: RoutineLog): string {
  const mode = payload.mode ?? null;

  if (mode === 'breastfeeding') {
    if (log.endTime) {
      const sec = Math.floor(
        (new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 1000
      );
      if (sec > 0) return `Duração: ${fmtDurationShort(sec)}`;
    }

    if (payload.side === 'left') return 'Seio esquerdo';
    if (payload.side === 'right') return 'Seio direito';
    if (payload.side === 'both') return 'Ambos os lados';
    return 'Amamentação';
  }

  if (mode === 'bottle') {
    const amount = payload.amountMl ? ` · ${payload.amountMl}ml` : '';
    return `Mamadeira${amount}`;
  }

  if (mode === 'solid') {
    return payload.food ? `Sólido · ${payload.food}` : 'Alimentação sólida';
  }

  if (payload.amountMl) {
    return `Mamadeira · ${payload.amountMl}ml`;
  }

  if (payload.food) {
    return `Alimentação · ${payload.food}`;
  }

  return 'Alimentação';
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

export function groupLogsByTimeOfDay(
  logs: RoutineLog[]
): { group: TimeOfDay; logs: RoutineLog[] }[] {
  const order: TimeOfDay[] = ['Manhã', 'Tarde', 'Noite', 'Madrugada'];
  const map = new Map<TimeOfDay, RoutineLog[]>();

  for (const log of logs) {
    const tod = getTimeOfDay(log.startTime);
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
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const sleepLogs = logs.filter(l => l.type === 'sleep' && !!l.endTime);
  const diaperLogs = logs.filter(l => l.type === 'diaper');

  let avgFeedIntervalMin: number | null = null;
  let feedingIrregular = false;

  if (feedLogs.length >= 2) {
    const intervals: number[] = [];

    for (let i = 1; i < feedLogs.length; i++) {
      const diffMin =
        (new Date(feedLogs[i].startTime).getTime() -
          new Date(feedLogs[i - 1].startTime).getTime()) /
        60000;
      intervals.push(diffMin);
    }

    avgFeedIntervalMin = Math.round(
      intervals.reduce((a, b) => a + b, 0) / intervals.length
    );

    const avg = avgFeedIntervalMin;
    feedingIrregular = intervals.some(iv => iv > avg * 2.5 || iv < avg * 0.3);
  }

  const totalSleepSec = sleepLogs.reduce((acc, l) => {
    return (
      acc +
      Math.floor(
        (new Date(l.endTime!).getTime() - new Date(l.startTime).getTime()) / 1000
      )
    );
  }, 0);

  const hasLongSleep = sleepLogs.some(l => {
    const sec = Math.floor(
      (new Date(l.endTime!).getTime() - new Date(l.startTime).getTime()) / 1000
    );
    return sec > 4 * 3600;
  });

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
  primaryFocus: 'feeding' | 'sleep' | 'development';
  phaseHint: string;
  idealFeedIntervalMin: number | null;
  maxSleepStretchHours: number;
}

export function getAgeContext(birthDate: string): AgeContext {
  const diffMs = Date.now() - new Date(`${birthDate}T00:00:00`).getTime();
  const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));

  if (months < 1) {
    return {
      months,
      primaryFocus: 'feeding',
      phaseHint: 'Recém-nascido · alimentação frequente',
      idealFeedIntervalMin: 120,
      maxSleepStretchHours: 3,
    };
  }

  if (months < 3) {
    return {
      months,
      primaryFocus: 'feeding',
      phaseHint: `${months}m · crescimento acelerado`,
      idealFeedIntervalMin: 150,
      maxSleepStretchHours: 4,
    };
  }

  if (months < 6) {
    return {
      months,
      primaryFocus: 'feeding',
      phaseHint: `${months}m · explorando o mundo`,
      idealFeedIntervalMin: 180,
      maxSleepStretchHours: 6,
    };
  }

  if (months < 12) {
    return {
      months,
      primaryFocus: 'development',
      phaseHint: `${months}m · fases de desenvolvimento`,
      idealFeedIntervalMin: 210,
      maxSleepStretchHours: 8,
    };
  }

  return {
    months,
    primaryFocus: 'development',
    phaseHint: `${Math.floor(months / 12)}a ${months % 12}m`,
    idealFeedIntervalMin: null,
    maxSleepStretchHours: 10,
  };
}

export function getEventPresentation(log: RoutineLog): EventPresentation {
  const payload = log.payload ?? {};
  const userNotes = getUserNotes(log.notes);
  const includeInReport = asBoolean((payload as Record<string, unknown>).includeInReport) ?? false;

  switch (log.type) {
    case 'feed': {
      const feedPayload = payload as {
        mode?: 'breastfeeding' | 'bottle' | 'solid' | null;
        side?: 'left' | 'right' | 'both' | null;
        amountMl?: number | null;
        food?: string | null;
        totalSeconds?: number | null;
      };

      const isBreastfeed = feedPayload.mode === 'breastfeeding';
      const totalSec =
        asNumber(feedPayload.totalSeconds) ??
        (log.endTime
          ? Math.floor(
              (new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 1000
            )
          : 0);

      const hintLabel = getFeedHint(feedPayload, log);

      return {
        title: isBreastfeed
          ? 'Amamentação'
          : feedPayload.mode === 'solid'
          ? 'Alimentação'
          : 'Mamadeira',
        emoji: isBreastfeed ? '🤱' : feedPayload.mode === 'solid' ? '🥣' : '🍼',
        color: 'hsl(152,15%,55%)',
        bgColor: 'color-mix(in srgb, hsl(152,15%,55%) 12%, transparent)',
        summary: buildFeedSummary(feedPayload, log),
        badge: isBreastfeed && totalSec > 0 ? fmtDurationShort(totalSec) : null,
        observationPreview: userNotes ? userNotes.slice(0, 50) : null,
        detailKind: isBreastfeed ? 'breastfeed' : 'bottle',
        tappable: true,
        editPath: isBreastfeed ? `/feed/detail/${log.id}` : `/bottle/detail/${log.id}`,
        hint: hintLabel ? { label: hintLabel, variant: 'info' } : null,
        includeInReport,
      };
    }

    case 'sleep': {
      const duration = log.endTime ? fmtRangeDuration(log.startTime, log.endTime) : null;
      const ongoing = !log.endTime;
      const hintLabel = getSleepHint(log);

      return {
        title: 'Sono',
        emoji: '😴',
        color: 'hsl(270,12%,52%)',
        bgColor: 'color-mix(in srgb, hsl(270,12%,52%) 12%, transparent)',
        summary: ongoing ? 'Em andamento' : duration ? `Duração: ${duration}` : 'Sono',
        badge: duration,
        observationPreview: userNotes ? userNotes.slice(0, 50) : null,
        detailKind: 'sleep',
        tappable: true,
        editPath: `/sleep/detail/${log.id}`,
        hint: hintLabel ? { label: hintLabel, variant: 'info' } : null,
        includeInReport,
      };
    }

    case 'diaper': {
      const diaperPayload = payload as {
        pee?: boolean | null;
        poop?: boolean | null;
        poopColor?: string | null;
        poopTexture?: string | null;
        peeColor?: string | null;
        quantity?: string | null;
      };

      const significant = isDiaperSignificant(diaperPayload);
      const hintLabel = getDiaperHint(diaperPayload);

      return {
        title: 'Fralda',
        emoji: '🧷',
        color: 'hsl(32,80%,57%)',
        bgColor: 'color-mix(in srgb, hsl(32,80%,57%) 12%, transparent)',
        summary: buildDiaperSummary(diaperPayload),
        badge: null,
        observationPreview: userNotes ? userNotes.slice(0, 50) : null,
        detailKind: 'diaper',
        tappable: true,
        editPath: `/diaper/detail/${log.id}`,
        isSignificant: significant,
        hint: hintLabel ? { label: hintLabel, variant: 'info' } : null,
        includeInReport,
      };
    }

    case 'note':
    default: {
      const notePayload = payload as { text?: string | null };
      const noteText = asString(notePayload.text) ?? userNotes ?? '';

      return {
        title: 'Nota',
        emoji: '📝',
        color: 'hsl(var(--ninho-brown))',
        bgColor: 'hsl(var(--muted))',
        summary: noteText,
        badge: null,
        observationPreview: null,
        detailKind: 'none',
        tappable: false,
        editPath: '',
        includeInReport,
      };
    }
  }
}

export { fmtTime };