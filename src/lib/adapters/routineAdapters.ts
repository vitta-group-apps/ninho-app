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

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const onlyStrings = value.filter((item): item is string => typeof item === 'string');
  return onlyStrings;
}

/**
 * Normaliza o payload de routine_logs para o contrato transitório tipado do front.
 *
 * Regras:
 * - payload é a fonte principal da estrutura do evento
 * - notes não reconstrói estrutura do evento
 * - notes só entra como fallback temporário para note.text
 * - compatibilidades legadas existem apenas para transição e não devem ser ampliadas
 */
function normalizeRoutinePayload<T extends RoutineLogType>(
  type: T,
  rawPayload: unknown,
  notesText: string | null
): RoutinePayloadMap[T] {
  const raw = asObject(rawPayload);

  switch (type) {
    case 'sleep':
      return {
        sleep_type:
          raw.sleep_type === 'noturno' || raw.sleep_type === 'soneca'
            ? raw.sleep_type
            : null,
        location: asString(raw.location),
        how_fell_asleep: asString(raw.how_fell_asleep),
        sleep_position:
          raw.sleep_position === 'costas' || raw.sleep_position === 'lado' || raw.sleep_position === 'barriga'
            ? raw.sleep_position
            : null,
        sleep_quality:
          raw.sleep_quality === 'tranquilo' || raw.sleep_quality === 'agitado' || raw.sleep_quality === 'com_choro'
            ? raw.sleep_quality
            : null,
        awakenings:
          raw.awakenings === '0' || raw.awakenings === '1' || raw.awakenings === '2' || raw.awakenings === '3+'
            ? raw.awakenings
            : null,
        used_pacifier: typeof raw.used_pacifier === 'boolean' ? raw.used_pacifier : null,
        include_in_report: typeof raw.include_in_report === 'boolean' ? raw.include_in_report : null,
        // legado — manter até migração completa
        quality:
          raw.quality === 'good' || raw.quality === 'ok' || raw.quality === 'bad'
            ? raw.quality
            : null,
      } as RoutinePayloadMap[T];

    case 'feed':
      return {
        mode:
          raw.mode === 'breastfeeding' ||
          raw.mode === 'bottle' ||
          raw.mode === 'solid' ||
          raw.mode === 'manual'
            ? raw.mode
            : null,
        side:
          raw.side === 'left' || raw.side === 'right' || raw.side === 'both'
            ? raw.side
            : null,
        amountMl: asNumber(raw.amountMl),
        food: asString(raw.food),

        leftSeconds: asNumber(raw.leftSeconds),
        rightSeconds: asNumber(raw.rightSeconds),
        totalSeconds: asNumber(raw.totalSeconds),
        switches: asNumber(raw.switches),

        tags: asStringArray(raw.tags),
        includeInReport: asBoolean(raw.includeInReport),
      } as RoutinePayloadMap[T];

    case 'diaper':
      return {
        pee: raw.pee === true,
        poop: raw.poop === true,
        quantity: asString(raw.quantity),
        peeColor: asString(raw.peeColor),
        poopColor: asString(raw.poopColor),
        poopTexture: asString(raw.poopTexture),
        includeInReport: asBoolean(raw.includeInReport),
      } as RoutinePayloadMap[T];

    case 'note':
      return {
        text: asString(raw.text) ?? notesText,
        includeInReport: asBoolean(raw.includeInReport),
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
    payload: normalizeRoutinePayload(row.type, row.payload, row.notes),
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