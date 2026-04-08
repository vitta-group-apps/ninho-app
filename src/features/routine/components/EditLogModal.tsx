/**
 * NINHO — EditLogModal
 * Correção rápida de notas e horários de um routine_log.
 * Usa o Modal do DS e updateLog do useRoutineLog.
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/design-system/components/ui/Modal';
import { Text }  from '@/design-system/components/ui/Text';
import { useRoutineLog } from '../hooks/useRoutineLog';
import type { AnyRoutineLog } from '../types/routine';
import { cn } from '@/design-system/lib/utils';

// ─── helpers ─────────────────────────────────────────────────────────────────

function isoToLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

function localToIso(local: string): string | null {
  return local ? new Date(local).toISOString() : null;
}

// ─── input ────────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="caption-medium" color="secondary" as="label" className="flex flex-col gap-[var(--gap-xxs)]">
      {children}
    </Text>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="datetime-local"
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        'w-full rounded-[var(--radius-sm)] border border-ds-neutral-border',
        'bg-ds-pure-white text-ds-neutral-fg-strong',
        'px-[var(--padding-sm)] py-[var(--padding-xs)]',
        'font-body text-text-sm',
        'focus:outline-none focus:ring-2 focus:ring-ds-accent-tint',
      )}
    />
  );
}

// ─── props ────────────────────────────────────────────────────────────────────

export interface EditLogModalProps {
  log:      AnyRoutineLog | null;
  open:     boolean;
  onClose:  () => void;
  onSaved:  () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export function EditLogModal({ log, open, onClose, onSaved }: EditLogModalProps) {
  const { updateLog, loading } = useRoutineLog();

  const [notes,     setNotes]     = useState('');
  const [startedAt, setStartedAt] = useState('');
  const [endedAt,   setEndedAt]   = useState('');

  // Sync form with log on open
  useEffect(() => {
    if (log && open) {
      setNotes(log.notes ?? '');
      setStartedAt(isoToLocal(log.started_at));
      setEndedAt(isoToLocal(log.ended_at));
    }
  }, [log, open]);

  async function handleSave() {
    if (!log) return;
    try {
      await updateLog(log.id, {
        notes:      notes.trim() || null,
        started_at: localToIso(startedAt),
        ended_at:   localToIso(endedAt) ?? undefined,
      });
      toast.success('Registo atualizado.');
      onSaved();
      onClose();
    } catch {
      toast.error('Erro ao atualizar registo.');
    }
  }

  const TYPE_LABELS: Record<string, string> = {
    sleep:   '🌙 Sono',
    diaper:  '🧷 Fralda',
    feeding: '🍼 Alimentação',
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      type="title-in-top"
      title={log ? `Editar — ${TYPE_LABELS[log.routine_type] ?? log.routine_type}` : 'Editar registo'}
      description={
        <div className="flex flex-col gap-[var(--gap-md)] w-full pt-2">
          <FieldLabel>
            Início
            <TimeInput value={startedAt} onChange={setStartedAt} />
          </FieldLabel>

          {log?.routine_type === 'sleep' && (
            <FieldLabel>
              Fim
              <TimeInput value={endedAt} onChange={setEndedAt} />
            </FieldLabel>
          )}

          <FieldLabel>
            Notas
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Adiciona uma nota…"
              className={cn(
                'w-full rounded-[var(--radius-sm)] border border-ds-neutral-border',
                'bg-ds-pure-white text-ds-neutral-fg-strong',
                'px-[var(--padding-sm)] py-[var(--padding-xs)]',
                'font-body text-text-sm resize-none',
                'focus:outline-none focus:ring-2 focus:ring-ds-accent-tint',
                'placeholder:text-ds-neutral-fg',
              )}
            />
          </FieldLabel>
        </div>
      }
      primaryAction={{
        label:   loading ? 'A guardar…' : 'Guardar',
        onClick: handleSave,
      }}
      secondaryAction={{
        label:   'Cancelar',
        onClick: onClose,
      }}
    />
  );
}
