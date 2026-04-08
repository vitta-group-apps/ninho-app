/**
 * NINHO — useDailyRoutine
 * Lê routine_logs de qualquer dia para um filho, com paginação incremental.
 * Evolução de useTodayRoutine — aceita uma data ISO (YYYY-MM-DD).
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RoutineType, TypedRoutineLog } from '../types/routine';

const PAGE_SIZE = 20;

interface UseDailyRoutineReturn<T extends RoutineType> {
  logs:     TypedRoutineLog<T>[];
  loading:  boolean;
  error:    Error | null;
  hasMore:  boolean;
  loadMore: () => void;
  refetch:  () => void;
}

export function useDailyRoutine<T extends RoutineType>(
  childId:     string,
  routineType: T,
  date:        string,          // 'YYYY-MM-DD'
): UseDailyRoutineReturn<T> {
  const [logs,    setLogs]    = useState<TypedRoutineLog<T>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<Error | null>(null);
  const [page,    setPage]    = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [tick,    setTick]    = useState(0);

  // Reset pagination whenever key params change
  useEffect(() => {
    setLogs([]);
    setPage(0);
    setHasMore(true);
    setTick(t => t + 1);
  }, [childId, routineType, date]);

  useEffect(() => {
    if (!childId || !date) return;

    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd   = `${date}T23:59:59.999Z`;
    const from     = page * PAGE_SIZE;
    const to       = from + PAGE_SIZE - 1;

    let cancelled = false;

    async function fetchPage() {
      setLoading(true);
      setError(null);

      const { data, error: sbError } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('child_id',     childId)
        .eq('routine_type', routineType)
        .gte('created_at',  dayStart)
        .lte('created_at',  dayEnd)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (cancelled) return;

      setLoading(false);

      if (sbError) {
        setError(new Error(sbError.message));
        return;
      }

      const rows = (data ?? []) as unknown as TypedRoutineLog<T>[];

      setLogs(prev => page === 0 ? rows : [...prev, ...rows]);
      setHasMore(rows.length === PAGE_SIZE);
    }

    fetchPage();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, routineType, date, page, tick]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) setPage(p => p + 1);
  }, [loading, hasMore]);

  const refetch = useCallback(() => {
    setLogs([]);
    setPage(0);
    setHasMore(true);
    setTick(t => t + 1);
  }, []);

  return { logs, loading, error, hasMore, loadMore, refetch };
}
