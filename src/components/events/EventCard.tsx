/**
 * EventCard — The single reusable event card for Ninho timelines.
 *
 * Used identically in Home (today's timeline) and Rotina (daily timeline).
 * Structure:
 *   Row 1: icon · title · optional badge
 *   Row 2: human summary
 *   Row 3: observation preview (only if meaningful)
 *
 * Tapping opens the corresponding detail sheet (handled by parent via onTap).
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
    <div className="flex items-stretch gap-3">
      {/* Timeline spine */}
      <div className="flex flex-col items-center w-12 flex-shrink-0">
        <span
          className="text-[11px] font-semibold text-center leading-tight pt-2.5"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
        >
          {fmtTime(log.start_time)}
        </span>
        {!isLast && (
          <div className="w-px flex-1 mt-1" style={{ backgroundColor: 'hsl(var(--border))' }} />
        )}
      </div>

      {/* Card */}
      <button
        onClick={ev.tappable ? () => onTap(log) : undefined}
        className={[
          'flex-1 rounded-2xl px-3 py-3 mb-3 flex items-start gap-3 text-left w-full',
          ev.tappable ? 'active:scale-[0.98] transition-transform' : '',
        ].join(' ')}
        style={{
          backgroundColor: 'hsl(var(--card))',
          border: `1px solid ${ev.tappable ? `${ev.color.replace('hsl(', 'hsl(').replace(')', ' / 0.25)')}` : 'hsl(var(--border))'}`,
          cursor: ev.tappable ? 'pointer' : 'default',
        }}
      >
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: ev.bgColor }}
        >
          <span className="text-lg">{ev.emoji}</span>
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          {/* Row 1: title + badge */}
          <div className="flex items-center justify-between gap-2">
            <p
              className="text-sm font-bold leading-tight"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}
            >
              {ev.title}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {ev.badge && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: ev.bgColor, color: ev.color }}
                >
                  {ev.badge}
                </span>
              )}
              {ev.tappable && (
                <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  ›
                </span>
              )}
            </div>
          </div>

          {/* Row 2: summary */}
          {ev.summary && (
            <p
              className="text-xs mt-0.5"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
            >
              {ev.summary}
            </p>
          )}

          {/* Row 3: observation preview */}
          {ev.observationPreview && (
            <p
              className="text-xs mt-0.5 truncate"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif', opacity: 0.8 }}
            >
              {ev.observationPreview}
            </p>
          )}
        </div>
      </button>
    </div>
  );
}
