/**
 * useSaudeData — Fetches all health data needed by SaudePage.
 *
 * Os tipos de entrada/saída são mantidos genéricos aqui.
 * A transformação (toConsultationRecord, toGrowthRecord, etc.)
 * continua na SaudePage até que os adapters de saúde sejam extraídos
 * em uma fase futura (P1 — modularização da SaudePage).
 *
 * Uso atual: este hook centraliza apenas o fetch paralelo do Supabase.
 * A SaudePage chama reload() após mutações (insert/update/delete).
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type RawConsultation    = Tables<'child_consultations'>;
export type RawGrowth          = Tables<'child_growth_measurements'>;
export type RawSymptom         = Tables<'child_symptom_logs'>;
export type RawMedicalNote     = Tables<'child_medical_notes'>;
export type RawVaccine         = Tables<'child_vaccines'>;
export type RawMedication      = Tables<'child_medications'>;

export interface SaudeRawData {
  consultations:  RawConsultation[];
  growth:         RawGrowth[];
  symptoms:       RawSymptom[];
  medicalNotes:   RawMedicalNote[];
  vaccines:       RawVaccine[];
  medications:    RawMedication[];
  loading:        boolean;
  reload:         () => void;
}

export function useSaudeData(childId: string | null | undefined): SaudeRawData {
  const [consultations,  setConsultations]  = useState<RawConsultation[]>([]);
  const [growth,         setGrowth]         = useState<RawGrowth[]>([]);
  const [symptoms,       setSymptoms]       = useState<RawSymptom[]>([]);
  const [medicalNotes,   setMedicalNotes]   = useState<RawMedicalNote[]>([]);
  const [vaccines,       setVaccines]       = useState<RawVaccine[]>([]);
  const [medications,    setMedications]    = useState<RawMedication[]>([]);
  const [loading,        setLoading]        = useState(true);

  const loadData = useCallback(async () => {
    if (!childId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [c, g, s, n, v, m] = await Promise.all([
        supabase.from('child_consultations').select('*')
          .eq('child_id', childId).order('consultation_date', { ascending: false }).limit(200),
        supabase.from('child_growth_measurements').select('*')
          .eq('child_id', childId).order('measured_on', { ascending: false }).limit(200),
        supabase.from('child_symptom_logs').select('*')
          .eq('child_id', childId).order('occurred_at', { ascending: false }).limit(200),
        supabase.from('child_medical_notes').select('*')
          .eq('child_id', childId).order('noted_at', { ascending: false }).limit(200),
        supabase.from('child_vaccines').select('*')
          .eq('child_id', childId),
        supabase.from('child_medications').select('*')
          .eq('child_id', childId).order('created_at', { ascending: false }),
      ]);

      if (c.error) throw c.error;
      if (g.error) throw g.error;
      if (s.error) throw s.error;
      if (n.error) throw n.error;
      if (v.error) throw v.error;
      if (m.error) throw m.error;

      setConsultations(c.data ?? []);
      setGrowth(g.data ?? []);
      setSymptoms(s.data ?? []);
      setMedicalNotes(n.data ?? []);
      setVaccines(v.data ?? []);
      setMedications(m.data ?? []);
    } catch {
      // erro tratado na página com toast
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => { loadData(); }, [loadData]);

  return {
    consultations,
    growth,
    symptoms,
    medicalNotes,
    vaccines,
    medications,
    loading,
    reload: loadData,
  };
}
