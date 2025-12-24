import {
  getSupabaseClient,
  logger,
  getCurrentISOString,
} from "@odis-ai/extension/shared";
import type { ScheduleAppointment } from "../extraction/schedule-extractor";
import type { Database } from "@odis-ai/shared/types";

const odisLogger = logger.child("[ODIS]");

type Patient = Database["public"]["Tables"]["patients"]["Row"];
type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];

/**
 * Patient sync result
 */
export interface PatientSyncResult {
  patient: Patient;
  created: boolean; // true if new patient, false if updated existing
}

/**
 * Upsert a patient from IDEXX appointment data
 * Dual-mode deduplication:
 * - IDEXX mode: Upsert by (external_id + source)
 * - Manual mode: Always create new (external_id = null)
 */
export const upsertPatientFromAppointment = async (
  userId: string,
  appointment: ScheduleAppointment,
): Promise<PatientSyncResult> => {
  const supabase = getSupabaseClient();

  // Determine if this is an IDEXX patient or manual
  const isIdexxPatient =
    appointment.extractedFrom === "api" && appointment.patient.id;

  // Prepare patient data
  const patientData: PatientInsert = {
    user_id: userId,
    name: appointment.patient.name || "Unknown Patient",
    species: appointment.patient.species,
    breed: appointment.patient.breed,
    sex: null, // Not provided in appointment data
    date_of_birth: null, // Not provided in appointment data
    weight_kg: null, // Not provided in appointment data
    owner_name: appointment.client.name,
    owner_phone: appointment.client.phone,
    owner_email: appointment.client.email,
  };

  try {
    if (isIdexxPatient) {
      // IDEXX mode: Upsert by name + species + owner_name (since patients table doesn't have external_id)
      odisLogger.debug("Upserting IDEXX patient", {
        name: patientData.name,
        species: patientData.species,
        owner_name: patientData.owner_name,
      });

      // Since patients table doesn't have external_id or source, use name + species + owner_name for deduplication
      // First try to find existing patient
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", userId)
        .eq("name", patientData.name)
        .eq("species", patientData.species || "")
        .eq("owner_name", patientData.owner_name || "")
        .maybeSingle();

      let data: Patient;
      let created: boolean;

      if (existingPatient) {
        // Update existing patient
        const { data: updated, error } = await supabase
          .from("patients")
          .update(patientData)
          .eq("id", existingPatient.id)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to update IDEXX patient: ${error.message}`);
        }

        data = updated;
        created = false;
      } else {
        // Insert new patient
        const { data: inserted, error } = await supabase
          .from("patients")
          .insert(patientData)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to insert IDEXX patient: ${error.message}`);
        }

        data = inserted;
        created = true;
      }

      odisLogger.info(
        `${created ? "✅ Created" : "🔄 Updated"} IDEXX patient`,
        { patientId: data.id, created },
      );

      return { patient: data, created };
    } else {
      // Manual mode: Always create new patient
      odisLogger.debug("Creating manual patient", { name: patientData.name });

      const { data, error } = await supabase
        .from("patients")
        .insert(patientData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create manual patient: ${error.message}`);
      }

      odisLogger.info("✅ Created manual patient", { patientId: data.id });

      return { patient: data, created: true };
    }
  } catch (error) {
    odisLogger.error("❌ Patient sync failed", { error });
    throw error;
  }
};

/**
 * Get or create a patient for an appointment
 * Wrapper around upsertPatientFromAppointment that handles errors gracefully
 */
export const getOrCreatePatient = async (
  userId: string,
  appointment: ScheduleAppointment,
): Promise<Patient | null> => {
  try {
    const result = await upsertPatientFromAppointment(userId, appointment);
    return result.patient;
  } catch (error) {
    odisLogger.error("Failed to get or create patient", { error });
    return null;
  }
};

/**
 * Update patient contact information from latest appointment data
 * Useful when owner's phone/email has changed
 */
export const updatePatientContactInfo = async (
  patientId: string,
  contactInfo: {
    owner_name?: string | null;
    owner_phone?: string | null;
    owner_email?: string | null;
  },
): Promise<void> => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("patients")
    .update({
      owner_name: contactInfo.owner_name,
      owner_phone: contactInfo.owner_phone,
      owner_email: contactInfo.owner_email,
      updated_at: getCurrentISOString(),
    })
    .eq("id", patientId);

  if (error) {
    odisLogger.error("Failed to update patient contact info", { error });
    throw error;
  }

  odisLogger.info("✅ Updated patient contact info", { patientId });
};

/**
 * Find existing IDEXX patient by external ID
 */
export const findIdexxPatient = async (
  externalId: string,
): Promise<Patient | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("source", "idexx_neo")
    .eq("external_id", externalId)
    .maybeSingle();

  if (error) {
    odisLogger.error("Error finding IDEXX patient", { error });
    return null;
  }

  return data;
};

/**
 * Get patient statistics for the current user
 */
export const getPatientStats = async (
  userId: string,
): Promise<{
  total: number;
  idexx: number;
  manual: number;
}> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("patients")
    .select("source")
    .eq("user_id", userId);

  if (error) {
    odisLogger.error("Error fetching patient stats", { error });
    return { total: 0, idexx: 0, manual: 0 };
  }

  const stats = {
    total: data.length,
    idexx: data.filter((p) => p.source === "idexx_neo").length,
    manual: data.filter((p) => p.source === "manual").length,
  };

  return stats;
};
