/**
 * NINHO — useInsights
 * Calcula métricas diárias a partir dos routine_logs do dia actual.
 * Estratégia B: query única agrupada por tipo, processamento client-side.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RoutineLogRow } from '@/features/routine/types/routine';
import type { SleepPayload, FeedingPayload, DiaperPayload } from '@/types/database.types';

export interface DailyInsights {
  totalSleepMin:   number;   // minutos de sono com ended_at
  feedingCount:    number;   // total de registos de alimentação
  diaperCount:     number;   // total de fraldas
  diaperDirty:     number;   // fraldas com cocô
  avgFeedDuration: number;   // média min por amamentação ao peito
  lastSleepAgo:    string;   // "há X min/h" ou '' se sem registo
}

function minutesBetween(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000);
}

function timeAgo(iso: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diff < 60) return `há ${diff} min`;
  return `há ${Math.round(diff / 60)}h`;
}

function buildInsights(logs: RoutineLogRow[]): DailyInsights {
  const sleep   = logs.filter(l => l.routine_type === 'sleep');
  const feeding = logs.filter(l => l.routine_type === 'feeding');
  const diaper  = logs.filter(l => l.routine_type === 'diaper');

  const totalSleepMin = sleep.reduce((acc, l) => {
    if (l.started_at && l.ended_at) acc += minutesBetween(l.started_at, l.ended_at);
    return acc;
  }, 0);

  const breastFeeds = feeding.filter(l => (l.payload as FeedingPayload)?.method === 'breast');
  const durations   = breastFeeds
    .map(l => (l.payload as FeedingPayload)?.duration_min ?? 0)
    .filter(d => d > 0);
  const avgFeedDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  const diaperDirty = diaper.filter(l => {
    const t = (l.payload as DiaperPayload)?.type;
    return t === 'dirty' || t === 'both';
  }).length;

  const lastSleep  = sleep[0]; // sorted desc
  const lastSleepAgo = lastSleep ? timeAgo(lastSleep.created_at) : '';

  return {
    totalSleepMin,
    feedingCount: feeding.length,
    diaperCount:  diaper.length,
    diaperDirty,
    avgFeedDuration,
    lastSleepAgo,
  };
}

export function useInsights(childId: string) {
  const [insights, setInsights] = useState<DailyInsights>({
    totalSleepMin: 0, feedingCount: 0, diaperCount: 0,
    diaperDirty: 0, avgFeedDuration: 0, lastSleepAgo: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!childId) return;

    const today = new Date();
    const start = new Date(today); start.setHours(0, 0, 0, 0);
    const end   = new Date(today); end.setHours(23, 59, 59, 999);

    let cancelled = false;

    async function fetch() {
      setLoading(true);
      const { data } = await supabase
        .from('routine_logs')
        .select('routine_type, payload, started_at, ended_at, created_at')
        .eq('child_id', childId)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (cancelled) return;
      setLoading(false);
      if (data) setInsights(buildInsights(data as RoutineLogRow[]));
    }

    fetch();
    return () => { cancelled = true; };
  }, [childId]);

  return { insights, loading };
}
