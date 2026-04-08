/**
 * NINHO — FeverLogCard
 * Regista temperatura corporal com severidade visual automática.
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card }         from '@/design-system/components/ui/Card';
import { Button }       from '@/design-system/components/ui/Button';
import { Text }         from '@/design-system/components/ui/Text';
import { Tag }          from '@/design-system/components/ui/Tag';
import { SpinnerRound } from '@/design-system/components/ui/Spinner';
import { useHealthLog } from '../hooks/useHealthLog';
import type { TagVariant } from '@/design-system/components/ui/Tag';
import { cn } from '@/design-system/lib/utils';

// ─── helpers ─────────────────────────────────────────────────────────────────

function tempSeverity(t: number): { label: string; variant: TagVariant } {
  if (t < 37.5) return { label: 'Normal',  variant: 'success' };
  if (t < 38.5) return { label: 'Febrícula', variant: 'warning' };
  if (t < 39.5) return { label: 'Febre',   variant: 'error' };
  return              { label: 'Febre Alta', variant: 'error' };
}

export interface FeverLogCardProps {
  childId:  string;
  onSaved?: () => void;
}

export function FeverLogCard({ childId, onSaved }: FeverLogCardProps) {
  const { addLog, loading } = useHealthLog();
  const [temp, setTemp]     = useState<string>('37.0');

  const numTemp  = parseFloat(temp) || 0;
  const severity = numTemp > 0 ? tempSeverity(numTemp) : null;
  const canSave  = numTemp >= 35 && numTemp <= 42;

  async function handleSave() {
    if (!canSave) return;
    try {
      await addLog({
        child_id:      childId,
        log_type:      'fever',
        value_numeric: numTemp,
        value_unit:    '°C',
      });
      toast.success('Temperatura registada!');
      setTemp('37.0');
      onSaved?.();
    } catch {
      toast.error('Erro ao registar temperatura.');
    }
  }

  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center justify-between mb-[var(--gap-md)]">
        <div className="flex items-center gap-[var(--gap-sm)]">
          <span className="text-xl" aria-hidden="true">🌡️</span>
          <Text variant="body-lg-semibold">Temperatura</Text>
        </div>
        {severity && <Tag label={severity.label} variant={severity.variant} />}
      </div>

      <div className="flex flex-col gap-[var(--gap-md)]">
        <div className="flex flex-col gap-[var(--gap-xxs)]">
          <Text variant="caption-medium" color="secondary" as="label">
            Temperatura (°C)
          </Text>
          <div className="flex items-center gap-[var(--gap-sm)]">
            <input
              type="number"
              min={35}
              max={42}
              step={0.1}
              value={temp}
              onChange={e => setTemp(e.target.value)}
              className={cn(
                'w-28 rounded-[var(--radius-sm)] border border-ds-neutral-border',
                'bg-ds-pure-white text-ds-neutral-fg-strong',
                'px-[var(--padding-sm)] py-[var(--padding-xs)]',
                'font-body text-text-lg font-semibold text-center',
                'focus:outline-none focus:ring-2 focus:ring-ds-accent-tint',
              )}
            />
            <Text variant="body-lg-semibold" color="secondary" as="span">°C</Text>
          </div>
        </div>

        <Button
          label={loading ? '' : 'Registar temperatura'}
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
