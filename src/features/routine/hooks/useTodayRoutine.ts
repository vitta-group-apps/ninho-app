/**
 * NINHO — useTodayRoutine
 * Lê todos os routine_logs do dia atual para um filho, tipados por discriminante.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RoutineType, TypedRoutineLog } from '../types/routine';

interface UseTodayRoutineReturn<T extends RoutineType> {
  logs:    TypedRoutineLog<T>[];
  loading: boolean;
  error:   Error | null;
  refetch: () => void;
}

export function useTodayRoutine<T extends RoutineType>(
  childId:     string,
  routineType: T,
): UseTodayRoutineReturn<T> {
  const [logs,    setLogs]    = useState<TypedRoutineLog<T>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<Error | null>(null);
  const [tick,    setTick]    = useState(0);

  useEffect(() => {
    if (!childId) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let cancelled = false;

    async function fetchLogs() {
      setLoading(true);
      setError(null);

      const { data, error: sbError } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('child_id',     childId)
        .eq('routine_type', routineType)
        .gte('created_at',  todayStart.toISOString())
        .lte('created_at',  todayEnd.toISOString())
        .order('created_at', { ascending: false });

      if (cancelled) return;

      setLoading(false);

      if (sbError) {
        setError(new Error(sbError.message));
        return;
      }

      setLogs((data ?? []) as unknown as TypedRoutineLog<T>[]);
    }

    fetchLogs();

    return () => { cancelled = true; };
  }, [childId, routineType, tick]);

  return {
    logs,
    loading,
    error,
    refetch: () => setTick(t => t + 1),
  };
}
