/**
 * EventCard — Ninho DS v2 unified timeline card.
 *
 * IDENTICAL in Home and Rotina — do not fork.
 *
 * Polish v2.1:
 * - Card has more vertical padding (py-3.5)
 * - Icon is 40×40 (slightly larger, better proportion)
 * - Title is slightly larger (14px) and bolder
 * - Summary has better contrast (not just muted)
 * - Time and badge are better aligned
 * - Chevron is bolder and more visible
 * - Timeline spine dot is larger (3×3)
 *
 * Uses semantic tokens only — no hardcoded colors in JSX.
 */

import type { RoutineLog } from '@/lib/eventSystem';
import { getEventPresentation } from '@/lib/eventSystem';
import { fmtTime } from '@/lib/routineUtils';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface EventCardProps {
  log: RoutineLog;
  isLast?: boolean;
  onTap: (log: RoutineLog) => void;
}

export function EventCard({ log, isLast, onTap }: EventCardProps) {
  const ev = getEventPresentation(log);

  return (
    <div className="flex items-stretch gap-3 mb-2.5">
      {/* Timeline spine */}
      <div className="flex flex-col items-center w-5 flex-shrink-0 pt-4">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: ev.color }}
        />
        {!isLast && (
          <div className="w-px flex-1 mt-1.5" style={{ backgroundColor: 'hsl(var(--border))' }} />
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
        {/* Icon container */}
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
              {ev.badge && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full font-nunito"
                  style={{ backgroundColor: ev.bgColor, color: ev.color }}
                >
                  {ev.badge}
                </span>
              )}
              <span className="text-[11px] font-semibold tabular-nums text-muted-foreground font-nunito">
                {fmtTime(log.start_time)}
              </span>
              {ev.tappable && (
                <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={2.5} />
              )}
            </div>
          </div>

          {/* Row 2: summary */}
          {ev.summary && (
            <p className="text-[12px] mt-1 font-medium leading-snug font-nunito"
               style={{ color: 'hsl(var(--foreground) / 0.6)' }}>
              {ev.summary}
            </p>
          )}

          {/* Row 3: observation preview */}
          {ev.observationPreview && (
            <p
              className="text-[11px] mt-0.5 truncate italic font-nunito"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              "{ev.observationPreview}"
            </p>
          )}
        </div>
      </button>
    </div>
  );
}
