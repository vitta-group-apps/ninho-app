import type { Tables } from '@/integrations/supabase/types';
import type {
  RoutineLogType,
  RoutinePayloadMap,
  RoutineRecord,
} from '@/lib/contracts/routine';

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parsePayload<T extends RoutineLogType>(
  type: T,
  rawPayload: unknown,
  notes: string | null
): RoutinePayloadMap[T] {
  const raw = asObject(rawPayload);

  switch (type) {
    case 'sleep':
      return {
        quality:
          raw.quality === 'good' || raw.quality === 'ok' || raw.quality === 'bad'
            ? raw.quality
            : null,
        location: typeof raw.location === 'string' ? raw.location : null,
      } as RoutinePayloadMap[T];

    case 'feed':
      return {
        mode:
          raw.mode === 'breastfeeding' || raw.mode === 'bottle' || raw.mode === 'solid'
            ? raw.mode
            : null,
        side:
          raw.side === 'left' || raw.side === 'right' || raw.side === 'both'
            ? raw.side
            : null,
        amountMl: typeof raw.amountMl === 'number' ? raw.amountMl : null,
        food: typeof raw.food === 'string' ? raw.food : null,
      } as RoutinePayloadMap[T];

    case 'diaper':
      return {
        pee: typeof raw.pee === 'boolean' ? raw.pee : false,
        poop: typeof raw.poop === 'boolean' ? raw.poop : false,
        poopColor: typeof raw.poopColor === 'string' ? raw.poopColor : null,
        poopTexture: typeof raw.poopTexture === 'string' ? raw.poopTexture : null,
      } as RoutinePayloadMap[T];

    case 'note':
      return {
        text: typeof raw.text === 'string' ? raw.text : notes,
      } as RoutinePayloadMap[T];

    default:
      return {} as RoutinePayloadMap[T];
  }
}

export function toRoutineRecord<T extends RoutineLogType>(
  row: Tables<'routine_logs'> & { type: T; payload?: unknown }
): RoutineRecord<T> {
  return {
    id: row.id,
    childId: row.child_id,
    authorId: row.author_id,
    type: row.type,
    startTime: row.start_time,
    endTime: row.end_time,
    notes: row.notes,
    payload: parsePayload(row.type, row.payload, row.notes),
    createdAt: row.created_at,
  };
}

export function serializeRoutinePayload<T extends RoutineLogType>(
  _type: T,
  payload: RoutinePayloadMap[T]
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload as Record<string, unknown>).filter(
      ([, value]) => value !== undefined
    )
  );
}