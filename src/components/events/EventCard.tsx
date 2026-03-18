/**
 * EventCard — Ninho DS v2 unified timeline card.
 *
 * IDENTICAL in Home and Rotina — do not fork.
 *
 * Row 1: icon · title · time · optional badge
 * Row 2: human summary
 * Row 3: observation preview (only if meaningful)
 *
 * Uses semantic tokens only — no hardcoded colors in JSX.
 */

import type { RoutineLog } from '@/lib/eventSystem';
import { getEventPresentation } from '@/lib/eventSystem';
import { fmtTime } from '@/lib/routineUtils';

interface EventCardProps {
  log: RoutineLog;
  isLast?: boolean;
  onTap: (log: RoutineLog) => void;
}

export function EventCard({ log, isLast, onTap }: EventCardProps) {
  const ev = getEventPresentation(log);

  return (
    <div className="flex items-stretch gap-3 mb-3">
      {/* Timeline spine */}
      <div className="flex flex-col items-center w-5 flex-shrink-0 pt-3">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: ev.color }}
        />
        {!isLast && (
          <div className="w-px flex-1 mt-1 bg-border" />
        )}
      </div>

      {/* Card */}
      <button
        onClick={ev.tappable ? () => onTap(log) : undefined}
        className={[
          'flex-1 rounded-2xl px-4 py-3 flex items-start gap-3 text-left w-full bg-card border border-border',
          ev.tappable ? 'active:scale-[0.98] transition-transform' : '',
        ].join(' ')}
        style={{
          borderColor: ev.tappable
            ? `color-mix(in srgb, ${ev.color} 28%, transparent)`
            : 'hsl(var(--border))',
          cursor: ev.tappable ? 'pointer' : 'default',
        }}
      >
        {/* Icon container */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-lg"
          style={{ backgroundColor: ev.bgColor }}
        >
          {ev.emoji}
        </div>

        {/* Text block */}
        <div className="min-w-0 flex-1">
          {/* Row 1: title + time + chevron */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold leading-tight text-foreground font-quicksand truncate">
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
                <span className="text-xs text-muted-foreground">›</span>
              )}
            </div>
          </div>

          {/* Row 2: summary */}
          {ev.summary && (
            <p className="text-xs mt-0.5 font-medium text-muted-foreground font-nunito">
              {ev.summary}
            </p>
          )}

          {/* Row 3: observation preview */}
          {ev.observationPreview && (
            <p
              className="text-xs mt-0.5 truncate font-nunito"
              style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.75 }}
            >
              {ev.observationPreview}
            </p>
          )}
        </div>
      </button>
    </div>
  );
}
