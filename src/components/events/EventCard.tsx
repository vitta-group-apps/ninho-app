 /**
 * EventCard — Ninho DS v4 unified timeline card.
 *
 * Contrato novo:
 *  - RoutineLog = RoutineRecord
 *  - payload estruturado
 *  - notes humano
 *  - startTime / endTime
 */

import { useNavigate } from 'react-router-dom';
import type { RoutineLog } from '../../lib/eventSystem';
import { getEventPresentation } from '../../lib/eventSystem';
import { fmtTime } from '../../lib/routineUtils';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { InlineStatusPill } from '../components/ds/InlineStatusPill';

interface EventCardProps {
  log: RoutineLog;
  isLast?: boolean;
  onTap?: (log: RoutineLog) => void;
  authorLabel?: string;
}

export function EventCard({
  log,
  isLast,
  onTap,
  authorLabel,
}: EventCardProps) {
  const navigate = useNavigate();
  const ev = getEventPresentation(log);
  const isOngoing = log.type === 'sleep' && !log.end_time;

  function handleClick() {
    if (!ev.tappable) return;

    if (ev.editPath) {
      navigate(ev.editPath);
    } else if (onTap) {
      onTap(log);
    }
  }

  return (
    <div className="flex items-stretch gap-3 mb-2.5">
      <div className="flex flex-col items-center w-5 flex-shrink-0 pt-4">
        <div
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            isOngoing ? 'animate-pulse' : ''
          }`}
          style={{ backgroundColor: ev.color }}
        />
        {!isLast && (
          <div
            className="w-px flex-1 mt-1.5"
            style={{ backgroundColor: 'hsl(var(--border))' }}
          />
        )}
      </div>

      <button
        onClick={ev.tappable ? handleClick : undefined}
        className={[
          'flex-1 rounded-2xl px-4 py-3.5 flex items-start gap-3 text-left w-full bg-card border border-border',
          'min-h-[72px]',
          ev.tappable
            ? 'active:scale-[0.985] transition-transform cursor-pointer'
            : 'cursor-default',
        ].join(' ')}
        style={{
          borderColor: ev.tappable
            ? `color-mix(in srgb, ${ev.color} 25%, hsl(var(--border)))`
            : 'hsl(var(--border))',
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-[18px]"
          style={{ backgroundColor: ev.bgColor }}
        >
          {ev.emoji}
        </div>

        <div className="min-w-0 flex-1">
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

              {ev.includeInReport && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full font-nunito"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, hsl(var(--primary)) 10%, transparent)',
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

          {ev.summary && (
            <p
              className="text-[12px] mt-1 font-medium leading-snug font-nunito"
              style={{ color: 'hsl(var(--foreground) / 0.6)' }}
            >
              {ev.summary}
            </p>
          )}

          {ev.hint && (
            <div className="mt-1.5">
              <InlineStatusPill
                label={ev.hint.label}
                variant={ev.hint.variant}
                color={ev.color}
              />
            </div>
          )}

          {ev.observationPreview && !ev.hint && (
            <p
              className="text-[11px] mt-1 truncate italic font-nunito"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              "{ev.observationPreview}"
            </p>
          )}

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