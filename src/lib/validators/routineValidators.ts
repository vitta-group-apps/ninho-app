import type {
  RoutineLogType,
  RoutinePayloadMap,
  RoutineRecord,
} from '@/lib/contracts/routine';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isRoutineLogType(value: unknown): value is RoutineLogType {
  return value === 'sleep' || value === 'feed' || value === 'diaper' || value === 'note';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isSleepPayload(value: unknown): value is RoutinePayloadMap['sleep'] {
  if (!isObject(value)) return false;

  const quality = value.quality;
  const location = value.location;

  const qualityOk =
    quality === undefined ||
    quality === null ||
    quality === 'good' ||
    quality === 'ok' ||
    quality === 'bad';

  const locationOk = location === undefined || location === null || typeof location === 'string';

  return qualityOk && locationOk;
}

function isFeedPayload(value: unknown): value is RoutinePayloadMap['feed'] {
  if (!isObject(value)) return false;

  const mode = value.mode;
  const side = value.side;
  const amountMl = value.amountMl;
  const food = value.food;

  const modeOk =
    mode === undefined ||
    mode === null ||
    mode === 'breastfeeding' ||
    mode === 'bottle' ||
    mode === 'solid';

  const sideOk =
    side === undefined ||
    side === null ||
    side === 'left' ||
    side === 'right' ||
    side === 'both';

  const amountOk = amountMl === undefined || amountMl === null || typeof amountMl === 'number';
  const foodOk = food === undefined || food === null || typeof food === 'string';

  return modeOk && sideOk && amountOk && foodOk;
}

function isDiaperPayload(value: unknown): value is RoutinePayloadMap['diaper'] {
  if (!isObject(value)) return false;

  const pee = value.pee;
  const poop = value.poop;
  const poopColor = value.poopColor;
  const poopTexture = value.poopTexture;

  const peeOk = pee === undefined || typeof pee === 'boolean';
  const poopOk = poop === undefined || typeof poop === 'boolean';
  const colorOk = poopColor === undefined || poopColor === null || typeof poopColor === 'string';
  const textureOk =
    poopTexture === undefined || poopTexture === null || typeof poopTexture === 'string';

  return peeOk && poopOk && colorOk && textureOk;
}

function isNotePayload(value: unknown): value is RoutinePayloadMap['note'] {
  if (!isObject(value)) return false;

  const text = value.text;
  return text === undefined || text === null || typeof text === 'string';
}

function isValidPayloadForType(
  type: RoutineLogType,
  payload: unknown
): boolean {
  switch (type) {
    case 'sleep':
      return isSleepPayload(payload);
    case 'feed':
      return isFeedPayload(payload);
    case 'diaper':
      return isDiaperPayload(payload);
    case 'note':
      return isNotePayload(payload);
    default:
      return false;
  }
}

export function isValidRoutineRecord(value: unknown): value is RoutineRecord {
  if (!isObject(value)) return false;

  const type = value.type;

  if (!isRoutineLogType(type)) return false;

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.childId) &&
    isNonEmptyString(value.authorId) &&
    isNonEmptyString(value.startTime) &&
    isStringOrNull(value.endTime) &&
    isStringOrNull(value.notes) &&
    isNonEmptyString(value.createdAt) &&
    isValidPayloadForType(type, value.payload)
  );
}