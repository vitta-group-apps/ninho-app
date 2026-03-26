import type {
  ConsultationRecord,
  GrowthRecord,
  SymptomRecord,
  MedicalNoteRecord,
  MedicationRecord,
  VaccineRecord,
} from '@/lib/contracts/health';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isNumberOrNull(value: unknown): value is number | null {
  return typeof value === 'number' || value === null;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

export function isValidConsultationRecord(value: unknown): value is ConsultationRecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    isNonEmptyString(v.id) &&
    isNonEmptyString(v.childId) &&
    isNonEmptyString(v.authorId) &&
    isNonEmptyString(v.date) &&
    isStringOrNull(v.doctorName) &&
    isStringOrNull(v.specialty) &&
    isStringOrNull(v.location) &&
    isStringOrNull(v.notes) &&
    isNonEmptyString(v.createdAt) &&
    isNonEmptyString(v.updatedAt)
  );
}

export function isValidGrowthRecord(value: unknown): value is GrowthRecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    isNonEmptyString(v.id) &&
    isNonEmptyString(v.childId) &&
    isNonEmptyString(v.authorId) &&
    isNonEmptyString(v.measuredOn) &&
    isNumberOrNull(v.weightKg) &&
    isNumberOrNull(v.heightCm) &&
    isNumberOrNull(v.headCircumferenceCm) &&
    isStringOrNull(v.notes) &&
    isNonEmptyString(v.createdAt) &&
    isNonEmptyString(v.updatedAt)
  );
}

export function isValidSymptomRecord(value: unknown): value is SymptomRecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    isNonEmptyString(v.id) &&
    isNonEmptyString(v.childId) &&
    isNonEmptyString(v.authorId) &&
    isNonEmptyString(v.occurredAt) &&
    isStringArray(v.symptoms) &&
    isStringOrNull(v.severity) &&
    isNumberOrNull(v.temperatureC) &&
    isStringOrNull(v.notes) &&
    isNonEmptyString(v.createdAt) &&
    isNonEmptyString(v.updatedAt)
  );
}

export function isValidMedicalNoteRecord(value: unknown): value is MedicalNoteRecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    isNonEmptyString(v.id) &&
    isNonEmptyString(v.childId) &&
    isNonEmptyString(v.authorId) &&
    isNonEmptyString(v.notedAt) &&
    isNonEmptyString(v.note) &&
    isStringOrNull(v.source) &&
    isNonEmptyString(v.createdAt) &&
    isNonEmptyString(v.updatedAt)
  );
}

export function isValidMedicationRecord(value: unknown): value is MedicationRecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    isNonEmptyString(v.id) &&
    isNonEmptyString(v.childId) &&
    isNonEmptyString(v.authorId) &&
    isNonEmptyString(v.name) &&
    isStringOrNull(v.dosage) &&
    isStringOrNull(v.frequency) &&
    isStringOrNull(v.startDate) &&
    isStringOrNull(v.endDate) &&
    isBoolean(v.isActive) &&
    isStringOrNull(v.notes) &&
    isNonEmptyString(v.createdAt) &&
    isNonEmptyString(v.updatedAt)
  );
}

export function isValidVaccineRecord(value: unknown): value is VaccineRecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    isNonEmptyString(v.id) &&
    isNonEmptyString(v.childId) &&
    isNonEmptyString(v.vaccineId) &&
    isStringOrNull(v.vaccineCode) &&
    isStringOrNull(v.vaccineName) &&
    isStringOrNull(v.doseLabel) &&
    isNumberOrNull(v.scheduledAgeMonths) &&
    isStringOrNull(v.scheduledDate) &&
    isStringOrNull(v.appliedDate) &&
    isStringOrNull(v.status) &&
    isStringOrNull(v.source) &&
    isStringOrNull(v.notes) &&
    isNonEmptyString(v.createdAt) &&
    isNonEmptyString(v.updatedAt)
  );
}
