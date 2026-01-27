/**
 * Persistence Service
 *
 * Handles all database operations for the PIMS sync service.
 * Encapsulates Supabase interactions following repository-like patterns.
 */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import type { PimsCredentials } from "@odis-ai/domain/sync";
import type {
  ScrapeType,
  ScrapedAppointment,
  ScrapedConsultation,
} from "../types";
import { persistenceLogger as logger } from "../lib/logger";
import { createSupabaseServiceClient } from "../lib/supabase";

/**
 * Result of credential lookup
 */
export interface CredentialsResult {
  credentials: PimsCredentials;
  userId: string;
}

// Type for Supabase service client - using dynamic import to avoid module boundary violations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

/**
 * Persistence Service
 *
 * Manages all database operations:
 * - Credential retrieval
 * - Session management
 * - Appointment upserts
 * - Consultation/case management
 */
export class PersistenceService {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  private supabase: SupabaseClient | null = null;

  /**
   * Get or create Supabase client
   */
  private async getClient(): Promise<SupabaseClient> {
    this.supabase ??= createSupabaseServiceClient();
    return this.supabase;
  }

  /**
   * Get clinic by ID
   */
  async getClinic(
    clinicId: string,
  ): Promise<{ id: string; name: string } | null> {
    const supabase = await this.getClient();

    const { data, error } = await supabase
      .from("clinics")
      .select("id, name")
      .eq("id", clinicId)
      .single();

    if (error || !data) {
      logger.warn(`Clinic not found: ${clinicId}`);
      return null;
    }

    return data;
  }

