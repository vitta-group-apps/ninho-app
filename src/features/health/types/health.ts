/**
 * NINHO — Health Feature Types
 * Mapeados para health_logs e growth_measurements no Supabase.
 */

import type { Database } from '@/types/database.types';

// ─── health_logs ──────────────────────────────────────────────────────────────

export type HealthLogRow    = Database['public']['Tables']['health_logs']['Row'];
export type HealthLogInsert = Database['public']['Tables']['health_logs']['Insert'];

export type HealthLogType =
  | 'fever'
  | 'symptom'
  | 'medication_given'
  | 'doctor_visit'
  | 'vaccination'
  | 'other';

export interface TypedHealthLog extends Omit<HealthLogRow, 'log_type'> {
  log_type: HealthLogType;
}

export interface HealthLogInput {
  child_id:      string;
  log_type:      HealthLogType;
  value_numeric?: number | null;
  value_unit?:   string | null;
  notes?:        string | null;
  occurred_at?:  string;
}

// ─── growth_measurements ──────────────────────────────────────────────────────

export type GrowthRow    = Database['public']['Tables']['growth_measurements']['Row'];
export type GrowthInsert = Database['public']['Tables']['growth_measurements']['Insert'];

export interface GrowthInput {
  child_id:               string;
  weight_grams?:          number | null;
  length_cm?:             number | null;
  head_circumference_cm?: number | null;
  measured_at?:           string;
  source?:                string | null;
}
