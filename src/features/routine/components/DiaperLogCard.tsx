/**
 * NINHO — DiaperLogCard
 * Registra troca de fralda: tipo, consistência e cor.
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card }         from '@/design-system/components/ui/Card';
import { Button }       from '@/design-system/components/ui/Button';
import { Text }         from '@/design-system/components/ui/Text';
import { Tag }          from '@/design-system/components/ui/Tag';
import { SpinnerRound } from '@/design-system/components/ui/Spinner';
import { useRoutineLog } from '../hooks/useRoutineLog';
import type { DiaperPayload } from '@/types/database.types';
import { cn } from '@/design-system/lib/utils';

// ─── pill group (inline — não extrair; componente de layout interno) ──────────

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

// ─── options ─────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: PillOption<NonNullable<DiaperPayload['type']>>[] = [
  { value: 'wet',   label: '💧 Xixi'       },
  { value: 'dirty', label: '💩 Cocô'       },
  { value: 'both',  label: '💧💩 Ambos'   },
];

const CONSISTENCY_OPTIONS: PillOption<NonNullable<DiaperPayload['consistency']>>[] = [
  { value: 'normal', label: 'Normal'   },
  { value: 'soft',   label: 'Mole'     },
  { value: 'liquid', label: 'Líquida'  },
  { value: 'hard',   label: 'Dura'     },
];

// ─── props ────────────────────────────────────────────────────────────────────

export interface DiaperLogCardProps {
  childId:  string;
  onSaved?: () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export function DiaperLogCard({ childId, onSaved }: DiaperLogCardProps) {
  const { addLog, loading } = useRoutineLog<'diaper'>();

  const [type,        setType]        = useState<DiaperPayload['type']>();
  const [consistency, setConsistency] = useState<DiaperPayload['consistency']>();

  const canSave = !!type;

  async function handleSave() {
    if (!canSave) return;

    try {
      await addLog({
        child_id:     childId,
        routine_type: 'diaper',
        payload:      { type, consistency },
        started_at:   new Date().toISOString(),
      });
      toast.success('Fralda registrada!');
      setType(undefined);
      setConsistency(undefined);
      onSaved?.();
    } catch {
      toast.error('Erro ao salvar fralda.');
    }
  }

  return (
    <Card variant="elevated" padding="md">
      {/* header */}
      <div className="flex items-center justify-between mb-[var(--gap-md)]">
        <div className="flex items-center gap-[var(--gap-sm)]">
          <span className="text-xl" aria-hidden="true">🧷</span>
          <Text variant="body-lg-semibold">Fralda</Text>
        </div>
        <Tag label="Fase 1" variant="secondary" />
      </div>

      <div className="flex flex-col gap-[var(--gap-md)]">
        {/* type — required */}
        <div className="flex flex-col gap-[var(--gap-xs)]">
          <Text variant="caption-medium" color="secondary" as="span">
            Tipo <span className="text-ds-error-fg">*</span>
          </Text>
          <PillGroup options={TYPE_OPTIONS} value={type} onChange={setType} />
        </div>

        {/* consistency — only when dirty or both */}
        {(type === 'dirty' || type === 'both') && (
          <div className="flex flex-col gap-[var(--gap-xs)]">
            <Text variant="caption-medium" color="secondary" as="span">Consistência</Text>
            <PillGroup
              options={CONSISTENCY_OPTIONS}
              value={consistency}
              onChange={setConsistency}
            />
          </div>
        )}

        {/* action */}
        <Button
          label={loading ? '' : 'Registrar fralda'}
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
