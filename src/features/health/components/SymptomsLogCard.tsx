/**
 * NINHO — SymptomsLogCard
 * Regista sintomas livres com nota opcional.
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card }         from '@/design-system/components/ui/Card';
import { Button }       from '@/design-system/components/ui/Button';
import { Text }         from '@/design-system/components/ui/Text';
import { Tag }          from '@/design-system/components/ui/Tag';
import { Chip }         from '@/design-system/components/ui/Chip';
import { SpinnerRound } from '@/design-system/components/ui/Spinner';
import { useHealthLog } from '../hooks/useHealthLog';
import { cn } from '@/design-system/lib/utils';

const COMMON_SYMPTOMS = [
  'Tosse', 'Coriza', 'Vómitos', 'Diarreia',
  'Choro intenso', 'Irritabilidade', 'Recusa alimentar', 'Erupção cutânea',
];

export interface SymptomsLogCardProps {
  childId:  string;
  onSaved?: () => void;
}

export function SymptomsLogCard({ childId, onSaved }: SymptomsLogCardProps) {
  const { addLog, loading } = useHealthLog();
  const [selected, setSelected] = useState<string[]>([]);
  const [notes,    setNotes]    = useState('');

  function toggleSymptom(s: string) {
    setSelected(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  }

  const canSave = selected.length > 0 || notes.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;
    const allNotes = [selected.join(', '), notes.trim()].filter(Boolean).join(' — ');
    try {
      await addLog({
        child_id: childId,
        log_type: 'symptom',
        notes:    allNotes,
      });
      toast.success('Sintomas registados!');
      setSelected([]);
      setNotes('');
      onSaved?.();
    } catch {
      toast.error('Erro ao registar sintomas.');
    }
  }

  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center gap-[var(--gap-sm)] mb-[var(--gap-md)]">
        <span className="text-xl" aria-hidden="true">🤒</span>
        <Text variant="body-lg-semibold">Sintomas</Text>
      </div>

      <div className="flex flex-col gap-[var(--gap-md)]">
        <div className="flex flex-col gap-[var(--gap-xs)]">
          <Text variant="caption-medium" color="secondary" as="span">Sintomas frequentes</Text>
          <div className="flex flex-wrap gap-[var(--gap-xs)]">
            {COMMON_SYMPTOMS.map(s => (
              <Chip
                key={s}
                label={s}
                selected={selected.includes(s)}
                onClick={() => toggleSymptom(s)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-[var(--gap-xxs)]">
          <Text variant="caption-medium" color="secondary" as="label">Notas adicionais</Text>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Descreve outros sintomas…"
            className={cn(
              'w-full rounded-[var(--radius-sm)] border border-ds-neutral-border',
              'bg-ds-pure-white text-ds-neutral-fg-strong',
              'px-[var(--padding-sm)] py-[var(--padding-xs)]',
              'font-body text-text-sm resize-none',
              'focus:outline-none focus:ring-2 focus:ring-ds-accent-tint',
              'placeholder:text-ds-neutral-fg',
            )}
          />
        </div>

        <Button
          label={loading ? '' : 'Registar sintomas'}
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
