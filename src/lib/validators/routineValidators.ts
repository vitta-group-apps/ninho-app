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

function isNumberOrNullOrUndefined(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'number' && Number.isFinite(value));
}

function isBooleanOrUndefined(value: unknown): boolean {
  return value === undefined || typeof value === 'boolean';
}

function isStringOrNullOrUndefined(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string';
}

function isStringArrayOrUndefined(value: unknown): boolean {
  return (
    value === undefined ||
    (Array.isArray(value) && value.every(item => typeof item === 'string'))
  );
}

function isRoutineLogType(value: unknown): value is RoutineLogType {
  return value === 'sleep' || value === 'feed' || value === 'diaper' || value === 'note';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isSleepPayload(value: unknown): value is RoutinePayloadMap['sleep'] {
  if (!isObject(value)) return false;

  const sleepType = value.sleep_type;
  const location = value.location;
  const howFellAsleep = value.how_fell_asleep;
  const sleepPosition = value.sleep_position;
  const sleepQuality = value.sleep_quality;
  const awakenings = value.awakenings;
  const usedPacifier = value.used_pacifier;
  const includeInReport = value.include_in_report;

  const sleepTypeOk =
    sleepType === undefined ||
    sleepType === null ||
    sleepType === 'noturno' ||
    sleepType === 'soneca';

  const locationOk = isStringOrNullOrUndefined(location);

  const howOk = isStringOrNullOrUndefined(howFellAsleep);

  const positionOk =
    sleepPosition === undefined ||
    sleepPosition === null ||
    sleepPosition === 'costas' ||
    sleepPosition === 'lado' ||
    sleepPosition === 'barriga';

  const qualityOk =
    sleepQuality === undefined ||
    sleepQuality === null ||
    sleepQuality === 'tranquilo' ||
    sleepQuality === 'agitado' ||
    sleepQuality === 'com_choro';

  const awakeningsOk =
    awakenings === undefined ||
    awakenings === null ||
    awakenings === '0' ||
    awakenings === '1' ||
    awakenings === '2' ||
    awakenings === '3+';

  const usedPacifierOk = isBooleanOrUndefined(usedPacifier);
  const includeInReportOk = isBooleanOrUndefined(includeInReport);

  return (
    sleepTypeOk &&
    locationOk &&
    howOk &&
    positionOk &&
    qualityOk &&
    awakeningsOk &&
    usedPacifierOk &&
    includeInReportOk
  );
}

function isFeedPayload(value: unknown): value is RoutinePayloadMap['feed'] {
  if (!isObject(value)) return false;

  const mode = value.mode;
  const side = value.side;

  // prioriza snake_case, mas aceita camelCase legado
  const amountMl = value.amount_ml ?? value.amountMl;
  const food = value.food;
  const totalSeconds = value.total_seconds ?? value.totalSeconds;
  const leftSeconds = value.left_seconds ?? value.leftSeconds;
  const rightSeconds = value.right_seconds ?? value.rightSeconds;
  const switches = value.switches;
  const lastSide = value.last_side ?? value.lastSide;
  const tags = value.tags;
  const includeInReport = value.include_in_report ?? value.includeInReport;
  const isManual = value.is_manual ?? value.isManual;
  const method = value.method;

  const modeOk =
    mode === undefined ||
    mode === null ||
    mode === 'breastfeeding' ||
    mode === 'bottle' ||
    mode === 'solid' ||
    mode === 'manual';

  const sideOk =
    side === undefined ||
    side === null ||
    side === 'left' ||
    side === 'right' ||
    side === 'both';

  const amountOk = isNumberOrNullOrUndefined(amountMl);
  const foodOk = isStringOrNullOrUndefined(food);
  const totalSecondsOk = isNumberOrNullOrUndefined(totalSeconds);
  const leftSecondsOk = isNumberOrNullOrUndefined(leftSeconds);
  const rightSecondsOk = isNumberOrNullOrUndefined(rightSeconds);
  const switchesOk = isNumberOrNullOrUndefined(switches);

  const lastSideOk =
    lastSide === undefined ||
    lastSide === null ||
    lastSide === 'L' ||
    lastSide === 'R';

  const tagsOk = isStringArrayOrUndefined(tags);
  const includeInReportOk = isBooleanOrUndefined(includeInReport);
  const isManualOk = isBooleanOrUndefined(isManual);
  const methodOk = isStringOrNullOrUndefined(method);

  return (
    modeOk &&
    sideOk &&
    amountOk &&
    foodOk &&
    totalSecondsOk &&
    leftSecondsOk &&
    rightSecondsOk &&
    switchesOk &&
    lastSideOk &&
    tagsOk &&
    includeInReportOk &&
    isManualOk &&
    methodOk
  );
}

function isDiaperPayload(value: unknown): value is RoutinePayloadMap['diaper'] {
  if (!isObject(value)) return false;

  // novo modelo
  const kind = value.kind;
  const quantity = value.quantity;
  const peeColor = value.pee_color ?? value.peeColor;
  const poopColor = value.poop_color ?? value.poopColor;
  const poopTexture = value.poop_texture ?? value.poopTexture;
  const includeInReport = value.include_in_report ?? value.includeInReport;

  // legado
  const pee = value.pee;
  const poop = value.poop;

  const kindOk =
    kind === undefined ||
    kind === null ||
    kind === 'pee' ||
    kind === 'poop' ||
    kind === 'both';

  const quantityOk =
    quantity === undefined ||
    quantity === null ||
    quantity === 'small' ||
    quantity === 'medium' ||
    quantity === 'large';

  const peeColorOk = isStringOrNullOrUndefined(peeColor);
  const poopColorOk = isStringOrNullOrUndefined(poopColor);
  const poopTextureOk = isStringOrNullOrUndefined(poopTexture);
  const includeInReportOk = isBooleanOrUndefined(includeInReport);

  const peeOk = pee === undefined || typeof pee === 'boolean';
  const poopOk = poop === undefined || typeof poop === 'boolean';

  return (
    kindOk &&
    quantityOk &&
    peeColorOk &&
    poopColorOk &&
    poopTextureOk &&
    includeInReportOk &&
    peeOk &&
    poopOk
  );
}

function isNotePayload(value: unknown): value is RoutinePayloadMap['note'] {
  if (!isObject(value)) return false;

  const text = value.text;
  const includeInReport = value.include_in_report ?? value.includeInReport;

  const textOk = text === undefined || text === null || typeof text === 'string';
  const includeInReportOk = isBooleanOrUndefined(includeInReport);

  return textOk && includeInReportOk;
}

function isValidPayloadForType(type: RoutineLogType, payload: unknown): boolean {
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
  if (!isRoutineLogType(value.type)) return false;

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.childId) &&
    isNonEmptyString(value.authorId) &&
    isNonEmptyString(value.startTime) &&
    isStringOrNull(value.endTime) &&
    isStringOrNull(value.notes) &&
    isNonEmptyString(value.createdAt) &&
    isValidPayloadForType(value.type, value.payload)
  );
}