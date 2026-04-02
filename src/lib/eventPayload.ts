/**
 * Shared helpers for structured event payloads.
 *
 * Contract rules:
 * - payload is the primary source of structured event data
 * - notes is human text and must not be parsed as event structure
 * - snake_case is the preferred contract
 * - camelCase fallback is temporary and should not be expanded
 */

export type PayloadRecord = Record<string, unknown>;

export function asObject(value: unknown): PayloadRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as PayloadRecord)
    : {};
}

export function isRecord(value: unknown): value is PayloadRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0
    );
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
  }

  return [];
}

export function cleanPayload(payload: PayloadRecord): PayloadRecord {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

export function readString(
  payload: PayloadRecord,
  snake: string,
  camel?: string
): string | null {
  return asString(payload[snake]) ?? (camel ? asString(payload[camel]) : null);
}

export function readNumber(
  payload: PayloadRecord,
  snake: string,
  camel?: string
): number | null {
  return asNumber(payload[snake]) ?? (camel ? asNumber(payload[camel]) : null);
}

export function readBoolean(
  payload: PayloadRecord,
  snake: string,
  camel?: string
): boolean | null {
  return asBoolean(payload[snake]) ?? (camel ? asBoolean(payload[camel]) : null);
}
