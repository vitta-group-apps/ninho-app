/**
 * Legacy-compatible routine contract.
 *
 * Atenção:
 * - Este NÃO é o contrato oficial do banco.
 * - A fonte da verdade é routine_logs no Supabase.
 * - Este tipo existe apenas para compatibilidade temporária com adapters legados.
 * - Snake_case deve ser preferido no restante do projeto.
 */

export type RoutineLogType = 'sleep' | 'feed' | 'diaper' | 'note';

export type SleepPayload = {
  sleep_type?: 'noturno' | 'soneca' | null;
  location?: string | null;
  how_fell_asleep?: string | null;
  sleep_position?: 'costas' | 'lado' | 'barriga' | null;
  sleep_quality?: 'tranquilo' | 'agitado' | 'com_choro' | null;
  awakenings?: '0' | '1' | '2' | '3+' | null;
  used_pacifier?: boolean | null;
  include_in_report?: boolean | null;

  // legado temporário
  quality?: 'good' | 'ok' | 'bad' | null;
  includeInReport?: boolean | null;
};

export type FeedPayload = {
  mode?: 'breastfeeding' | 'bottle' | 'solid' | 'manual' | null;
  side?: 'left' | 'right' | 'both' | null;

  amount_ml?: number | null;
  food?: string | null;

  left_seconds?: number | null;
  right_seconds?: number | null;
  total_seconds?: number | null;
  switches?: number | null;
  last_side?: 'L' | 'R' | null;
  is_manual?: boolean | null;

  tags?: string[] | null;
  include_in_report?: boolean | null;
  method?: string | null;
  temperature?: string | null;

  // legado temporário
  amountMl?: number | null;
  leftSeconds?: number | null;
  rightSeconds?: number | null;
  totalSeconds?: number | null;
  lastSide?: 'L' | 'R' | null;
  isManual?: boolean | null;
  includeInReport?: boolean | null;
};

export type DiaperPayload = {
  kind?: 'pee' | 'poop' | 'both' | null;
  quantity?: string | null;
  pee_color?: string | null;
  poop_color?: string | null;
  poop_texture?: string | null;
  include_in_report?: boolean | null;

  // legado temporário
  pee?: boolean;
  poop?: boolean;
  peeColor?: string | null;
  poopColor?: string | null;
  poopTexture?: string | null;
  includeInReport?: boolean | null;
};

export type NotePayload = {
  text?: string | null;
  include_in_report?: boolean | null;

  // legado temporário
  includeInReport?: boolean | null;
};

export type RoutinePayloadMap = {
  sleep: SleepPayload;
  feed: FeedPayload;
  diaper: DiaperPayload;
  note: NotePayload;
};

export type RoutineRecord<T extends RoutineLogType = RoutineLogType> = {
  id: string;
  childId: string;
  authorId: string;
  type: T;
  startTime: string;
  endTime: string | null;
  notes: string | null;
  payload: RoutinePayloadMap[T];
  createdAt: string;
};