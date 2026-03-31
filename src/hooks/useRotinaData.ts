/**
 * useRotinaData — Fetches routine_logs for RotinaPage.
 *
 * Suporta filtros de período: 'today' | 'week' | 'month'
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RoutineLog } from '@/lib/eventSystem';

export interface RotinaData {
  logs: RoutineLog[];
  loading: boolean;
  reload: () => void;
}

export function useRotinaData(
  childId: string | null | undefined,
  period: 'today' | 'week' | 'month'
): RotinaData {
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    if (!childId) return;
    setLoading(true);
    try {
      const now = new Date();
      const from = new Date(now);
      if (period === 'today') {
        from.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        from.setDate(now.getDate() - 7);
      } else {
        from.setDate(now.getDate() - 30);
      }

      const { data, error } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('child_id', childId)
        .gte('start_time', from.toISOString())
        .order('start_time', { ascending: false });

      if (error) throw error;
      setLogs((data ?? []) as RoutineLog[]);
    } catch {
      // manter silencioso — padrão atual
    } finally {
      setLoading(false);
    }
  }, [childId, period]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  return { logs, loading, reload: loadLogs };
}
