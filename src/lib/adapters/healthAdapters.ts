import type { Tables } from '../integrations/supabase/types';
import type {
  ConsultationRecord,
  GrowthRecord,
  SymptomRecord,
  MedicalNoteRecord,
  MedicationRecord,
  VaccineRecord,
} from '../lib/contracts/health';

export function toConsultationRecord(
  row: Tables<'child_consultations'>
): ConsultationRecord {
  return {
    id: row.id,
    childId: row.child_id,
    authorId: row.author_id,
    date: row.consultation_date,
    doctorName: row.doctor_name,
    specialty: row.specialty,
    location: row.location,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toGrowthRecord(
  row: Tables<'child_growth_measurements'>
): GrowthRecord {
  return {
    id: row.id,
    childId: row.child_id,
    authorId: row.author_id,
    measuredOn: row.measured_on,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    headCircumferenceCm: row.head_circumference_cm,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSymptomRecord(
  row: Tables<'child_symptom_logs'>
): SymptomRecord {
  return {
    id: row.id,
    childId: row.child_id,
    authorId: row.author_id,
    occurredAt: row.occurred_at,
    symptoms: row.symptoms ?? [],
    severity: row.severity,
    temperatureC: row.temperature_c,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toMedicalNoteRecord(
  row: Tables<'child_medical_notes'>
): MedicalNoteRecord {
  return {
    id: row.id,
    childId: row.child_id,
    authorId: row.author_id,
    notedAt: row.noted_at,
    note: row.note,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toMedicationRecord(
  row: Tables<'child_medications'>
): MedicationRecord {
  return {
    id: row.id,
    childId: row.child_id,
    authorId: row.author_id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toVaccineRecord(
  row: Tables<'child_vaccines'>
): VaccineRecord {
  return {
    id: row.id,
    childId: row.child_id,
    vaccineId: row.vaccine_id,
    vaccineCode: row.vaccine_code,
    vaccineName: row.vaccine_name,
    doseLabel: row.dose_label,
    scheduledAgeMonths: row.scheduled_age_months,
    scheduledDate: row.scheduled_date,
    appliedDate: row.applied_date,
    status: row.status,
    source: row.source,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
