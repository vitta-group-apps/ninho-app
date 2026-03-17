/**
 * Ninho Unified Event System
 *
 * Single source of truth for how every routine event is:
 *  - titled
 *  - summarized
 *  - badged
 *  - colored
 *  - detailed
 *
 * Adding a new event type? Add one entry to EVENT_REGISTRY.
 * Nothing else needs to change for it to appear correctly
 * in Home timeline, Rotina timeline, and detail views.
 */

import type { Tables } from '@/integrations/supabase/types';
import { parsePayload, getUserNotes, fmtDurationShort, fmtTime, fmtRangeDuration } from '@/lib/routineUtils';

export type RoutineLog = Tables<'routine_logs'>;
export type EventType = 'feed' | 'sleep' | 'diaper' | 'note';

// ─── Detail behavior ───────────────────────────────────────────────────────

export type DetailKind =
  | 'breastfeed'   // opens FeedDetailSheet
  | 'diaper'       // opens DiaperDetailSheet
  | 'sleep'        // opens generic detail (future)
  | 'none';        // not tappable

// ─── Event presentation ────────────────────────────────────────────────────

export interface EventPresentation {
  /** Display title */
  title: string;
  /** Emoji icon */
  emoji: string;
  /** Main accent color (hsl string) */
  color: string;
  /** Background tint for icon container */
  bgColor: string;
  /** One-line human summary (Row 2) */
  summary: string;
  /** Optional short badge shown right-aligned (e.g. "18min") */
  badge: string | null;
  /** Optional observation preview (Row 3) — only if meaningful */
  observationPreview: string | null;
  /** Which detail sheet to open when tapped */
  detailKind: DetailKind;
  /** Whether tapping should open the detail view */
  tappable: boolean;
}

// ─── Diaper helpers ────────────────────────────────────────────────────────

const DIAPER_KIND_LABEL: Record<string, string> = {
  pee: 'Xixi 💛',
  poop: 'Cocô 💩',
  both: 'Xixi + Cocô',
};

const DIAPER_QUANTITY_LABEL: Record<string, string> = {
  little: 'pouca',
  medium: 'média',
  large: 'grande',
};

const DIAPER_COLOR_LABEL: Record<string, string> = {
  yellow: 'amarelo',
  green: 'verde',
  brown: 'marrom',
  dark: 'escuro',
  other: 'outra cor',
};

const DIAPER_TEXTURE_LABEL: Record<string, string> = {
  liquid: 'líquido',
  pasty: 'pastoso',
  firm: 'firme',
};

export function buildDiaperSummary(p: Record<string, string | number>): string {
  const kind = DIAPER_KIND_LABEL[String(p.kind ?? p.diaper_type ?? '')] ?? '';
  const parts: string[] = [kind].filter(Boolean);
  const qty = DIAPER_QUANTITY_LABEL[String(p.quantity ?? '')];
  if (qty) parts.push(qty);
  return parts.join(' · ') || 'Troca';
}

export function buildDiaperObservationPreview(p: Record<string, string | number>): string | null {
  const details: string[] = [];
  const color = DIAPER_COLOR_LABEL[String(p.color ?? '')];
  const texture = DIAPER_TEXTURE_LABEL[String(p.texture ?? '')];
  if (color) details.push(color);
  if (texture) details.push(texture);
  return details.length > 0 ? details.join(' · ') : null;
}

export { DIAPER_KIND_LABEL, DIAPER_QUANTITY_LABEL, DIAPER_COLOR_LABEL, DIAPER_TEXTURE_LABEL };

// ─── Feed helpers ──────────────────────────────────────────────────────────

function buildFeedSummary(p: Record<string, string | number>): string {
  if (p.session_type === 'breastfeed') {
    const l = Number(p.left_seconds ?? 0);
    const r = Number(p.right_seconds ?? 0);
    const sw = Number(p.switches ?? 0);
    const parts: string[] = [];
    if (l > 0) parts.push(`E: ${fmtDurationShort(l)}`);
    if (r > 0) parts.push(`D: ${fmtDurationShort(r)}`);
    if (sw > 0) parts.push(`${sw} troca${sw > 1 ? 's' : ''}`);
    return parts.join(' · ') || 'Amamentação';
  }
  const method = String(p.feeding_method ?? '');
  const methodMap: Record<string, string> = { breast: 'Seio', bottle: 'Mamadeira', formula: 'Fórmula' };
  const label = methodMap[method] ?? 'Mamada';
  const amount = p.amount_ml ? ` · ${p.amount_ml}ml` : '';
  return `${label}${amount}`;
}

// ─── Main presentation builder ─────────────────────────────────────────────

export function getEventPresentation(log: RoutineLog): EventPresentation {
  const p = parsePayload(log.notes);
  const userNotes = getUserNotes(log.notes);

  switch (log.type) {
    // ── FEED ──────────────────────────────────────────────────────────────
    case 'feed': {
      const isBreastfeed = p.session_type === 'breastfeed';
      const totalSec = Number(p.total_seconds ?? 0);
      const tags = String(p.tags ?? '');
      const hasObs = tags.length > 0 || !!userNotes;

      return {
        title: isBreastfeed ? 'Amamentação' : (String(p.feeding_method ?? '') === 'formula' ? 'Fórmula' : 'Mamadeira'),
        emoji: isBreastfeed ? '🤱' : '🍼',
        color: 'hsl(152,15%,55%)',
        bgColor: 'hsl(152,15%,55%,0.12)',
        summary: buildFeedSummary(p),
        badge: isBreastfeed && totalSec > 0 ? fmtDurationShort(totalSec) : null,
        observationPreview: hasObs && userNotes ? `💬 ${userNotes.slice(0, 40)}` : null,
        detailKind: isBreastfeed ? 'breastfeed' : 'none',
        tappable: isBreastfeed,
      };
    }

    // ── SLEEP ─────────────────────────────────────────────────────────────
    case 'sleep': {
      const duration = log.end_time ? fmtRangeDuration(log.start_time, log.end_time) : null;
      const ongoing = !log.end_time;
      return {
        title: 'Sono',
        emoji: '😴',
        color: 'hsl(270,12%,52%)',
        bgColor: 'hsl(270,12%,52%,0.12)',
        summary: ongoing ? 'Em andamento' : (duration ? `Duração: ${duration}` : 'Sono'),
        badge: duration,
        observationPreview: userNotes ? `💬 ${userNotes.slice(0, 40)}` : null,
        detailKind: 'sleep',
        tappable: false, // sleep detail coming in future flow
      };
    }

    // ── DIAPER ────────────────────────────────────────────────────────────
    case 'diaper': {
      const summary = buildDiaperSummary(p);
      const obsPreview = buildDiaperObservationPreview(p);
      return {
        title: 'Troca',
        emoji: '🧷',
        color: 'hsl(32,80%,57%)',
        bgColor: 'hsl(32,80%,57%,0.12)',
        summary,
        badge: null,
        observationPreview: obsPreview ?? (userNotes ? `💬 ${userNotes.slice(0, 40)}` : null),
        detailKind: 'diaper',
        tappable: true,
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
