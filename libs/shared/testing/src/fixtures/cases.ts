/**
 * Case/Patient fixture generators
 *
 * Provides factories for creating test case and patient data
 */

/**
 * Mock patient data
 */
export interface MockPatient {
  id: string;
  clinic_id: string;
  external_id?: string;
  name: string;
  species: "dog" | "cat" | "bird" | "rabbit" | "other";
  breed?: string;
  age?: string;
  weight?: number;
  weight_unit?: "lbs" | "kg";
  owner_name: string;
  owner_phone: string;
  owner_email?: string;
  created_at: string;
  updated_at: string;
}

export function createMockPatient(
  overrides?: Partial<MockPatient>,
): MockPatient {
  const id = overrides?.id ?? `patient-${Date.now()}`;
  return {
    id,
    clinic_id: `clinic-${Date.now()}`,
    external_id: undefined,
    name: "Buddy",
    species: "dog",
    breed: "Golden Retriever",
    age: "5 years",
    weight: 65,
    weight_unit: "lbs",
    owner_name: "John Smith",
    owner_phone: "+15551234567",
    owner_email: "john.smith@example.com",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Mock case data
 */
export interface MockCase {
  id: string;
  clinic_id: string;
  patient_id: string;
  procedure_type: string;
  procedure_date: string;
  discharge_date?: string;
  status: "scheduled" | "in_progress" | "completed" | "discharged";
  veterinarian_name?: string;
  notes?: string;
  discharge_instructions?: string;
  medications?: MockMedication[];
  warning_signs?: string[];
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

export interface MockMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export function createMockMedication(
  overrides?: Partial<MockMedication>,
): MockMedication {
  return {
    name: "Carprofen",
    dosage: "50mg",
    frequency: "Twice daily",
    duration: "7 days",
    instructions: "Give with food",
    ...overrides,
  };
}

export function createMockCase(overrides?: Partial<MockCase>): MockCase {
  const id = overrides?.id ?? `case-${Date.now()}`;
  const defaultDate =
    new Date().toISOString().split("T")[0] ??
    new Date().toISOString().slice(0, 10);
  const procedureDate = overrides?.procedure_date ?? defaultDate;

  const base: MockCase = {
    id,
    clinic_id: overrides?.clinic_id ?? `clinic-${Date.now()}`,
    patient_id: overrides?.patient_id ?? `patient-${Date.now()}`,
    procedure_type: overrides?.procedure_type ?? "Dental cleaning",
    procedure_date: procedureDate,
    discharge_date: overrides?.discharge_date ?? procedureDate,
    status: overrides?.status ?? "completed",
    veterinarian_name: overrides?.veterinarian_name ?? "Dr. Smith",
    notes:
      overrides?.notes ??
      "Routine dental procedure completed without complications.",
    discharge_instructions:
      overrides?.discharge_instructions ??
      "Keep patient calm for 24 hours. Soft food only for 48 hours.",
    medications: overrides?.medications ?? [createMockMedication()],
    warning_signs: overrides?.warning_signs ?? [
      "Excessive bleeding from gums",
      "Difficulty eating after 48 hours",
      "Signs of infection (swelling, discharge)",
    ],
    follow_up_date: overrides?.follow_up_date,
    created_at: overrides?.created_at ?? new Date().toISOString(),
    updated_at: overrides?.updated_at ?? new Date().toISOString(),
  };

  return base;
}

/**
 * Create a complete case with patient
 */
export function createMockCaseWithPatient(options?: {
  caseOverrides?: Partial<MockCase>;
  patientOverrides?: Partial<MockPatient>;
}) {
  const patient = createMockPatient(options?.patientOverrides);
  const caseData = createMockCase({
    patient_id: patient.id,
    clinic_id: patient.clinic_id,
    ...options?.caseOverrides,
  });

  return {
    case: caseData,
    patient,
  };
}

/**
 * Create multiple cases for testing list views
 */
export function createMockCaseList(
  count: number,
  options?: {
    clinicId?: string;
    statuses?: MockCase["status"][];
  },
): MockCase[] {
  const statuses = options?.statuses ?? [
    "scheduled",
    "in_progress",
    "completed",
    "discharged",
  ];

  return Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);

    return createMockCase({
      id: `case-${i + 1}`,
      clinic_id: options?.clinicId ?? "clinic-1",
      status: statuses[i % statuses.length],
      procedure_date: date.toISOString().split("T")[0],
    });
  });
}
