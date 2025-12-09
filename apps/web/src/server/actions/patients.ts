"use server";

import { createClient } from "@odis/db/server";
import { getUser } from "./auth";
import {
  createPatientSchema,
  updatePatientSchema,
  getPatientSchema,
  deletePatientSchema,
  type CreatePatientInput,
  type UpdatePatientInput,
  type GetPatientInput,
  type DeletePatientInput,
} from "@odis/retell/validators";
import type { CallPatient } from "~/types/patient";

/**
 * Check if user is admin
 */
async function checkAdminAccess() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized: You must be logged in");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

/**
 * Create a new patient
 *
 * Automatically associates patient with current user via user_id.
 * RLS policies ensure users can only access their own patients.
 */
export async function createPatient(input: CreatePatientInput) {
  try {
    // Validate input
    const validatedInput = createPatientSchema.parse(input);

    // Check admin access
    const user = await checkAdminAccess();

    // Create Supabase client
    const supabase = await createClient();

    // Insert patient
    const { data, error } = await supabase
      .from("call_patients")
      .insert({
        user_id: user.id,
        pet_name: validatedInput.pet_name,
        owner_name: validatedInput.owner_name,
        owner_phone: validatedInput.owner_phone,
        vet_name: validatedInput.vet_name ?? null,
        clinic_name: validatedInput.clinic_name ?? null,
        clinic_phone: validatedInput.clinic_phone ?? null,
        discharge_summary: validatedInput.discharge_summary ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating patient:", error);
      throw new Error(`Failed to create patient: ${error.message}`);
    }

    return { success: true, data: data as CallPatient };
  } catch (error) {
    console.error("Error in createPatient:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to create patient" };
  }
}

/**
 * Update an existing patient
 *
 * RLS policies ensure users can only update their own patients.
 */
export async function updatePatient(input: UpdatePatientInput) {
  try {
    // Validate input
    const validatedInput = updatePatientSchema.parse(input);

    // Check admin access
    await checkAdminAccess();

    // Create Supabase client
    const supabase = await createClient();

    // Build update object with only provided fields
    const updateData: Partial<CallPatient> = {};
    if (validatedInput.pet_name !== undefined)
      updateData.pet_name = validatedInput.pet_name;
    if (validatedInput.owner_name !== undefined)
      updateData.owner_name = validatedInput.owner_name;
    if (validatedInput.owner_phone !== undefined)
      updateData.owner_phone = validatedInput.owner_phone;
    if (validatedInput.vet_name !== undefined)
      updateData.vet_name = validatedInput.vet_name;
    if (validatedInput.clinic_name !== undefined)
      updateData.clinic_name = validatedInput.clinic_name;
    if (validatedInput.clinic_phone !== undefined)
      updateData.clinic_phone = validatedInput.clinic_phone;
    if (validatedInput.discharge_summary !== undefined)
      updateData.discharge_summary = validatedInput.discharge_summary;

    // Update patient
    const { data, error } = await supabase
      .from("call_patients")
      .update(updateData)
      .eq("id", validatedInput.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating patient:", error);
      throw new Error(`Failed to update patient: ${error.message}`);
    }

    return { success: true, data: data as CallPatient };
  } catch (error) {
    console.error("Error in updatePatient:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to update patient" };
  }
}

/**
 * Delete a patient
 *
 * RLS policies ensure users can only delete their own patients.
 * Linked calls will have patient_id set to NULL (ON DELETE SET NULL).
 */
export async function deletePatient(input: DeletePatientInput) {
  try {
    // Validate input
    const validatedInput = deletePatientSchema.parse(input);

    // Check admin access
    await checkAdminAccess();

    // Create Supabase client
    const supabase = await createClient();

    // Delete patient
    const { error } = await supabase
      .from("call_patients")
      .delete()
      .eq("id", validatedInput.patientId);

    if (error) {
      console.error("Error deleting patient:", error);
      throw new Error(`Failed to delete patient: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deletePatient:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to delete patient" };
  }
}

/**
 * Get a single patient by ID
 *
 * RLS policies ensure users can only fetch their own patients.
 */
export async function fetchPatient(input: GetPatientInput) {
  try {
    // Validate input
    const validatedInput = getPatientSchema.parse(input);

    // Check admin access
    await checkAdminAccess();

    // Create Supabase client
    const supabase = await createClient();

    // Fetch patient
    const { data, error } = await supabase
      .from("call_patients")
      .select("*")
      .eq("id", validatedInput.patientId)
      .single();

    if (error) {
      console.error("Error fetching patient:", error);
      throw new Error(`Failed to fetch patient: ${error.message}`);
    }

    return { success: true, data: data as CallPatient };
  } catch (error) {
    console.error("Error in fetchPatient:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to fetch patient" };
  }
}

/**
 * List all patients for the current user
 *
 * RLS policies automatically filter to user's own patients.
 * Sorted by most recently updated first.
 */
export async function fetchPatients() {
  try {
    // Check admin access
    await checkAdminAccess();

    // Create Supabase client
    const supabase = await createClient();

    // Fetch all patients for this user
    const { data, error } = await supabase
      .from("call_patients")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching patients:", error);
      throw new Error(`Failed to fetch patients: ${error.message}`);
    }

    return { success: true, data: (data as CallPatient[]) ?? [] };
  } catch (error) {
    console.error("Error in fetchPatients:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to fetch patients" };
  }
}
