/**
 * Patient types for call management system
 * Corresponds to call_patients table in Supabase
 */

export interface CallPatient {
  id: string;
  user_id: string;

  // Pet Information
  pet_name: string;

  // Owner Information
  owner_name: string;
  owner_phone: string; // E.164 format

  // Vet/Clinic Information (optional)
  vet_name: string | null;
  clinic_name: string | null;
  clinic_phone: string | null;

  // Medical Information (optional)
  discharge_summary: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface CreatePatientInput {
  pet_name: string;
  owner_name: string;
  owner_phone: string;
  vet_name?: string;
  clinic_name?: string;
  clinic_phone?: string;
  discharge_summary?: string;
}

export interface UpdatePatientInput {
  pet_name?: string;
  owner_name?: string;
  owner_phone?: string;
  vet_name?: string | null;
  clinic_name?: string | null;
  clinic_phone?: string | null;
  discharge_summary?: string | null;
}

/**
 * Extended call type that includes patient information
 */
export interface CallWithPatient {
  // ... existing call fields
  patient_id: string | null;
  patient?: CallPatient | null;
}
