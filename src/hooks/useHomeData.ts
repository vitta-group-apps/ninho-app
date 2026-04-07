/**
 * useHomeData — Fetches all data needed by HomePage.
 *
 * Retorna:
 *  - logs: routine_logs de hoje
 *  - logsLoading, logsError
 *  - consultationCount, nextConsultDate, hasConsultHistory
 *  - appliedVaccineCount
 *  - reload: recarrega os logs manualmente
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { RoutineLog } from '../lib/eventSystem';

export interface HomeData {
  logs: RoutineLog[];
  logsLoading: boolean;
  logsError: string | null;
  consultationCount: number;
  nextConsultDate: string | null;
  hasConsultHistory: boolean;
  appliedVaccineCount: number;
  reload: () => void;
}

export function useHomeData(childId: string | null | undefined): HomeData {
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [consultationCount, setConsultationCount] = useState(-1);
  const [nextConsultDate, setNextConsultDate] = useState<string | null>(null);
  const [hasConsultHistory, setHasConsultHistory] = useState(false);
  const [appliedVaccineCount, setAppliedVaccineCount] = useState(-1);

  const loadLogs = useCallback(async () => {
    if (!childId) return;
    setLogsLoading(true);
    setLogsError(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('child_id', childId)
        .gte('start_time', today.toISOString())
        .order('start_time', { ascending: false });
      if (error) throw error;
      setLogs(data ?? []);
    } catch {
      setLogsError('Não foi possível carregar os eventos de hoje.');
    } finally {
      setLogsLoading(false);
    }
  }, [childId]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  useEffect(() => {
    if (!childId) return;

    supabase
      .from('child_consultations')
      .select('id, consultation_date', { count: 'exact' })
      .eq('child_id', childId)
      .then(({ data, count }) => {
        setConsultationCount(count ?? 0);
        const today = new Date().toISOString().split('T')[0];
        const consultDates = (data ?? [])
          .map(r => typeof r.consultation_date === 'string' ? r.consultation_date : null)
          .filter((d): d is string => d !== null);
        const upcoming = consultDates.filter(d => d >= today).sort()[0] ?? null;
        setNextConsultDate(upcoming);
        setHasConsultHistory(consultDates.length > 0);
      });

    supabase
      .from('child_vaccines')
      .select('id', { count: 'exact', head: true })
      .eq('child_id', childId)
      .eq('status', 'applied')
      .then(({ count }) => setAppliedVaccineCount(count ?? 0));

  }, [childId]);

  return {
    logs,
    logsLoading,
    logsError,
    consultationCount,
    nextConsultDate,
    hasConsultHistory,
    appliedVaccineCount,
    reload: loadLogs,
  };
}