  /**
   * Get PIMS credentials for a clinic
   *
   * Lookup strategy:
   * 1. First try credentials directly associated with the clinic_id
   * 2. If not found, look for credentials via user_clinic_access (for users who have access to this clinic)
   */
  async getClinicCredentials(
    clinicId: string,
  ): Promise<CredentialsResult | null> {
    try {
      const { IdexxCredentialManager } =
        await import("@odis-ai/integrations/idexx");
      const credentialManager = await IdexxCredentialManager.create();
      const supabase = await this.getClient();

      // Strategy 1: Get credentials directly by clinic_id
      const { data: directCredential, error: directError } = await supabase
        .from("idexx_credentials")
        .select("user_id")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!directError && directCredential) {
        const credentials = await credentialManager.getCredentials(
          directCredential.user_id,
          clinicId,
        );

        if (credentials) {
          logger.debug(
            `Found credentials for clinic ${clinicId} via direct lookup`,
          );
          return {
            credentials,
            userId: directCredential.user_id,
          };
        }
      }

      // Strategy 2: Look for credentials via user_clinic_access
      // This handles cases where credentials were stored with clinic_id = null
      logger.debug(
        `No direct credentials for clinic ${clinicId}, trying user_clinic_access fallback`,
      );

      const { data: clinicUsers, error: usersError } = await supabase
        .from("user_clinic_access")
        .select("user_id")
        .eq("clinic_id", clinicId);

      if (usersError || !clinicUsers || clinicUsers.length === 0) {
        logger.debug(`No users found with access to clinic ${clinicId}`);
        return null;
      }

      // Check each user with clinic access for credentials
      for (const { user_id } of clinicUsers) {
        // First try credentials associated with this specific clinic
        const { data: userClinicCred } = await supabase
          .from("idexx_credentials")
          .select("user_id")
          .eq("user_id", user_id)
          .eq("clinic_id", clinicId)
          .eq("is_active", true)
          .limit(1)
          .single();

        if (userClinicCred) {
          const credentials = await credentialManager.getCredentials(
            user_id,
            clinicId,
          );
          if (credentials) {
            logger.info(
              `Found credentials for clinic ${clinicId} via user ${user_id} (clinic-specific)`,
            );
            return { credentials, userId: user_id };
          }
        }

        // Fallback: try credentials with clinic_id = null (global user credentials)
        const { data: userGlobalCred } = await supabase
          .from("idexx_credentials")
          .select("user_id")
          .eq("user_id", user_id)
          .is("clinic_id", null)
          .eq("is_active", true)
          .limit(1)
          .single();

        if (userGlobalCred) {
          // For global credentials, don't pass clinicId to getCredentials
          const credentials = await credentialManager.getCredentials(
            user_id,
            null,
          );
          if (credentials) {
            logger.info(
              `Found credentials for clinic ${clinicId} via user ${user_id} (global credentials)`,
            );
            return { credentials, userId: user_id };
          }
        }
      }

      logger.warn(`No credentials found for clinic ${clinicId} after fallback`);
      return null;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error getting credentials for clinic ${clinicId}: ${msg}`);
      return null;
    }
  }

  /**
   * Create a new scrape session
   */
  async createSession(
    userId: string,
    clinicId: string,
    type: ScrapeType,
  ): Promise<string | null> {
    const supabase = await this.getClient();

    const { data, error } = await supabase
      .from("idexx_sync_sessions")
      .insert({
        user_id: userId,
        clinic_id: clinicId,
        session_type:
          type === "schedule" ? "appointment_sync" : "consultation_sync",
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) {
      logger.error(
        `Failed to create session for clinic ${clinicId}: ${error?.message}`,
      );
      return null;
    }

    logger.info(
      `Created scrape session ${data.id} for clinic ${clinicId} (${type})`,
    );
    return data.id;
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string,
    status: "completed" | "failed",
    data: {
      appointmentsSynced?: number;
      consultationsSynced?: number;
      errorMessage?: string;
    } = {},
  ): Promise<void> {
    const supabase = await this.getClient();

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    if (data.appointmentsSynced !== undefined) {
      updateData.appointments_synced = data.appointmentsSynced;
    }

    if (data.consultationsSynced !== undefined) {
      updateData.consultations_synced = data.consultationsSynced;
    }

    if (data.errorMessage) {
      updateData.error_message = data.errorMessage;
    }

    await supabase
      .from("idexx_sync_sessions")
      .update(updateData)
      .eq("id", sessionId);

    logger.debug(`Updated session ${sessionId} status to ${status}`);
  }

  /**
   * Upsert appointments to schedule_appointments table
   *
   * @deprecated Use ScheduleSyncService for full sync operations.
   * This method is kept for backward compatibility with consultation scraping.
   */
  async upsertAppointments(
    clinicId: string,
    sessionId: string,
    appointments: ScrapedAppointment[],
  ): Promise<{ synced: number; errors: string[] }> {
    const supabase = await this.getClient();
    const errors: string[] = [];
    let synced = 0;

    // Log first appointment for debugging
    if (appointments.length > 0) {
      logger.debug(
        `Sample appointment data: ${JSON.stringify(appointments[0])}`,
      );
    }

    for (const appointment of appointments) {
      try {
        // Skip appointments without neo_appointment_id (required for upsert)
        if (!appointment.neo_appointment_id) {
          logger.debug(
            `Skipping appointment without neo_appointment_id: ${appointment.patient_name}`,
          );
          continue;
        }

        // Normalize time to HH:MM:SS format
        const startTime = this.normalizeTime24(appointment.start_time);
        const endTime = appointment.end_time
          ? this.normalizeTime24(appointment.end_time)
          : startTime;

        const { error } = await supabase.from("schedule_appointments").upsert(
          {
            clinic_id: clinicId,
            neo_appointment_id: appointment.neo_appointment_id,
            date: appointment.date,
            start_time: startTime,
            end_time: endTime,
            patient_name: appointment.patient_name,
            client_name: appointment.client_name,
            client_phone: appointment.client_phone,
            provider_name: appointment.provider_name,
            appointment_type: appointment.appointment_type,
            status: appointment.status ?? "scheduled",
            last_synced_at: new Date().toISOString(),
          },
          {
            onConflict: "clinic_id,neo_appointment_id",
          },
        );

        if (error) {
          logger.error(
            `Failed to upsert appointment ${appointment.neo_appointment_id}: ${error.message}`,
          );
          errors.push(`Failed to upsert appointment: ${error.message}`);
        } else {
          synced++;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error(`Exception upserting appointment: ${msg}`);
        errors.push(`Error upserting appointment: ${msg}`);
      }
    }

    logger.info(
      `Upserted ${synced}/${appointments.length} appointments for clinic ${clinicId}`,
    );

    if (errors.length > 0) {
      logger.warn(`${errors.length} errors during appointment upsert`);
    }

    return { synced, errors };
  }

  /**
   * Normalize time to HH:MM:SS format
   */
  private normalizeTime24(timeStr: string): string {
    const match = /(\d{1,2}):(\d{2})\s*(am|pm)?/i.exec(timeStr);

    if (!match) {
      const parts = timeStr.split(":");
      if (parts.length === 2) {
        return `${timeStr}:00`;
      }
      return timeStr;
    }

    let hours = parseInt(match[1] ?? "0", 10);
    const minutes = match[2] ?? "00";
    const meridiem = match[3]?.toLowerCase();

    if (meridiem === "pm" && hours !== 12) {
      hours += 12;
    } else if (meridiem === "am" && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
  }

  /**
   * Upsert consultation data and link to cases
   */
  async upsertConsultations(
    clinicId: string,
    sessionId: string,
    consultations: ScrapedConsultation[],
  ): Promise<{ synced: number; errors: string[] }> {
    const supabase = await this.getClient();
    const errors: string[] = [];
    let synced = 0;

    for (const consultation of consultations) {
      if (!consultation.has_notes || !consultation.clinical_notes) {
        continue;
      }

      try {
        // Find or create case
        const caseId = await this.findOrCreateCase(
          supabase,
          clinicId,
          consultation,
        );

        if (!caseId) {
          errors.push(`Could not find or create case for consultation`);
          continue;
        }

        // Track consultation sync status
        const consultationIdToUse =
          consultation.neo_consultation_id ?? `unknown-${Date.now()}`;

        await supabase.from("consultation_sync_status").upsert(
          {
            neo_consultation_id: consultationIdToUse,
            sync_session_id: sessionId,
            case_id: caseId,
            status: "synced",
            synced_at: new Date().toISOString(),
          },
          {
            onConflict: "neo_consultation_id",
          },
        );

        synced++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        errors.push(`Error processing consultation: ${msg}`);
      }
    }

    logger.info(
      `Upserted ${synced}/${consultations.length} consultations for clinic ${clinicId}`,
    );
    return { synced, errors };
  }

  /**
   * Find existing case or create new one for consultation
   */
  private async findOrCreateCase(
    supabase: SupabaseClient,
    clinicId: string,
    consultation: ScrapedConsultation,
  ): Promise<string | null> {
    // Try to find by appointment ID in schedule_appointments
    if (consultation.neo_appointment_id) {
      const { data: appointment } = await supabase
        .from("schedule_appointments")
        .select("id")
        .eq("clinic_id", clinicId)
        .eq("neo_appointment_id", consultation.neo_appointment_id)
        .is("deleted_at", null)
        .single();

      if (appointment) {
        const { data: cases } = await supabase
          .from("cases")
          .select("id")
          .eq("scheduled_at", `${consultation.date}T00:00:00Z`)
          .limit(1);

        if (cases && cases.length > 0 && cases[0]?.id) {
          await this.updateCaseWithIdexxData(
            supabase,
            cases[0].id,
            consultation,
          );
          return cases[0].id;
        }
      }
    }

    // Try to find by patient name
    if (consultation.patient_name) {
      const { data: patients } = await supabase
        .from("patients")
        .select("case_id")
        .ilike("name", `%${consultation.patient_name}%`)
        .limit(1);

      if (patients && patients.length > 0 && patients[0]?.case_id) {
        await this.updateCaseWithIdexxData(
          supabase,
          patients[0].case_id,
          consultation,
        );
        return patients[0].case_id;
      }
    }

    // Create new case
    const { data: newCase, error } = await supabase
      .from("cases")
      .insert({
        source: "idexx_neo",
        external_id: consultation.neo_consultation_id,
        status: "ongoing",
        scheduled_at: `${consultation.date}T00:00:00Z`,
        metadata: this.buildConsultationMetadata(consultation),
      })
      .select("id")
      .single();

    if (error) {
      logger.error(`Failed to create case: ${error.message}`);
      return null;
    }

    return newCase?.id ?? null;
  }

  /**
   * Update existing case with IDEXX consultation data
   */
  private async updateCaseWithIdexxData(
    supabase: SupabaseClient,
    caseId: string,
    consultation: ScrapedConsultation,
  ): Promise<void> {
    await supabase
      .from("cases")
      .update({
        metadata: this.buildConsultationMetadata(consultation),
      })
      .eq("id", caseId);
  }

  /**
   * Build metadata object for consultation
   */
  private buildConsultationMetadata(
    consultation: ScrapedConsultation,
  ): Record<string, unknown> {
    return {
      idexx_consultation_id: consultation.neo_consultation_id,
      idexx_notes: consultation.clinical_notes,
      idexx_vitals: consultation.vitals,
      idexx_diagnoses: consultation.diagnoses,
      synced_at: new Date().toISOString(),
    };
  }

  /**
   * Get last scrape session for status endpoint
   */
  async getLastSession(): Promise<{
    session_type: string;
    status: string;
    completed_at: string | null;
    started_at: string;
    appointments_synced: number;
    consultations_synced: number;
    error_message: string | null;
  } | null> {
    const supabase = await this.getClient();

    const { data, error } = await supabase
      .from("idexx_sync_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error(`Failed to get last session: ${error.message}`);
      throw error;
    }

    return data;
  }
}
