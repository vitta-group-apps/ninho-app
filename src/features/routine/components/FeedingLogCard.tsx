/**
 * NINHO — FeedingLogCard
 * Registra alimentação: leite materno, fórmula ou sólidos.
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card }         from '@/design-system/components/ui/Card';
import { Button }       from '@/design-system/components/ui/Button';
import { Text }         from '@/design-system/components/ui/Text';
import { Tag }          from '@/design-system/components/ui/Tag';
import { SpinnerRound } from '@/design-system/components/ui/Spinner';
import { useRoutineLog }   from '../hooks/useRoutineLog';
import { SuccessCheckmark } from '@/design-system/components/ui/SuccessCheckmark';
import type { FeedingPayload } from '@/types/database.types';
import { cn } from '@/design-system/lib/utils';

// ─── pill group ───────────────────────────────────────────────────────────────

type PillOption<T extends string> = { value: T; label: string };

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options:  PillOption<T>[];
  value:    T | undefined;
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

// ─── number stepper ───────────────────────────────────────────────────────────

function Stepper({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  unit,
}: {
  label:    string;
  value:    number;
  onChange: (v: number) => void;
  min?:     number;
  step?:    number;
  unit?:    string;
}) {
  return (
    <div className="flex flex-col gap-[var(--gap-xxs)]">
      <Text variant="caption-medium" color="secondary" as="span">{label}</Text>
      <div className="flex items-center gap-[var(--gap-sm)]">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className={cn(
            'w-8 h-8 rounded-ds-sm border border-ds-neutral-border',
            'bg-ds-neutral-subtle text-ds-neutral-fg-strong font-bold text-text-lg',
            'flex items-center justify-center',
            'hover:bg-ds-neutral-bg-hover transition-colors',
          )}
          aria-label={`Diminuir ${label}`}
        >−</button>
        <span className="min-w-[3rem] text-center font-body text-text-md font-semibold text-ds-neutral-fg-strong">
          {value}{unit ? <span className="text-ds-neutral-fg font-regular ml-0.5">{unit}</span> : null}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + step)}
          className={cn(
            'w-8 h-8 rounded-ds-sm border border-ds-neutral-border',
            'bg-ds-neutral-subtle text-ds-neutral-fg-strong font-bold text-text-lg',
            'flex items-center justify-center',
            'hover:bg-ds-neutral-bg-hover transition-colors',
          )}
          aria-label={`Aumentar ${label}`}
        >+</button>
      </div>
    </div>
  );
}

// ─── options ─────────────────────────────────────────────────────────────────

const METHOD_OPTIONS: PillOption<NonNullable<FeedingPayload['method']>>[] = [
  { value: 'breast', label: '🤱 Seio'    },
  { value: 'bottle', label: '🍼 Mamadeira' },
];

const SIDE_OPTIONS: PillOption<NonNullable<FeedingPayload['side']>>[] = [
  { value: 'left',  label: 'Esquerdo' },
  { value: 'right', label: 'Direito'  },
  { value: 'both',  label: 'Ambos'    },
];

// ─── props ────────────────────────────────────────────────────────────────────

export interface FeedingLogCardProps {
  childId:  string;
  onSaved?: () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export function FeedingLogCard({ childId, onSaved }: FeedingLogCardProps) {
  const { addLog, loading } = useRoutineLog<'feeding'>();

  const [method,      setMethod]      = useState<FeedingPayload['method']>();
  const [side,        setSide]        = useState<FeedingPayload['side']>();
  const [durationMin, setDurationMin] = useState(0);
  const [volumeMl,    setVolumeMl]    = useState(0);
  const [saved,       setSaved]       = useState(false);

  const canSave = !!method;

  async function handleSave() {
    if (!canSave) return;

    const payload: FeedingPayload = { method };
    if (method === 'breast') {
      if (side)            payload.side         = side;
      if (durationMin > 0) payload.duration_min = durationMin;
    } else {
      if (volumeMl > 0)    payload.volume_ml    = volumeMl;
    }

    try {
      await addLog({
        child_id:     childId,
        routine_type: 'feeding',
        payload,
        started_at:   new Date().toISOString(),
      });
      toast.success('Alimentação registrada!');
      setMethod(undefined);
      setSide(undefined);
      setDurationMin(0);
      setVolumeMl(0);
      setSaved(true);
      setTimeout(() => setSaved(false), 1400);
      onSaved?.();
    } catch {
      toast.error('Erro ao salvar alimentação.');
    }
  }

  return (
    <Card variant="elevated" padding="md">
      {/* header */}
      <div className="flex items-center justify-between mb-[var(--gap-md)]">
        <div className="flex items-center gap-[var(--gap-sm)]">
          <span className="text-xl" aria-hidden="true">🍼</span>
          <Text variant="body-lg-semibold">Alimentação</Text>
        </div>
        <div className="flex items-center gap-[var(--gap-sm)]">
          <SuccessCheckmark visible={saved} size={28} />
          <Tag label="Fase 1" variant="success" />
        </div>
      </div>

      <div className="flex flex-col gap-[var(--gap-md)]">
        {/* method — required */}
        <div className="flex flex-col gap-[var(--gap-xs)]">
          <Text variant="caption-medium" color="secondary" as="span">
            Método <span className="text-ds-error-fg">*</span>
          </Text>
          <PillGroup options={METHOD_OPTIONS} value={method} onChange={v => {
            setMethod(v);
            setSide(undefined);
            setDurationMin(0);
            setVolumeMl(0);
          }} />
        </div>

        {/* breast fields */}
        {method === 'breast' && (
          <>
            <div className="flex flex-col gap-[var(--gap-xs)]">
              <Text variant="caption-medium" color="secondary" as="span">Lado</Text>
              <PillGroup options={SIDE_OPTIONS} value={side} onChange={setSide} />
            </div>
            <Stepper
              label="Duração"
              value={durationMin}
              onChange={setDurationMin}
              step={5}
              unit="min"
            />
          </>
        )}

        {/* bottle fields */}
        {method === 'bottle' && (
          <Stepper
            label="Volume"
            value={volumeMl}
            onChange={setVolumeMl}
            step={10}
            unit="ml"
          />
        )}

        {/* action */}
        <Button
          label={loading ? '' : 'Registrar alimentação'}
          variant="primary"
          size="md"
          fullWidth
          disabled={loading || !canSave}
          iconLeft={loading ? <SpinnerRound size="sm" /> : undefined}
          onClick={handleSave}
        />
      </div>
    </Card>
  );
}
