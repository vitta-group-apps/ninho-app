function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

export type RoutineRecord = {
  id: string;
  childId: string;
  authorId: string;
  type: string;
  startTime: string;
  endTime: string | null;
  notes: string | null;
  createdAt: string;
};

export function isValidRoutineRecord(value: unknown): value is RoutineRecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    isNonEmptyString(v.id) &&
    isNonEmptyString(v.childId) &&
    isNonEmptyString(v.authorId) &&
    isNonEmptyString(v.type) &&
    isNonEmptyString(v.startTime) &&
    isStringOrNull(v.endTime) &&
    isStringOrNull(v.notes) &&
    isNonEmptyString(v.createdAt)
  );
}
