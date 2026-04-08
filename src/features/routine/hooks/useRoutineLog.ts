/**
 * NINHO — useRoutineLog
 * Mutações tipadas para routine_logs: inserir e remover.
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/types/database.types';
import type { RoutineType, RoutineLogInput, TypedRoutineLog } from '../types/routine';

interface UseRoutineLogReturn<T extends RoutineType> {
  addLog:    (input: RoutineLogInput<T>) => Promise<TypedRoutineLog<T>>;
  removeLog: (id: string) => Promise<void>;
  loading:   boolean;
  error:     Error | null;
}

export function useRoutineLog<T extends RoutineType>(): UseRoutineLogReturn<T> {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<Error | null>(null);

  async function addLog(input: RoutineLogInput<T>): Promise<TypedRoutineLog<T>> {
    setLoading(true);
    setError(null);

    const { data, error: sbError } = await supabase
      .from('routine_logs')
      .insert({
        child_id:     input.child_id,
        routine_type: input.routine_type,
        payload:      input.payload as unknown as Json,
        started_at:   input.started_at ?? new Date().toISOString(),
        ended_at:     input.ended_at   ?? null,
        notes:        input.notes      ?? null,
        photo_url:    input.photo_url  ?? null,
      })
      .select()
      .single();

    setLoading(false);

    if (sbError) {
      const err = new Error(sbError.message);
      setError(err);
      throw err;
    }

    return data as unknown as TypedRoutineLog<T>;
  }

  async function removeLog(id: string): Promise<void> {
    setLoading(true);
    setError(null);

    const { error: sbError } = await supabase
      .from('routine_logs')
      .delete()
      .eq('id', id);

    setLoading(false);

    if (sbError) {
      const err = new Error(sbError.message);
      setError(err);
      throw err;
    }
  }

  return { addLog, removeLog, loading, error };
}
