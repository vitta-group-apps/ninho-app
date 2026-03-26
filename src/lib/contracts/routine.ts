export type RoutineLogType = 'sleep' | 'feed' | 'diaper' | 'note';

export type SleepPayload = {
  quality?: 'good' | 'ok' | 'bad' | null;
  location?: string | null;
};

export type FeedPayload = {
  mode?: 'breastfeeding' | 'bottle' | 'solid' | null;
  side?: 'left' | 'right' | 'both' | null;
  amountMl?: number | null;
  food?: string | null;
};

export type DiaperPayload = {
  pee?: boolean;
  poop?: boolean;
  poopColor?: string | null;
  poopTexture?: string | null;
};

export type NotePayload = {
  text?: string | null;
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
