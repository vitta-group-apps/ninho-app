export type ChildSexAtBirth = 'male' | 'female' | 'unknown';

export function normalizeChildSexAtBirth(value: unknown): ChildSexAtBirth | null {
  if (value === 'male' || value === 'female' || value === 'unknown') return value;
  return null;
}
