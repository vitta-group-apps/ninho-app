/**
 * NINHO — SleepLogCard
 * Registra início e fim do sono, local e qualidade.
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card }        from '@/design-system/components/ui/Card';
import { Button }      from '@/design-system/components/ui/Button';
import { Text }        from '@/design-system/components/ui/Text';
import { Tag }         from '@/design-system/components/ui/Tag';
import { SpinnerRound } from '@/design-system/components/ui/Spinner';
import { useRoutineLog } from '../hooks/useRoutineLog';
import type { SleepPayload } from '@/types/database.types';
import { cn } from '@/design-system/lib/utils';

// ─── helpers ──────────────────────────────────────────────────────────────────

function nowLocalISO() {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

function localToISO(local: string) {
  return local ? new Date(local).toISOString() : undefined;
}

// ─── sub-components ───────────────────────────────────────────────────────────

type PillOption<T extends string> = {
  value: T;
  label: string;
};

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: PillOption<T>[];
  value:   T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-[var(--gap-xs)]">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'px-[var(--padding-md)] py-[var(--padding-xs)]',
            'rounded-ds-pill border font-body text-text-sm font-medium',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent-tint focus-visible:ring-offset-1',
            value === o.value
              ? 'bg-ds-accent-subtle-2 border-ds-accent-tint text-ds-accent-fg'
              : 'bg-ds-neutral-subtle border-ds-neutral-border text-ds-neutral-fg-strong hover:bg-ds-neutral-bg-hover',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── props ────────────────────────────────────────────────────────────────────

export interface SleepLogCardProps {
  childId:   string;
  onSaved?:  () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

const LOCATION_OPTIONS: PillOption<NonNullable<SleepPayload['location']>>[] = [
  { value: 'crib',     label: 'Berço'     },
  { value: 'bed',      label: 'Cama'      },
  { value: 'stroller', label: 'Carrinho'  },
  { value: 'carrier',  label: 'Canguru'   },
  { value: 'arms',     label: 'No colo'   },
];

const QUALITY_OPTIONS: PillOption<NonNullable<SleepPayload['quality']>>[] = [
  { value: 'deep',     label: 'Profundo'  },
  { value: 'light',    label: 'Leve'      },
  { value: 'restless', label: 'Agitado'   },
];

export function SleepLogCard({ childId, onSaved }: SleepLogCardProps) {
  const { addLog, loading } = useRoutineLog<'sleep'>();

  const [startedAt, setStartedAt] = useState(nowLocalISO());
  const [endedAt,   setEndedAt]   = useState('');
  const [location,  setLocation]  = useState<SleepPayload['location']>();
  const [quality,   setQuality]   = useState<SleepPayload['quality']>();

  async function handleSave() {
    try {
      await addLog({
        child_id:     childId,
        routine_type: 'sleep',
        payload:      { location, quality },
        started_at:   localToISO(startedAt),
        ended_at:     localToISO(endedAt),
      });
      toast.success('Sono registrado!');
      setEndedAt('');
      setLocation(undefined);
      setQuality(undefined);
      setStartedAt(nowLocalISO());
      onSaved?.();
    } catch {
      toast.error('Erro ao salvar sono.');
    }
  }

  return (
    <Card variant="elevated" padding="md">
      {/* header */}
      <div className="flex items-center justify-between mb-[var(--gap-md)]">
        <div className="flex items-center gap-[var(--gap-sm)]">
          <span className="text-xl" aria-hidden="true">🌙</span>
          <Text variant="body-lg-semibold">Sono</Text>
        </div>
        <Tag label="Fase 1" variant="accent" />
      </div>

      <div className="flex flex-col gap-[var(--gap-md)]">
        {/* times */}
        <div className="grid grid-cols-2 gap-[var(--gap-sm)]">
          <label className="flex flex-col gap-[var(--gap-xxs)]">
            <Text variant="caption-medium" color="secondary" as="span">Início</Text>
            <input
              type="datetime-local"
              value={startedAt}
              onChange={e => setStartedAt(e.target.value)}
              className={cn(
                'rounded-[var(--radius-sm)] border border-ds-neutral-border',
                'bg-ds-pure-white text-ds-neutral-fg-strong',
                'px-[var(--padding-sm)] py-[var(--padding-xs)]',
                'font-body text-text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ds-accent-tint',
              )}
            />
          </label>
          <label className="flex flex-col gap-[var(--gap-xxs)]">
            <Text variant="caption-medium" color="secondary" as="span">Fim (opcional)</Text>
            <input
              type="datetime-local"
              value={endedAt}
              onChange={e => setEndedAt(e.target.value)}
              className={cn(
                'rounded-[var(--radius-sm)] border border-ds-neutral-border',
                'bg-ds-pure-white text-ds-neutral-fg-strong',
                'px-[var(--padding-sm)] py-[var(--padding-xs)]',
                'font-body text-text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ds-accent-tint',
              )}
            />
          </label>
        </div>

        {/* location */}
        <div className="flex flex-col gap-[var(--gap-xs)]">
          <Text variant="caption-medium" color="secondary" as="span">Local</Text>
          <PillGroup options={LOCATION_OPTIONS} value={location} onChange={setLocation} />
        </div>

        {/* quality */}
        <div className="flex flex-col gap-[var(--gap-xs)]">
          <Text variant="caption-medium" color="secondary" as="span">Qualidade</Text>
          <PillGroup options={QUALITY_OPTIONS} value={quality} onChange={setQuality} />
        </div>

        {/* action */}
        <Button
          label={loading ? '' : 'Registrar sono'}
          variant="primary"
          size="md"
          fullWidth
          disabled={loading}
          iconLeft={loading ? <SpinnerRound size="sm" /> : undefined}
          onClick={handleSave}
        />
      </div>
    </Card>
  );
}
