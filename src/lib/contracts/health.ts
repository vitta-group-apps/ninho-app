export type ConsultationRecord = {
  id: string;
  childId: string;
  authorId: string;
  date: string;
  doctorName: string | null;
  specialty: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GrowthRecord = {
  id: string;
  childId: string;
  authorId: string;
  measuredOn: string;
  weightKg: number | null;
  heightCm: number | null;
  headCircumferenceCm: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SymptomRecord = {
  id: string;
  childId: string;
  authorId: string;
  occurredAt: string;
  symptoms: string[];
  severity: string | null;
  temperatureC: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MedicalNoteRecord = {
  id: string;
  childId: string;
  authorId: string;
  notedAt: string;
  note: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MedicationRecord = {
  id: string;
  childId: string;
  authorId: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VaccineRecord = {
  id: string;
  childId: string;
  vaccineId: string;
  vaccineCode: string | null;
  vaccineName: string | null;
  doseLabel: string | null;
  scheduledAgeMonths: number | null;
  scheduledDate: string | null;
  appliedDate: string | null;
  status: string | null;
  source: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
