/**
 * Shared utilities for routine logs.
 *
 * Modelo novo:
 *  - routine_logs (Supabase) é a fonte da verdade
 *  - payload é estruturado
 *  - notes é texto humano
 *
 * Este arquivo NÃO serializa JSON em notes.
 * Snake_case é prioridade; camelCase fica só como fallback temporário.
 */

import type { Tables } from '@/integrations/supabase/types';

export type RoutineLog = Tables<'routine_logs'>;

type PayloadRecord = Record<string, unknown>;

export interface LogMeta {
  emoji: string;
  label: string;
  sub: string;
  detail: string | null;
  color: string;
  bgColor: string;
  durationBadge: string | null;
}

// ─── Basic helpers ──────────────────────────────────────────────────────────

function isRecord(value: unknown): value is PayloadRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getPayload(log: RoutineLog): PayloadRecord {
  return isRecord(log.payload) ? log.payload : {};
}

function readString(payload: PayloadRecord, snake: string, camel?: string): string | null {
  const snakeValue = payload[snake];
  if (typeof snakeValue === 'string' && snakeValue.trim().length > 0) return snakeValue.trim();

  if (camel) {
    const camelValue = payload[camel];
    if (typeof camelValue === 'string' && camelValue.trim().length > 0) return camelValue.trim();
  }

  return null;
}

function readNumber(payload: PayloadRecord, snake: string, camel?: string): number | null {
  const snakeValue = payload[snake];
  if (typeof snakeValue === 'number' && Number.isFinite(snakeValue)) return snakeValue;

  if (camel) {
    const camelValue = payload[camel];
    if (typeof camelValue === 'number' && Number.isFinite(camelValue)) return camelValue;
  }

  return null;
}

function readBoolean(payload: PayloadRecord, snake: string, camel?: string): boolean | null {
  const snakeValue = payload[snake];
  if (typeof snakeValue === 'boolean') return snakeValue;

  if (camel) {
    const camelValue = payload[camel];
    if (typeof camelValue === 'boolean') return camelValue;
  }

  return null;
}

// ─── Notes ──────────────────────────────────────────────────────────────────

export function getUserNotes(notes: string | null): string | null {
  return typeof notes === 'string' && notes.trim().length > 0 ? notes.trim() : null;
}

// ─── Time formatters ────────────────────────────────────────────────────────

export function fmtTimer(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function fmtDurationShort(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;

  if (safe < 60) return `${safe}s`;

  const m = Math.floor(safe / 60);
  if (m < 60) return `${m}min`;

  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtTimeSince(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);

  if (diff < 60) return 'agora';

  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}min`;

  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h${rem}min` : `${h}h`;
}

export function fmtRangeDuration(start: string, end: string): string {
  const sec = Math.floor(
    (new Date(end).getTime() - new Date(start).getTime()) / 1000
  );
  return fmtDurationShort(sec);
}

// ─── Dictionaries ───────────────────────────────────────────────────────────

const DIAPER_QUANTITY_LABEL: Record<string, string> = {
  small: 'pouca',
  medium: 'média',
  large: 'grande',
};

const DIAPER_PEE_COLOR_LABEL: Record<string, string> = {
  clear: 'transparente',
  pale_yellow: 'amarelo claro',
  dark_yellow: 'amarelo escuro',
  other: 'outra cor',
};

const DIAPER_POOP_COLOR_LABEL: Record<string, string> = {
  yellow: 'amarelo',
  green: 'verde',
  brown: 'marrom',
  dark: 'escuro',
  red: 'avermelhado',
  black: 'preto',
  white: 'branco',
  other: 'outra cor',
};

const DIAPER_TEXTURE_LABEL: Record<string, string> = {
  liquid: 'líquido',
  pasty: 'pastoso',
  soft: 'macio',
  firm: 'firme',
  mucus_like: 'com muco',
  other: 'outro',
};

// ─── Feed meta ──────────────────────────────────────────────────────────────

