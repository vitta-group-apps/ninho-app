/**
 * NINHO — Routine Feature Types
 * Union Types estritos mapeados para routine_logs.routine_type no Supabase.
 */

import type {
  Database,
  SleepPayload,
  DiaperPayload,
  FeedingPayload,
  PumpingPayload,
  MedicationPayload,
  FoodIntroPayload,
  ActivityPayload,
} from '@/types/database.types';

// ─── Tipo base da tabela ────────────────────────────────────────────────────

export type RoutineLogRow    = Database['public']['Tables']['routine_logs']['Row'];
export type RoutineLogInsert = Database['public']['Tables']['routine_logs']['Insert'];
export type RoutineLogUpdate = Database['public']['Tables']['routine_logs']['Update'];

// ─── Union discriminada para routine_type ──────────────────────────────────

export type RoutineType =
  | 'sleep'
  | 'diaper'
  | 'feeding'
  | 'pumping'
  | 'medication'
  | 'food_intro'
  | 'activity';

// ─── Mapeamento payload → tipo ─────────────────────────────────────────────

export interface PayloadMap {
  sleep:      SleepPayload;
  diaper:     DiaperPayload;
  feeding:    FeedingPayload;
  pumping:    PumpingPayload;
  medication: MedicationPayload;
  food_intro: FoodIntroPayload;
  activity:   ActivityPayload;
}

// ─── Log tipado por discriminante ──────────────────────────────────────────

export type TypedRoutineLog<T extends RoutineType = RoutineType> = Omit<
  RoutineLogRow,
  'routine_type' | 'payload'
> & {
  routine_type: T;
  payload:      PayloadMap[T];
};

// Atalhos para os 3 tipos core da Fase 1
export type SleepLog    = TypedRoutineLog<'sleep'>;
export type DiaperLog   = TypedRoutineLog<'diaper'>;
export type FeedingLog  = TypedRoutineLog<'feeding'>;

// Union de todos os logs tipados (usado no dashboard e modais)
export type AnyRoutineLog =
  | TypedRoutineLog<'sleep'>
  | TypedRoutineLog<'diaper'>
  | TypedRoutineLog<'feeding'>
  | TypedRoutineLog<'pumping'>
  | TypedRoutineLog<'medication'>
  | TypedRoutineLog<'food_intro'>
  | TypedRoutineLog<'activity'>;

// ─── Input para inserção tipada ────────────────────────────────────────────

export type RoutineLogInput<T extends RoutineType = RoutineType> = {
  child_id:    string;
  routine_type: T;
  payload:     PayloadMap[T];
  started_at?: string;
  ended_at?:   string;
  notes?:      string;
  photo_url?:  string;
};
