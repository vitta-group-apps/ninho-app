/**
 * NINHO — useHealthLog
 * CRUD para health_logs (febre, sintomas, medicação dada).
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { HealthLogInput, TypedHealthLog } from '../types/health';

interface UseHealthLogReturn {
  addLog:    (input: HealthLogInput) => Promise<TypedHealthLog>;
  removeLog: (id: string) => Promise<void>;
  loading:   boolean;
  error:     Error | null;
}

export function useHealthLog(): UseHealthLogReturn {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<Error | null>(null);

  async function addLog(input: HealthLogInput): Promise<TypedHealthLog> {
    setLoading(true);
    setError(null);

    const { data, error: sbError } = await supabase
      .from('health_logs')
      .insert({
        child_id:      input.child_id,
        log_type:      input.log_type,
        value_numeric: input.value_numeric ?? null,
        value_unit:    input.value_unit    ?? null,
        notes:         input.notes         ?? null,
        occurred_at:   input.occurred_at   ?? new Date().toISOString(),
      })
      .select()
      .single();

    setLoading(false);

    if (sbError) {
      const err = new Error(sbError.message);
      setError(err);
      throw err;
    }

    return data as unknown as TypedHealthLog;
  }

  async function removeLog(id: string): Promise<void> {
    setLoading(true);
    setError(null);

    const { error: sbError } = await supabase
      .from('health_logs')
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
