/**
 * Client Identity Module
 *
 * Handles resolution of clinic context and creation/lookup of
 * clients (pet owners) and canonical patients (unique pets).
 *
 * This module bridges the legacy user-scoped data model with the
 * new clinic-scoped architecture.
 */

import type { SupabaseClientType } from "@odis-ai/shared/types/supabase";
import type { NormalizedEntities } from "@odis-ai/shared/validators";

/**
 * Clinic context for a user
 */
export interface ClinicContext {
  clinicId: string;
  clinicName: string | null;
}

/**
 * Client identity result
 */
export interface ClientIdentityResult {
  clientId: string;
  canonicalPatientId: string;
  clinicId: string;
  isNewClient: boolean;
  isNewPatient: boolean;
}

/**
 * Get clinic context for a user
 * Returns the user's primary clinic, or null if not found
 */
export async function getClinicContextForUser(
  supabase: SupabaseClientType,
  userId: string,
): Promise<ClinicContext | null> {
  const { data, error } = await supabase
    .from("user_clinic_access")
    .select(
      `
      clinic_id,
      clinics:clinic_id (
        name
      )
    `,
    )
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();

  if (error || !data) {
    console.warn("[ClientIdentity] No clinic context found for user", {
      userId,
      error: error?.message,
    });
    return null;
  }

  const clinicData = data.clinics as { name: string } | null;

  return {
    clinicId: data.clinic_id,
    clinicName: clinicData?.name ?? null,
  };
}

/**
 * Find or create client (pet owner) for a clinic
 * Matches by phone (preferred) or name (fallback)
 */
export async function findOrCreateClient(
  supabase: SupabaseClientType,
  clinicId: string,
  ownerInfo: {
    name: string | null;
    phone: string | null;
    email: string | null;
  },
): Promise<{ clientId: string; isNew: boolean }> {
  const displayName = ownerInfo.name || "Unknown Owner";

  // 1. Try to find by phone (most reliable)
  if (ownerInfo.phone) {
    const { data: byPhone } = await supabase
      .from("clients")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("phone", ownerInfo.phone)
      .maybeSingle();

    if (byPhone) {
      console.log("[ClientIdentity] Found existing client by phone", {
        clientId: byPhone.id,
      });

      // Update contact info if needed
      if (ownerInfo.email || ownerInfo.name) {
        await supabase
          .from("clients")
          .update({
            ...(ownerInfo.email ? { email: ownerInfo.email } : {}),
            ...(ownerInfo.name ? { display_name: ownerInfo.name } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("id", byPhone.id);
      }

      return { clientId: byPhone.id, isNew: false };
    }
  }

  // 2. Try to find by name (case-insensitive)
  const { data: byName } = await supabase
    .from("clients")
    .select("id")
    .eq("clinic_id", clinicId)
    .ilike("display_name", displayName)
    .maybeSingle();

  if (byName) {
    console.log("[ClientIdentity] Found existing client by name", {
      clientId: byName.id,
    });

    // Update contact info if provided
    if (ownerInfo.phone || ownerInfo.email) {
      await supabase
        .from("clients")
        .update({
          ...(ownerInfo.phone ? { phone: ownerInfo.phone } : {}),
          ...(ownerInfo.email ? { email: ownerInfo.email } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", byName.id);
    }

    return { clientId: byName.id, isNew: false };
  }

  // 3. Create new client
  const { data: newClient, error } = await supabase
    .from("clients")
    .insert({
      clinic_id: clinicId,
      display_name: displayName,
      phone: ownerInfo.phone,
      email: ownerInfo.email,
    })
    .select("id")
    .single();

  if (error || !newClient) {
    throw new Error(`Failed to create client: ${error?.message}`);
  }

  console.log("[ClientIdentity] Created new client", {
    clientId: newClient.id,
    displayName,
  });

  return { clientId: newClient.id, isNew: true };
}

/**
 * Find or create canonical patient for a client
 * Matches by client + name (case-insensitive)
 */
export async function findOrCreateCanonicalPatient(
  supabase: SupabaseClientType,
  clinicId: string,
  clientId: string,
  patientInfo: {
    name: string;
    species: string | null;
    breed: string | null;
    sex: string | null;
    dateOfBirth?: string | null;
  },
): Promise<{ canonicalPatientId: string; isNew: boolean }> {
  // Try to find existing patient by client + name
  const { data: existing } = await supabase
    .from("canonical_patients")
    .select("id, visit_count")
    .eq("client_id", clientId)
    .ilike("name", patientInfo.name)
    .maybeSingle();

  if (existing) {
    console.log("[ClientIdentity] Found existing canonical patient", {
      canonicalPatientId: existing.id,
      visitCount: existing.visit_count,
    });

    // Record the visit and update demographics
    await supabase
      .from("canonical_patients")
      .update({
        last_visit_at: new Date().toISOString(),
        visit_count: (existing.visit_count ?? 0) + 1,
        // Update demographics if not set
        ...(patientInfo.species ? { species: patientInfo.species } : {}),
        ...(patientInfo.breed ? { breed: patientInfo.breed } : {}),
        ...(patientInfo.sex ? { sex: patientInfo.sex } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    return { canonicalPatientId: existing.id, isNew: false };
  }

  // Create new canonical patient
  const { data: newPatient, error } = await supabase
    .from("canonical_patients")
    .insert({
      clinic_id: clinicId,
      client_id: clientId,
      name: patientInfo.name,
      species: patientInfo.species,
      breed: patientInfo.breed,
      sex: patientInfo.sex,
      date_of_birth: patientInfo.dateOfBirth ?? null,
      first_visit_at: new Date().toISOString(),
      last_visit_at: new Date().toISOString(),
      visit_count: 1,
    })
    .select("id")
    .single();

  if (error || !newPatient) {
    throw new Error(`Failed to create canonical patient: ${error?.message}`);
  }

  console.log("[ClientIdentity] Created new canonical patient", {
    canonicalPatientId: newPatient.id,
    patientName: patientInfo.name,
  });

  return { canonicalPatientId: newPatient.id, isNew: true };
}

/**
 * Resolve full client identity chain for a case
 * Returns clinic, client, and canonical patient IDs
 */
export async function resolveClientIdentity(
  supabase: SupabaseClientType,
  userId: string,
  entities: NormalizedEntities,
): Promise<ClientIdentityResult | null> {
  // 1. Get clinic context
  const clinicContext = await getClinicContextForUser(supabase, userId);

  if (!clinicContext) {
    console.warn(
      "[ClientIdentity] No clinic context, skipping identity resolution",
    );
    return null;
  }

  // 2. Find or create client
  const clientResult = await findOrCreateClient(
    supabase,
    clinicContext.clinicId,
    {
      name: entities.patient.owner.name ?? null,
      phone: entities.patient.owner.phone ?? null,
      email: entities.patient.owner.email ?? null,
    },
  );

  // 3. Find or create canonical patient
  const patientResult = await findOrCreateCanonicalPatient(
    supabase,
    clinicContext.clinicId,
    clientResult.clientId,
    {
      name: entities.patient.name,
      species: entities.patient.species ?? null,
      breed: entities.patient.breed ?? null,
      sex: entities.patient.sex ?? null,
    },
  );

  return {
    clinicId: clinicContext.clinicId,
    clientId: clientResult.clientId,
    canonicalPatientId: patientResult.canonicalPatientId,
    isNewClient: clientResult.isNew,
    isNewPatient: patientResult.isNew,
  };
}
