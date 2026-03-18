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
 * Adding a new event type? Add one entry here.
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

/** Pee color — mild palette, no alarming labels */
export const DIAPER_PEE_COLOR_LABEL: Record<string, string> = {
  clear:       'transparente',
  pale_yellow: 'amarelo claro',
  dark_yellow: 'amarelo escuro',
  other:       'outra cor',
};

/** Poop color — full palette including medically notable ones */
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

// ─── Significance classification (no UI — for future insight engine) ───────

/** Returns true when the payload contains a medically notable signal. */
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

// ─── Diaper summary builders ───────────────────────────────────────────────

export function buildDiaperSummary(p: Record<string, string | number>): string {
  const kind = String(p.kind ?? p.diaper_type ?? '');
  const base = DIAPER_KIND_LABEL[kind] ?? 'Fralda';

  const parts: string[] = [base];

  // Add most meaningful detail — prioritise texture for poop, then color, then quantity
  const texture   = DIAPER_TEXTURE_LABEL[String(p.poop_texture ?? '')];
  const poopColor = DIAPER_POOP_COLOR_LABEL[String(p.poop_color ?? '')];
  const peeColor  = DIAPER_PEE_COLOR_LABEL[String(p.pee_color ?? '')];
  const qty       = DIAPER_QUANTITY_LABEL[String(p.quantity ?? '')];

  if (texture)   parts.push(texture);
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
        tappable: false,
      };
    }

    // ── DIAPER ────────────────────────────────────────────────────────────
    case 'diaper': {
      // Support both new `kind` and legacy `diaper_type` field names
      const kind = String(p.kind ?? p.diaper_type ?? '');
      const summary = buildDiaperSummary({ ...p, kind });
      const obsPreview = userNotes ? `💬 ${userNotes.slice(0, 40)}` : null;
      return {
        title: 'Fralda',
        emoji: '🧷',
        color: 'hsl(32,80%,57%)',
        bgColor: 'hsl(32,80%,57%,0.12)',
        summary,
        badge: null,
        observationPreview: obsPreview,
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
