/**
 * NINHO — useGrowthLog
 * CRUD para growth_measurements (peso, comprimento, perímetro cefálico).
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { GrowthRow, GrowthInput } from '../types/health';

interface UseGrowthLogReturn {
  measurements: GrowthRow[];
  loading:      boolean;
  error:        Error | null;
  addMeasurement:    (input: GrowthInput) => Promise<GrowthRow>;
  removeMeasurement: (id: string) => Promise<void>;
  refetch:      () => void;
}

export function useGrowthLog(childId: string): UseGrowthLogReturn {
  const [measurements, setMeasurements] = useState<GrowthRow[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<Error | null>(null);
  const [tick,         setTick]         = useState(0);

  useEffect(() => {
    if (!childId) return;
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);

      const { data, error: sbError } = await supabase
        .from('growth_measurements')
        .select('*')
        .eq('child_id', childId)
        .order('measured_at', { ascending: false })
        .limit(50);

      if (cancelled) return;
      setLoading(false);

      if (sbError) { setError(new Error(sbError.message)); return; }
      setMeasurements(data ?? []);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [childId, tick]);

  async function addMeasurement(input: GrowthInput): Promise<GrowthRow> {
    setLoading(true);
    setError(null);

    const { data, error: sbError } = await supabase
      .from('growth_measurements')
      .insert({
        child_id:               input.child_id,
        weight_grams:           input.weight_grams           ?? null,
        length_cm:              input.length_cm              ?? null,
        head_circumference_cm:  input.head_circumference_cm  ?? null,
        measured_at:            input.measured_at            ?? new Date().toISOString(),
        source:                 input.source                 ?? null,
      })
      .select()
      .single();

    setLoading(false);

    if (sbError) {
      const err = new Error(sbError.message);
      setError(err);
      throw err;
    }

    setTick(t => t + 1);
    return data as GrowthRow;
  }

  async function removeMeasurement(id: string): Promise<void> {
    setLoading(true);
    setError(null);

    const { error: sbError } = await supabase
      .from('growth_measurements')
      .delete()
      .eq('id', id);

    setLoading(false);

    if (sbError) {
      const err = new Error(sbError.message);
      setError(err);
      throw err;
    }

    setTick(t => t + 1);
  }

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { measurements, loading, error, addMeasurement, removeMeasurement, refetch };
}
