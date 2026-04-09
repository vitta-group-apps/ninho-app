/**
 * Ninho Unified Event System v5 — DB-row-first presentation layer
 *
 * Fonte oficial:
 *  - routine_logs (Supabase)
 *  - payload = dado estruturado
 *  - notes = observação humana
 *
 * Regras:
 *  - hints só quando realmente relevantes
 *  - nada alarmista
 *  - todas as leituras usando start_time / end_time
 *  - snake_case como prioridade, camelCase apenas como fallback temporário
 */

import type { Tables } from '@/integrations/supabase/types';
import { fmtDurationShort, fmtTime, fmtRangeDuration } from '@/lib/routineUtils';

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
  editPath: string;
  hint?: { label: string; variant: 'active' | 'paused' | 'info' } | null;
  isSignificant?: boolean;
  includeInReport?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

type PayloadRecord = Record<string, unknown>;

function isRecord(value: unknown): value is PayloadRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function getPayload(log: RoutineLog): PayloadRecord {
  return isRecord(log.payload) ? log.payload : {};
}

function readString(payload: PayloadRecord, snake: string, camel?: string): string | null {
  return asString(payload[snake]) ?? (camel ? asString(payload[camel]) : null);
}

function readNumber(payload: PayloadRecord, snake: string, camel?: string): number | null {
  return asNumber(payload[snake]) ?? (camel ? asNumber(payload[camel]) : null);
}