function getFeedMeta(log: RoutineLog): LogMeta {
  const payload = getPayload(log);

  const mode = readString(payload, 'mode');
  const totalSeconds =
    readNumber(payload, 'total_seconds', 'totalSeconds') ??
    (log.end_time
      ? Math.floor(
          (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 1000
        )
      : 0);

  const leftSeconds = readNumber(payload, 'left_seconds', 'leftSeconds') ?? 0;
  const rightSeconds = readNumber(payload, 'right_seconds', 'rightSeconds') ?? 0;
  const switches = readNumber(payload, 'switches') ?? 0;
  const amountMl = readNumber(payload, 'amount_ml', 'amountMl');
  const food = readString(payload, 'food');

  if (mode === 'breastfeeding' || mode === 'manual') {
    const parts: string[] = [];

    if (leftSeconds > 0) parts.push(`E: ${fmtDurationShort(leftSeconds)}`);
    if (rightSeconds > 0) parts.push(`D: ${fmtDurationShort(rightSeconds)}`);
    if (switches > 0) parts.push(`${switches} troca${switches > 1 ? 's' : ''}`);
    if (mode === 'manual') parts.push('manual');

    return {
      emoji: '🤱',
      label: 'Amamentação',
      sub: parts.join(' · ') || 'Amamentação',
      detail: parts.length > 0 ? parts.join(' · ') : null,
      color: 'hsl(152,15%,55%)',
      bgColor: 'hsl(152,15%,55%,0.12)',
      durationBadge: totalSeconds > 0 ? fmtDurationShort(totalSeconds) : null,
    };
  }

  if (mode === 'bottle') {
    const amountLabel = amountMl != null ? ` · ${amountMl}ml` : '';

    return {
      emoji: '🍼',
      label: 'Mamadeira',
      sub: `Mamadeira${amountLabel}`,
      detail: null,
      color: 'hsl(152,15%,55%)',
      bgColor: 'hsl(152,15%,55%,0.12)',
      durationBadge: null,
    };
  }

  if (mode === 'solid') {
    return {
      emoji: '🥣',
      label: 'Alimentação',
      sub: food ? `Sólido · ${food}` : 'Alimentação sólida',
      detail: null,
      color: 'hsl(152,15%,55%)',
      bgColor: 'hsl(152,15%,55%,0.12)',
      durationBadge: null,
    };
  }

  if (amountMl != null) {
    return {
      emoji: '🍼',
      label: 'Mamadeira',
      sub: `Mamadeira · ${amountMl}ml`,
      detail: null,
      color: 'hsl(152,15%,55%)',
      bgColor: 'hsl(152,15%,55%,0.12)',
      durationBadge: null,
    };
  }

  if (food) {
    return {
      emoji: '🥣',
      label: 'Alimentação',
      sub: `Alimentação · ${food}`,
      detail: null,
      color: 'hsl(152,15%,55%)',
      bgColor: 'hsl(152,15%,55%,0.12)',
      durationBadge: null,
    };
  }

  return {
    emoji: '🤱',
    label: 'Alimentação',
    sub: 'Registro de alimentação',
    detail: null,
    color: 'hsl(152,15%,55%)',
    bgColor: 'hsl(152,15%,55%,0.12)',
    durationBadge: null,
  };
}

// ─── Sleep meta ─────────────────────────────────────────────────────────────

function getSleepMeta(log: RoutineLog): LogMeta {
  const duration = log.end_time
    ? fmtRangeDuration(log.start_time, log.end_time)
    : null;

  return {
    emoji: '😴',
    label: 'Sono',
    sub: duration ? `Duração: ${duration}` : 'Em andamento',
    detail: null,
    color: 'hsl(270,12%,52%)',
    bgColor: 'hsl(270,12%,52%,0.12)',
    durationBadge: duration,
  };
}

// ─── Diaper meta ────────────────────────────────────────────────────────────

function getDiaperMeta(log: RoutineLog): LogMeta {
  const payload = getPayload(log);

  // Novo contrato
  const explicitKind = readString(payload, 'kind');
  const quantity = readString(payload, 'quantity');
  const peeColor = readString(payload, 'pee_color', 'peeColor');
  const poopColor = readString(payload, 'poop_color', 'poopColor');
  const poopTexture = readString(payload, 'poop_texture', 'poopTexture');

  // Fallback legado
  const legacyPee = readBoolean(payload, 'pee');
  const legacyPoop = readBoolean(payload, 'poop');

  let kind = explicitKind;
  if (!kind) {
    kind =
      legacyPee && legacyPoop
        ? 'both'
        : legacyPoop
        ? 'poop'
        : 'pee';
  }

  const kindMap: Record<string, string> = {
    pee: 'Xixi 💛',
    poop: 'Cocô 💩',
    both: 'Xixi + Cocô 🔄',
  };

  const detailParts: string[] = [];

  if (quantity) {
    detailParts.push(DIAPER_QUANTITY_LABEL[quantity] ?? quantity);
  }

  if (peeColor) {
    detailParts.push(DIAPER_PEE_COLOR_LABEL[peeColor] ?? peeColor);
  }

  if (poopColor) {
    detailParts.push(DIAPER_POOP_COLOR_LABEL[poopColor] ?? poopColor);
  }

  if (poopTexture) {
    detailParts.push(DIAPER_TEXTURE_LABEL[poopTexture] ?? poopTexture);
  }

  return {
    emoji: '🧷',
    label: 'Fralda',
    sub: kindMap[kind] ?? 'Fralda',
    detail: detailParts.length > 0 ? detailParts.join(' · ') : null,
    color: 'hsl(32,80%,57%)',
    bgColor: 'hsl(32,80%,57%,0.12)',
    durationBadge: null,
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function getLogMeta(log: RoutineLog): LogMeta {
  switch (log.type) {
    case 'feed':
      return getFeedMeta(log);

    case 'sleep':
      return getSleepMeta(log);

    case 'diaper':
      return getDiaperMeta(log);

    case 'note':
    default:
      return {
        emoji: '📝',
        label: 'Nota',
        sub: getUserNotes(log.notes) ?? '',
        detail: null,
        color: 'hsl(var(--ninho-brown))',
        bgColor: 'hsl(var(--muted))',
        durationBadge: null,
      };
  }
}