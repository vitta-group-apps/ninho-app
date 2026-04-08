/**
 * NINHO — DaySelector
 * Strip horizontal de 14 dias (hoje + 13 anteriores).
 * Hoje aparece à direita; scroll automático para o fim ao montar.
 */

import React, { useRef, useEffect } from 'react';
import { cn } from '@/design-system/lib/utils';
import { Text } from '@/design-system/components/ui/Text';

const DAYS = 14;

const WEEKDAY_SHORT: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb',
};

function toISO(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function buildDays(): { iso: string; day: number; weekday: string; isToday: boolean }[] {
  const result = [];
  const today  = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push({
      iso:      toISO(d),
      day:      d.getDate(),
      weekday:  WEEKDAY_SHORT[d.getDay()],
      isToday:  i === 0,
    });
  }
  return result;
}

export interface DaySelectorProps {
  value:    string;           // YYYY-MM-DD
  onChange: (date: string) => void;
}

export function DaySelector({ value, onChange }: DaySelectorProps) {
  const days      = buildDays();
  const scrollRef = useRef<HTMLDivElement>(null);

  // scroll to end (today) on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  return (
    <div
      ref={scrollRef}
      className="flex gap-[var(--gap-xs)] overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none"
      role="group"
      aria-label="Selecionar dia"
    >
      {days.map(d => {
        const selected = d.iso === value;
        return (
          <button
            key={d.iso}
            type="button"
            onClick={() => onChange(d.iso)}
            aria-pressed={selected}
            aria-label={d.isToday ? `Hoje, ${d.day}` : `${d.weekday} ${d.day}`}
            className={cn(
              'flex flex-col items-center justify-center shrink-0',
              'w-11 py-[var(--padding-sm)] rounded-[var(--radius-sm)]',
              'border transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent-tint focus-visible:ring-offset-1',
              selected
                ? 'bg-ds-accent-tint border-ds-accent-tint'
                : 'bg-ds-pure-white border-ds-neutral-border hover:bg-ds-neutral-subtle',
            )}
          >
            <Text
              variant="caption-medium"
              as="span"
              className={selected ? 'text-ds-on-tint-white' : undefined}
              color={selected ? undefined : 'secondary'}
            >
              {d.weekday}
            </Text>
            <Text
              variant="body-md-semibold"
              as="span"
              className={cn(
                selected ? 'text-ds-on-tint-white' : 'text-ds-neutral-fg-strong',
                d.isToday && !selected && 'text-ds-accent-fg',
              )}
            >
              {d.day}
            </Text>
            {d.isToday && (
              <span className={cn(
                'mt-0.5 w-1 h-1 rounded-full',
                selected ? 'bg-ds-on-tint-white' : 'bg-ds-accent-tint',
              )} />
            )}
          </button>
        );
      })}
    </div>
  );
}