function readBoolean(payload: PayloadRecord, snake: string, camel?: string): boolean | null {
  return asBoolean(payload[snake]) ?? (camel ? asBoolean(payload[camel]) : null);
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

// ─── Feed / Diaper normalized payloads ─────────────────────────────────────

type FeedLikePayload = {
  mode?: 'breastfeeding' | 'bottle' | 'solid' | null;
  side?: 'left' | 'right' | 'both' | null;
  amount_ml?: number | null;
  food?: string | null;
  total_seconds?: number | null;
  method?: string | null;
};

type DiaperLikePayload = {
  kind?: 'pee' | 'poop' | 'both' | null;
  quantity?: string | null;
  pee_color?: string | null;
  poop_color?: string | null;
  poop_texture?: string | null;
};

function normalizeFeedPayload(payload: PayloadRecord): FeedLikePayload {
  return {
    mode: readString(payload, 'mode') as FeedLikePayload['mode'],
    side: readString(payload, 'side') as FeedLikePayload['side'],
    amount_ml: readNumber(payload, 'amount_ml', 'amountMl'),
    food: readString(payload, 'food'),
    total_seconds: readNumber(payload, 'total_seconds', 'totalSeconds'),
    method: readString(payload, 'method'),
  };
}

function normalizeDiaperPayload(payload: PayloadRecord): DiaperLikePayload {
  const kind = readString(payload, 'kind') as DiaperLikePayload['kind'];

  if (kind) {
    return {
      kind,
      quantity: readString(payload, 'quantity'),
      pee_color: readString(payload, 'pee_color', 'peeColor'),
      poop_color: readString(payload, 'poop_color', 'poopColor'),
      poop_texture: readString(payload, 'poop_texture', 'poopTexture'),
    };
  }

  const pee = readBoolean(payload, 'pee');
  const poop = readBoolean(payload, 'poop');

  let inferredKind: 'pee' | 'poop' | 'both' = 'pee';
  if (pee && poop) inferredKind = 'both';
  else if (poop) inferredKind = 'poop';

  return {
    kind: inferredKind,
    quantity: readString(payload, 'quantity'),
    pee_color: readString(payload, 'pee_color', 'peeColor'),
    poop_color: readString(payload, 'poop_color', 'poopColor'),
    poop_texture: readString(payload, 'poop_texture', 'poopTexture'),
  };
}

// ─── Intelligence: anomaly detection ───────────────────────────────────────

function inferDiaperKind(payload: DiaperLikePayload): 'pee' | 'poop' | 'both' {
  if (payload.kind === 'both' || payload.kind === 'poop' || payload.kind === 'pee') {
    return payload.kind;
  }
  return 'pee';
}

export function isDiaperSignificant(payload: DiaperLikePayload): boolean {
  const poopColor = String(payload.poop_color ?? '');
  const peeColor = String(payload.pee_color ?? '');
  const texture = String(payload.poop_texture ?? '');

  return (
    ['red', 'black', 'white'].includes(poopColor) ||
    texture === 'mucus_like' ||
    peeColor === 'dark_yellow'
  );
}

function getDiaperHint(payload: DiaperLikePayload): string | null {
  const poopColor = String(payload.poop_color ?? '');
  const peeColor = String(payload.pee_color ?? '');
  const texture = String(payload.poop_texture ?? '');

  if (['red', 'black', 'white'].includes(poopColor)) return 'Cor incomum';
  if (texture === 'mucus_like') return 'Com muco';
  if (peeColor === 'dark_yellow') return 'Xixi escuro';
  return null;
}

function getSleepHint(log: RoutineLog): string | null {
  if (!log.end_time) return null;

  const sec = Math.floor(
    (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 1000
  );

  if (sec <= 0) return null;
  if (sec > 4 * 3600) return 'Sono longo';
  if (sec < 20 * 60) return 'Soneca curta';
  return null;
}

function getFeedHint(payload: FeedLikePayload, log: RoutineLog): string | null {
  const isBreastfeeding = payload.mode === 'breastfeeding';
  if (!isBreastfeeding) return null;

  const totalSec =
    payload.total_seconds ??
    (log.end_time
      ? Math.floor(
          (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 1000
        )
      : 0);

  if (!totalSec || totalSec <= 0) return null;
  if (totalSec > 45 * 60) return 'Mamada longa';
  if (totalSec < 5 * 60) return 'Mamada curta';
  return null;
}

// ─── Summary builders ──────────────────────────────────────────────────────

export function buildDiaperSummary(payload: DiaperLikePayload): string {
  const kind = inferDiaperKind(payload);
  const base = DIAPER_KIND_LABEL[kind] ?? 'Fralda';
  const parts: string[] = [base];

  const texture = DIAPER_TEXTURE_LABEL[String(payload.poop_texture ?? '')];
  const poopColor = DIAPER_POOP_COLOR_LABEL[String(payload.poop_color ?? '')];
  const peeColor = DIAPER_PEE_COLOR_LABEL[String(payload.pee_color ?? '')];
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
    const peeColor = DIAPER_PEE_COLOR_LABEL[String(payload.pee_color ?? '')];
    if (peeColor) details.push(peeColor);
  }

  if (showPoop) {
    const poopColor = DIAPER_POOP_COLOR_LABEL[String(payload.poop_color ?? '')];
    const texture = DIAPER_TEXTURE_LABEL[String(payload.poop_texture ?? '')];
    if (poopColor) details.push(poopColor);
    if (texture) details.push(texture);
  }

  return details.length > 0 ? details.join(' · ') : null;
}

function buildFeedSummary(payload: FeedLikePayload, log: RoutineLog): string {
  if (payload.mode === 'breastfeeding') {
    if (log.end_time) {
      const sec = Math.floor(
        (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 1000
      );
      if (sec > 0) return `Duração: ${fmtDurationShort(sec)}`;
    }

    if (payload.side === 'left') return 'Seio esquerdo';
    if (payload.side === 'right') return 'Seio direito';
    if (payload.side === 'both') return 'Ambos os lados';
    return 'Amamentação';
  }

  if (payload.mode === 'bottle') {
    const amount = payload.amount_ml ? ` · ${payload.amount_ml}ml` : '';
    return `Mamadeira${amount}`;
  }

  if (payload.mode === 'solid') {
    return payload.food ? `Sólido · ${payload.food}` : 'Alimentação sólida';
  }

  if (payload.amount_ml) {
    return `Mamadeira · ${payload.amount_ml}ml`;
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
    const tod = getTimeOfDay(log.start_time);
    if (!map.has(tod)) map.set(tod, []);
    map.get(tod)!.push(log);
  }

  return order
    .filter(g => map.has(g))
    .map(g => ({ group: g, logs: map.get(g)! }));
}

// ─── Pattern analysis ──────────────────────────────────────────────────────

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

  const sleepLogs = logs.filter(l => l.type === 'sleep' && !!l.end_time);
  const diaperLogs = logs.filter(l => l.type === 'diaper');

  let avgFeedIntervalMin: number | null = null;
  let feedingIrregular = false;

  if (feedLogs.length >= 2) {
    const intervals: number[] = [];

    for (let i = 1; i < feedLogs.length; i++) {
      const diffMin =
        (new Date(feedLogs[i].start_time).getTime() -
          new Date(feedLogs[i - 1].start_time).getTime()) /
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
        (new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000
      )
    );
  }, 0);

  const hasLongSleep = sleepLogs.some(l => {
    const sec = Math.floor(
      (new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000
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

// ─── Presentation ──────────────────────────────────────────────────────────

export function getEventPresentation(log: RoutineLog): EventPresentation {
  const payload = getPayload(log);
  const userNotes = getUserNotes(log.notes);

  const includeInReport =
    readBoolean(payload, 'include_in_report', 'includeInReport') ?? false;

  switch (log.type) {
    case 'feed': {
      const feedPayload = normalizeFeedPayload(payload);
      const isBreastfeed = feedPayload.mode === 'breastfeeding';

      const totalSec =
        feedPayload.total_seconds ??
        (log.end_time
          ? Math.floor(
              (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 1000
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
      const duration = log.end_time ? fmtRangeDuration(log.start_time, log.end_time) : null;
      const ongoing = !log.end_time;
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
      const diaperPayload = normalizeDiaperPayload(payload);
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
      const noteText = readString(payload, 'text') ?? userNotes ?? '';

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


// ─── UI options — Sleep ────────────────────────────────────────────────────

export const SLEEP_LOCATION_OPTIONS = [
  { value: 'berco',    label: '🛏 Berço' },
  { value: 'colo',     label: '🤱 Colo' },
  { value: 'carrinho', label: '🛒 Carrinho' },
  { value: 'cama',     label: '🛌 Cama' },
  { value: 'outro',    label: '📦 Outro' },
];

export const SLEEP_HOW_OPTIONS = [
  { value: 'sozinho', label: 'Sozinho' },
  { value: 'mamando', label: 'Mamando' },
  { value: 'colo',    label: 'No colo' },
  { value: 'embalo',  label: 'No embalo' },
  { value: 'outro',   label: 'Outro' },
];

export const AWAKENINGS_OPTIONS = [
  { value: '0',  label: 'Nenhuma' },
  { value: '1',  label: '1 vez' },
  { value: '2',  label: '2 vezes' },
  { value: '3+', label: '3 ou mais' },
];

export const SLEEP_TYPE_OPTIONS = [
  { value: 'noturno', label: '🌙 Noturno' },
  { value: 'soneca',  label: '☀️ Soneca' },
];

export const SLEEP_POSITION_OPTIONS = [
  { value: 'costas',  label: '↑ De costas' },
  { value: 'lado',    label: '↔ De lado' },
  { value: 'barriga', label: '↓ De barriga' },
];

export const SLEEP_QUALITY_OPTIONS = [
  { value: 'tranquilo', label: '😌 Tranquilo' },
  { value: 'agitado',   label: '😤 Agitado' },
  { value: 'com_choro', label: '😢 Com choro' },
];

// ─── UI options — Bottle ───────────────────────────────────────────────────

export const BOTTLE_TYPE_OPTIONS = [
  { value: 'bottle',  label: '🍼 Leite materno ordenhado' },
  { value: 'formula', label: '🥛 Fórmula' },
];

export const BOTTLE_AMOUNT_OPTIONS = [
  { value: '30',  label: '30ml' },
  { value: '60',  label: '60ml' },
  { value: '90',  label: '90ml' },
  { value: '120', label: '120ml' },
  { value: '150', label: '150ml' },
  { value: '180', label: '180ml' },
  { value: '210', label: '210ml' },
  { value: '240', label: '240ml' },
];

export const BOTTLE_TEMP_OPTIONS = [
  { value: 'cold', label: '🧊 Fria' },
  { value: 'warm', label: '☁️ Morna' },
  { value: 'hot',  label: '🌡️ Quente' },
];

export const BOTTLE_REACTION_OPTIONS = [
  { value: 'mamou_bem',  label: '😊 Aceitou bem' },
  { value: 'rejeitou',   label: '😤 Recusou' },
  { value: 'pouquinho',  label: '🥺 Mamou pouco' },
  { value: 'arrotou',    label: '👍 Arrotou' },
  { value: 'regurgitou', label: '😬 Regurgitou' },
];

// ─── UI options — Breastfeeding ────────────────────────────────────────────

export const BREASTFEEDING_QUICK_TAGS = [
  { id: 'mamou_bem',    label: '😊 Mamou bem' },
  { id: 'inquieto',     label: '😟 Inquieto' },
  { id: 'dormiu',       label: '😴 Dormiu durante' },
  { id: 'pega_boa',     label: '👍 Pega boa' },
  { id: 'rejeitou_lado', label: '↩️ Rejeitou lado' },
];

// ─── UI options — Diaper (derived from label dicts) ────────────────────────

export type DiaperKind = 'pee' | 'poop' | 'both';

export const DIAPER_KIND_OPTIONS: { kind: DiaperKind; emoji: string; label: string }[] = [
  { kind: 'pee',  emoji: '💛', label: 'Xixi' },
  { kind: 'poop', emoji: '💩', label: 'Cocô' },
  { kind: 'both', emoji: '🔄', label: 'Xixi + Cocô' },
];

export const DIAPER_QUANTITY_OPTIONS = Object.entries(DIAPER_QUANTITY_LABEL).map(
  ([value, label]) => ({ value, label })
);
export const DIAPER_PEE_COLOR_OPTIONS = Object.entries(DIAPER_PEE_COLOR_LABEL).map(
  ([value, label]) => ({ value, label })
);
export const DIAPER_POOP_COLOR_OPTIONS = Object.entries(DIAPER_POOP_COLOR_LABEL).map(
  ([value, label]) => ({ value, label })
);
export const DIAPER_TEXTURE_OPTIONS = Object.entries(DIAPER_TEXTURE_LABEL).map(
  ([value, label]) => ({ value, label })
);

export { fmtTime };