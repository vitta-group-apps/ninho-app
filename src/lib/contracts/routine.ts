export type RoutineLogType = 'sleep' | 'feed' | 'diaper' | 'note';

export type SleepPayload = {
  quality?: 'good' | 'ok' | 'bad' | null;
  location?: string | null;
};

export type FeedPayload = {
  mode?: 'breastfeeding' | 'bottle' | 'solid' | 'manual' | null;
  side?: 'left' | 'right' | 'both' | null;
  amountMl?: number | null;
  food?: string | null;

  leftSeconds?: number | null;
  rightSeconds?: number | null;
  totalSeconds?: number | null;
  switches?: number | null;

  tags?: string[] | null;
  includeInReport?: boolean | null;
};

export type DiaperPayload = {
  pee?: boolean;
  poop?: boolean;
  quantity?: string | null;
  peeColor?: string | null;
  poopColor?: string | null;
  poopTexture?: string | null;
  includeInReport?: boolean | null;
};

export type NotePayload = {
  text?: string | null;
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