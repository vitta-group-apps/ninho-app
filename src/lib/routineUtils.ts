/**
 * Shared utilities for routine log parsing, formatting, and display metadata.
 * Used by HomePage, RotinaPage, and all log sheets.
 *
 * Backward compatibility:
 *  - Old breastfeed events: notes = "__payload:{...}" with feeding_method/mode/side
 *  - Old diaper events:     notes = "__payload:{...}" with diaper_type (not kind)
 *  - Very old events:       notes = plain text string (no payload prefix)
 */

import type { Tables } from '@/integrations/supabase/types';

export type RoutineLog = Tables<'routine_logs'>;

// ─── Payload encode/decode ─────────────────────────────────────────────────

export function parsePayload(notes: string | null): Record<string, string | number> {
  if (!notes) return {};
  try {
    if (notes.startsWith('__payload:')) return JSON.parse(notes.slice('__payload:'.length));
  } catch { /* noop */ }
  // Plain-text notes have no payload — return empty (user notes handled by getUserNotes)
  return {};
}

export function makePayloadNotes(
  payload: Record<string, unknown>,
  userNotes?: string,
): string {
  const obj: Record<string, unknown> = { ...payload };
  if (userNotes?.trim()) obj._notes = userNotes.trim();
  return '__payload:' + JSON.stringify(obj);
}

export function getUserNotes(notes: string | null): string | null {
  if (!notes) return null;
  if (notes.startsWith('__payload:')) {
    try {
      const obj = JSON.parse(notes.slice('__payload:'.length)) as Record<string, string>;
      return obj._notes ?? null;
    } catch { return null; }
  }
  // Plain-text notes are themselves user notes
  return notes.trim() || null;
}

// ─── Time formatters ───────────────────────────────────────────────────────

/** Format seconds as MM:SS for live timers */
export function fmtTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Format seconds as human-readable short (18min, 1h 2min) */
export function fmtDurationShort(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
}

/** Format time as HH:MM */
export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** "há X" since a date */
export function fmtTimeSince(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return 'agora';
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h${rem}min` : `${h}h`;
}

/** Duration between two ISO strings */
export function fmtRangeDuration(start: string, end: string): string {
  const sec = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  return fmtDurationShort(sec);
}

// ─── Display metadata ──────────────────────────────────────────────────────
// Legacy compatibility layer used by non-EventCard consumers.
// EventCard uses getEventPresentation from eventSystem.ts instead.

export interface LogMeta {
  emoji: string;
  label: string;
  sub: string;
  detail: string | null;
  color: string;
  bgColor: string;
  durationBadge: string | null;
}

export function getLogMeta(log: RoutineLog): LogMeta {
  const p = parsePayload(log.notes);

  switch (log.type) {
    case 'feed': {
      // New breastfeed session format (session_type = 'breastfeed')
      if (p.session_type === 'breastfeed') {
        const total = Number(p.total_seconds ?? 0);
        const left = Number(p.left_seconds ?? 0);
        const right = Number(p.right_seconds ?? 0);
        const sw = Number(p.switches ?? 0);
        const parts: string[] = [];
        if (left > 0) parts.push(`E: ${fmtDurationShort(left)}`);
        if (right > 0) parts.push(`D: ${fmtDurationShort(right)}`);
        if (sw > 0) parts.push(`${sw} troca${sw > 1 ? 's' : ''}`);
        return {
          emoji: '🤱',
          label: 'Amamentação',
          sub: parts.join(' · '),
          detail: parts.length > 0 ? parts.join(' · ') : null,
          color: 'hsl(152,15%,55%)',
          bgColor: 'hsl(152,15%,55%,0.12)',
          durationBadge: total > 0 ? fmtDurationShort(total) : null,
        };
      }
      // Legacy format / bottle / formula
      const methodMap: Record<string, string> = {
        breast: 'Seio',
        bottle: 'Mamadeira',
        formula: 'Fórmula',
      };
      const method = String(p.feeding_method ?? p.session_type ?? '');
      const modeLabel = p.mode === 'timer' ? ' · cronômetro' : '';
      const sideLabel = p.side === 'left' ? ' (esq)' : p.side === 'right' ? ' (dir)' : '';
      const amountLabel = p.amount_ml ? ` · ${p.amount_ml}ml` : '';
      const displayMethod = method === 'formula' ? 'Fórmula' : method === 'bottle' ? 'Mamadeira' : 'Amamentação';
      return {
        emoji: method === 'formula' || method === 'bottle' ? '🍼' : '🤱',
        label: displayMethod,
        sub: `${methodMap[method] ?? 'Seio'}${sideLabel}${modeLabel}${amountLabel}`,
        detail: null,
        color: 'hsl(152,15%,55%)',
        bgColor: 'hsl(152,15%,55%,0.12)',
        durationBadge: null,
      };
    }
    case 'sleep': {
      const duration = log.end_time ? fmtRangeDuration(log.start_time, log.end_time) : null;
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
      // Support both new `kind` and legacy `diaper_type` field
      const kind = String(p.kind ?? p.diaper_type ?? '');
      const kindMap: Record<string, string> = {
        pee:  'Xixi 💛',
        poop: 'Cocô 💩',
        both: 'Xixi + Cocô 🔄',
      };
      return {
        emoji: '🧷',
        label: 'Fralda', // was "Troca" — fixed
        sub: kindMap[kind] ?? '',
        detail: null,
        color: 'hsl(32,80%,57%)',
        bgColor: 'hsl(32,80%,57%,0.12)',
        durationBadge: null,
      };
    }
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
