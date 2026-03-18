/**
 * EventCard — Ninho DS v2 unified timeline card.
 *
 * SINGLE SOURCE OF TRUTH for event presentation across:
 *   - Home "Hoje" preview
 *   - Rotina full timeline
 *   - Família recent activity
 *
 * Rules:
 *  - Same anatomy in every context (only contextual reductions allowed)
 *  - Insight hints (InlineStatusPill) only show when genuinely relevant
 *  - Observation preview and author label are optional context
 *  - Ongoing sleep pulses the spine dot
 *  - Tappable events show chevron + subtle accent border
 *
 * IDENTICAL in Home and Rotina — do NOT fork.
 * Uses semantic tokens only.
 */

import type { RoutineLog } from '@/lib/eventSystem';
import { getEventPresentation } from '@/lib/eventSystem';
import { fmtTime } from '@/lib/routineUtils';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { InlineStatusPill } from '@/components/ds/InlineStatusPill';

interface EventCardProps {
  log: RoutineLog;
  isLast?: boolean;
  onTap: (log: RoutineLog) => void;
  /** Optional: show who registered this event (Família context) */
  authorLabel?: string;
}

export function EventCard({ log, isLast, onTap, authorLabel }: EventCardProps) {
  const ev = getEventPresentation(log);
  const isOngoing = log.type === 'sleep' && !log.end_time;

  return (
    <div className="flex items-stretch gap-3 mb-2.5">
      {/* Timeline spine */}
      <div className="flex flex-col items-center w-5 flex-shrink-0 pt-4">
        <div
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOngoing ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: ev.color }}
        />
        {!isLast && (
          <div
            className="w-px flex-1 mt-1.5"
            style={{ backgroundColor: 'hsl(var(--border))' }}
          />
        )}
      </div>

      {/* Card */}
      <button
        onClick={ev.tappable ? () => onTap(log) : undefined}
        className={[
          'flex-1 rounded-2xl px-4 py-3.5 flex items-start gap-3 text-left w-full bg-card border border-border',
          ev.tappable ? 'active:scale-[0.985] transition-transform' : '',
        ].join(' ')}
        style={{
          borderColor: ev.tappable
            ? `color-mix(in srgb, ${ev.color} 25%, hsl(var(--border)))`
            : 'hsl(var(--border))',
          cursor: ev.tappable ? 'pointer' : 'default',
        }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-[18px]"
          style={{ backgroundColor: ev.bgColor }}
        >
          {ev.emoji}
        </div>

        {/* Text block */}
        <div className="min-w-0 flex-1">

          {/* Row 1: title + time + chevron */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[14px] font-bold leading-tight text-foreground font-quicksand truncate">
              {ev.title}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Duration badge — e.g. "18min" for breastfeed */}
              {ev.badge && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full font-nunito"
                  style={{ backgroundColor: ev.bgColor, color: ev.color }}
                >
                  {ev.badge}
                </span>
              )}
              {/* Report indicator */}
              {ev.includeInReport && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full font-nunito"
                  style={{
                    backgroundColor: 'color-mix(in srgb, hsl(var(--primary)) 10%, transparent)',
                    color: 'hsl(var(--primary))',
                  }}
                >
                  📋
                </span>
              )}
              <span className="text-[11px] font-semibold tabular-nums text-muted-foreground font-nunito">
                {fmtTime(log.start_time)}
              </span>
              {ev.tappable && (
                <ChevronRightIcon
                  className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0"
                  strokeWidth={2.5}
                />
              )}
            </div>
          </div>

          {/* Row 2: summary */}
          {ev.summary && (
            <p
              className="text-[12px] mt-1 font-medium leading-snug font-nunito"
              style={{ color: 'hsl(var(--foreground) / 0.6)' }}
            >
              {ev.summary}
            </p>
          )}

          {/* Row 3: intelligence hint — only when genuinely relevant (set in eventSystem) */}
          {ev.hint && (
            <div className="mt-1.5">
              <InlineStatusPill
                label={ev.hint.label}
                variant={ev.hint.variant}
                color={ev.color}
              />
            </div>
          )}

          {/* Row 4: observation preview — only when no hint */}
          {ev.observationPreview && !ev.hint && (
            <p
              className="text-[11px] mt-1 truncate italic font-nunito"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              "{ev.observationPreview}"
            </p>
          )}

          {/* Row 5: author label (Família context) */}
          {authorLabel && (
            <p
              className="text-[10px] mt-1 font-nunito"
              style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}
            >
              por {authorLabel}
            </p>
          )}
        </div>
      </button>
    </div>
  );
}
