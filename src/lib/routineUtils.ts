/**
 * Shared utilities for routine logs.
 *
 * Contrato novo:
 *  - RoutineRecord é a fonte oficial
 *  - payload é estruturado
 *  - notes é texto humano
 *
 * Este arquivo NÃO serializa mais JSON em notes.
 */

import type {
  RoutineRecord,
  FeedPayload,
  DiaperPayload,
} from '@/lib/contracts/routine';

export type RoutineLog = RoutineRecord;

export function getUserNotes(notes: string | null): string | null {
  return typeof notes === 'string' && notes.trim().length > 0 ? notes.trim() : null;
}

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

export interface LogMeta {
  emoji: string;
  label: string;
  sub: string;
  detail: string | null;
  color: string;
  bgColor: string;
  durationBadge: string | null;
}

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

export function getLogMeta(log: RoutineLog): LogMeta {
  switch (log.type) {
    case 'feed': {
      const payload = (log.payload ?? {}) as FeedPayload;
      const mode = payload.mode ?? null;

      if (mode === 'breastfeeding' || mode === 'manual') {
        const total =
          typeof payload.totalSeconds === 'number'
            ? payload.totalSeconds
            : log.endTime
            ? Math.floor(
                (new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 1000
              )
            : 0;

        const left =
          typeof payload.leftSeconds === 'number' ? payload.leftSeconds : 0;
        const right =
          typeof payload.rightSeconds === 'number' ? payload.rightSeconds : 0;
        const switches =
          typeof payload.switches === 'number' ? payload.switches : 0;

        const parts: string[] = [];
        if (left > 0) parts.push(`E: ${fmtDurationShort(left)}`);
        if (right > 0) parts.push(`D: ${fmtDurationShort(right)}`);
        if (switches > 0) parts.push(`${switches} troca${switches > 1 ? 's' : ''}`);
        if (mode === 'manual') parts.push('manual');

        return {
          emoji: '🤱',
          label: 'Amamentação',
          sub: parts.join(' · ') || 'Amamentação',
          detail: parts.length > 0 ? parts.join(' · ') : null,
          color: 'hsl(152,15%,55%)',
          bgColor: 'hsl(152,15%,55%,0.12)',
          durationBadge: total > 0 ? fmtDurationShort(total) : null,
        };
      }

      if (mode === 'bottle') {
        const amountLabel =
          typeof payload.amountMl === 'number' ? ` · ${payload.amountMl}ml` : '';

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
        const food =
          typeof payload.food === 'string' && payload.food.trim()
            ? payload.food.trim()
            : '';

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

    case 'sleep': {
      const duration = log.endTime
        ? fmtRangeDuration(log.startTime, log.endTime)
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

    case 'diaper': {
      const payload = (log.payload ?? {}) as DiaperPayload;

      const pee = payload.pee === true;
      const poop = payload.poop === true;
      const kind = pee && poop ? 'both' : poop ? 'poop' : 'pee';

      const kindMap: Record<string, string> = {
        pee: 'Xixi 💛',
        poop: 'Cocô 💩',
        both: 'Xixi + Cocô 🔄',
      };

      const detailParts: string[] = [];

      if (payload.quantity) {
        detailParts.push(DIAPER_QUANTITY_LABEL[payload.quantity] ?? payload.quantity);
      }

      if (payload.peeColor) {
        detailParts.push(DIAPER_PEE_COLOR_LABEL[payload.peeColor] ?? payload.peeColor);
      }

      if (payload.poopColor) {
        detailParts.push(DIAPER_POOP_COLOR_LABEL[payload.poopColor] ?? payload.poopColor);
      }

      if (payload.poopTexture) {
        detailParts.push(
          DIAPER_TEXTURE_LABEL[payload.poopTexture] ?? payload.poopTexture
        );
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
