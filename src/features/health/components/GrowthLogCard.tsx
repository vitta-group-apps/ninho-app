/**
 * NINHO — GrowthLogCard
 * Regista peso, comprimento e perímetro cefálico.
 * Exibe o último registo para contexto.
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card }         from '@/design-system/components/ui/Card';
import { Button }       from '@/design-system/components/ui/Button';
import { Text }         from '@/design-system/components/ui/Text';
import { Tag }          from '@/design-system/components/ui/Tag';
import { Divider }      from '@/design-system/components/ui/Divider';
import { SpinnerRound } from '@/design-system/components/ui/Spinner';
import { useGrowthLog } from '../hooks/useGrowthLog';
import { cn } from '@/design-system/lib/utils';

// ─── stepper ─────────────────────────────────────────────────────────────────

function Stepper({
  label, value, onChange, step, unit, min = 0,
}: {
  label: string; value: number; onChange: (v: number) => void;
  step: number; unit: string; min?: number;
}) {
  return (
    <div className="flex flex-col gap-[var(--gap-xxs)]">
      <Text variant="caption-medium" color="secondary" as="span">{label}</Text>
      <div className="flex items-center gap-[var(--gap-sm)]">
        <button type="button"
          onClick={() => onChange(Math.max(min, parseFloat((value - step).toFixed(1))))}
          className={cn(
            'w-8 h-8 rounded-ds-sm border border-ds-neutral-border',
            'bg-ds-neutral-subtle text-ds-neutral-fg-strong font-bold',
            'flex items-center justify-center hover:bg-ds-neutral-bg-hover transition-colors',
          )}
          aria-label={`Diminuir ${label}`}
        >−</button>
        <span className="min-w-[4.5rem] text-center font-body text-text-md font-semibold text-ds-neutral-fg-strong">
          {value > 0 ? `${value} ${unit}` : <span className="text-ds-neutral-fg font-regular">—</span>}
        </span>
        <button type="button"
          onClick={() => onChange(parseFloat((value + step).toFixed(1)))}
          className={cn(
            'w-8 h-8 rounded-ds-sm border border-ds-neutral-border',
            'bg-ds-neutral-subtle text-ds-neutral-fg-strong font-bold',
            'flex items-center justify-center hover:bg-ds-neutral-bg-hover transition-colors',
          )}
          aria-label={`Aumentar ${label}`}
        >+</button>
      </div>
    </div>
  );
}

export interface GrowthLogCardProps {
  childId: string;
}

export function GrowthLogCard({ childId }: GrowthLogCardProps) {
  const { measurements, loading, addMeasurement } = useGrowthLog(childId);

  const [weightG,  setWeightG]  = useState(0);
  const [lengthCm, setLengthCm] = useState(0);
  const [headCm,   setHeadCm]   = useState(0);

  const canSave = weightG > 0 || lengthCm > 0 || headCm > 0;
  const last    = measurements[0];

  async function handleSave() {
    if (!canSave) return;
    try {
      await addMeasurement({
        child_id:               childId,
        weight_grams:           weightG  > 0 ? weightG  : null,
        length_cm:              lengthCm > 0 ? lengthCm : null,
        head_circumference_cm:  headCm   > 0 ? headCm   : null,
      });
      toast.success('Medição registada!');
      setWeightG(0);
      setLengthCm(0);
      setHeadCm(0);
    } catch {
      toast.error('Erro ao registar medição.');
    }
  }

  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center justify-between mb-[var(--gap-md)]">
        <div className="flex items-center gap-[var(--gap-sm)]">
          <span className="text-xl" aria-hidden="true">📏</span>
          <Text variant="body-lg-semibold">Crescimento</Text>
        </div>
        <Tag label="Medição" variant="info" />
      </div>

      {/* último registo */}
      {last && (
        <>
          <div className="flex gap-[var(--gap-md)] mb-[var(--gap-md)]">
            {last.weight_grams && (
              <div className="flex flex-col">
                <Text variant="caption-regular" color="secondary" as="span">Peso</Text>
                <Text variant="body-md-semibold" as="span">
                  {(last.weight_grams / 1000).toFixed(2)} kg
                </Text>
              </div>
            )}
            {last.length_cm && (
              <div className="flex flex-col">
                <Text variant="caption-regular" color="secondary" as="span">Comprimento</Text>
                <Text variant="body-md-semibold" as="span">{last.length_cm} cm</Text>
              </div>
            )}
            {last.head_circumference_cm && (
              <div className="flex flex-col">
                <Text variant="caption-regular" color="secondary" as="span">P. Cefálico</Text>
                <Text variant="body-md-semibold" as="span">{last.head_circumference_cm} cm</Text>
              </div>
            )}
          </div>
          <Divider className="mb-[var(--gap-md)]" />
        </>
      )}

      <div className="flex flex-col gap-[var(--gap-md)]">
        <Stepper label="Peso"         value={weightG}  onChange={setWeightG}  step={50}  unit="g"  />
        <Stepper label="Comprimento"  value={lengthCm} onChange={setLengthCm} step={0.5} unit="cm" />
        <Stepper label="P. Cefálico"  value={headCm}   onChange={setHeadCm}   step={0.5} unit="cm" />

        <Button
          label={loading ? '' : 'Guardar medição'}
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
