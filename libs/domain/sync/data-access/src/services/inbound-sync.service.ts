/**
 * Inbound Sync Service
 * Synchronizes appointments from PIMS to local database
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";
import type {
  IPimsProvider,
  PimsAppointment,
  InboundSyncOptions,
  SyncResult,
  SyncStats,
} from "../types";
import { createLogger } from "@odis-ai/shared/logger";

const logger = createLogger("inbound-sync");

/**
 * InboundSyncService - Synchronizes PIMS appointments to database
 *
 * Responsibilities:
 * - Fetch appointments from PIMS provider
 * - Create/update appointment records in database
 * - Track sync statistics and audit trail
 */
export class InboundSyncService {
  constructor(
    private supabase: SupabaseClient<Database>,
    private provider: IPimsProvider,
    private clinicId: string,
  ) {}

  /**
   * Sync appointments for a date range
   */
  async sync(options?: InboundSyncOptions): Promise<SyncResult> {
    const syncId = crypto.randomUUID();
    const startTime = Date.now();
    const errors: Array<{
      message: string;
      context?: Record<string, unknown>;
    }> = [];

    logger.info("Starting inbound sync", {
      syncId,
      clinicId: this.clinicId,
      provider: this.provider.name,
      options,
    });

    const stats: SyncStats = {
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    };

    try {
      // Determine date range
      const { start, end } = this.getDateRange(options);

      // Fetch appointments from PIMS
      const appointments = await this.provider.fetchAppointments(start, end);
      stats.total = appointments.length;

      logger.info("Fetched appointments from PIMS", {
        syncId,
        count: appointments.length,
        dateRange: { start: start.toISOString(), end: end.toISOString() },
      });

      // Process each appointment
      for (const appointment of appointments) {
        try {
          const result = await this.processAppointment(appointment);

          if (result === "created") {
            stats.created++;
          } else if (result === "updated") {
            stats.updated++;
          } else {
            stats.skipped++;
          }
        } catch (error) {
          stats.failed++;
          const message =
            error instanceof Error ? error.message : "Unknown error";
          errors.push({
            message: `Failed to process appointment ${appointment.id}: ${message}`,
            context: { appointmentId: appointment.id },
          });
          logger.error("Failed to process appointment", {
            syncId,
            appointmentId: appointment.id,
            error: message,
          });
        }
      }

      // Record sync audit
      await this.recordSyncAudit(syncId, "inbound", stats, errors.length === 0);

      const durationMs = Date.now() - startTime;

      logger.info("Inbound sync completed", {
        syncId,
        stats,
        durationMs,
        hasErrors: errors.length > 0,
      });

      return {
        success: errors.length === 0,
        syncId,
        stats,
        durationMs,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const durationMs = Date.now() - startTime;

      logger.error("Inbound sync failed", {
        syncId,
        error: message,
        durationMs,
      });

      // Record failed sync audit
      await this.recordSyncAudit(syncId, "inbound", stats, false, message);

      return {
        success: false,
        syncId,
        stats,
        durationMs,
        errors: [{ message }],
      };
    }
  }

  /**
   * Process a single appointment
   */
  private async processAppointment(
    appointment: PimsAppointment,
  ): Promise<"created" | "updated" | "skipped"> {
    // Build external ID for idempotency
    const externalId = `pims-appt-${this.provider.name.toLowerCase().replace(/\s+/g, "-")}-${appointment.id}`;

    // Check if appointment already exists
    const { data: existing } = await this.supabase
      .from("cases")
      .select("id, metadata, updated_at")
      .eq("external_id", externalId)
      .eq("clinic_id", this.clinicId)
      .maybeSingle();

    // Build metadata from appointment
    const metadata = this.buildAppointmentMetadata(appointment);

    if (existing) {
      // Update if data has changed
      const existingMeta = existing.metadata as Record<string, unknown> | null;
      const existingPimsData = existingMeta?.pimsAppointment as
        | PimsAppointment
        | undefined;

      // Simple comparison - check if key fields changed
      if (this.appointmentChanged(existingPimsData, appointment)) {
        const { error } = await this.supabase
          .from("cases")
          .update({
            metadata:
              metadata as unknown as Database["public"]["Tables"]["cases"]["Update"]["metadata"],
            scheduled_at: appointment.startTime?.toISOString() ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          throw new Error(`Failed to update case: ${error.message}`);
        }

        logger.debug("Updated existing appointment", {
          caseId: existing.id,
          externalId,
          appointmentId: appointment.id,
        });

        return "updated";
      }

      return "skipped";
    }

    // Create new case for this appointment
    const { error } = await this.supabase.from("cases").insert({
      external_id: externalId,
      clinic_id: this.clinicId,
      source: `pims:${this.provider.name.toLowerCase().replace(/\s+/g, "-")}`,
      status: this.mapAppointmentStatus(appointment.status),
      type: this.mapAppointmentType(appointment.type),
      scheduled_at: appointment.startTime?.toISOString() ?? null,
      metadata:
        metadata as unknown as Database["public"]["Tables"]["cases"]["Insert"]["metadata"],
      visibility: "private", // Clinic-internal cases are private
    });

    if (error) {
      throw new Error(`Failed to create case: ${error.message}`);
    }

    logger.debug("Created new case from appointment", {
      externalId,
      appointmentId: appointment.id,
      patientName: appointment.patient.name,
    });

    return "created";
  }

  /**
   * Build metadata object from PIMS appointment
   */
  private buildAppointmentMetadata(
    appointment: PimsAppointment,
  ): Record<string, unknown> {
    return {
      pimsAppointment: appointment,
      entities: {
        patient: {
          name: appointment.patient.name ?? "Unknown",
          species: this.normalizeSpecies(appointment.patient.species),
          breed: appointment.patient.breed ?? undefined,
          owner: {
            name: appointment.client.name ?? "Unknown",
            phone: appointment.client.phone ?? undefined,
            email: appointment.client.email ?? undefined,
          },
        },
        clinical: {
          visitReason: appointment.reason ?? undefined,
        },
        caseType: this.mapAppointmentType(appointment.type) ?? "unknown",
        confidence: {
          overall: 0.9, // High confidence from structured data
          patient: 0.95,
          clinical: 0.85,
        },
        extractedAt: new Date().toISOString(),
      },
      syncedAt: new Date().toISOString(),
      syncSource: this.provider.name,
    };
  }

  /**
   * Check if appointment data has changed
   */
  private appointmentChanged(
    existing: PimsAppointment | undefined,
    incoming: PimsAppointment,
  ): boolean {
    if (!existing) return true;

    // Compare key fields
    return (
      existing.status !== incoming.status ||
      existing.consultationId !== incoming.consultationId ||
      existing.reason !== incoming.reason ||
      existing.patient.name !== incoming.patient.name ||
      existing.client.phone !== incoming.client.phone
    );
  }

  /**
   * Map PIMS appointment status to case status
   * Maps to existing CaseStatus enum: reviewed | ongoing | completed | draft
   */
  private mapAppointmentStatus(
    status: string,
  ): Database["public"]["Enums"]["CaseStatus"] {
    const statusMap: Record<string, Database["public"]["Enums"]["CaseStatus"]> =
      {
        scheduled: "draft",
        confirmed: "draft",
        "checked-in": "ongoing",
        "in-progress": "ongoing",
        completed: "completed",
        discharged: "completed",
        cancelled: "reviewed",
        "no-show": "reviewed",
      };

    const normalized = status.toLowerCase().replace(/[_\s]+/g, "-");
    return statusMap[normalized] ?? "draft";
  }

  /**
   * Map PIMS appointment type to case type
   * Maps to existing CaseType enum: checkup | emergency | surgery | follow_up
   */
  private mapAppointmentType(
    type: string | null,
  ): Database["public"]["Enums"]["CaseType"] {
    if (!type) return "checkup";

    const typeMap: Record<string, Database["public"]["Enums"]["CaseType"]> = {
      exam: "checkup",
      checkup: "checkup",
      "well-visit": "checkup",
      wellness: "checkup",
      vaccination: "checkup",
      vaccine: "checkup",
      surgery: "surgery",
      dental: "surgery",
      emergency: "emergency",
      urgent: "emergency",
      "follow-up": "follow_up",
      recheck: "follow_up",
      diagnostic: "checkup",
      consultation: "checkup",
    };

    const normalized = type.toLowerCase().replace(/[_\s]+/g, "-");
    return typeMap[normalized] ?? "checkup";
  }

  /**
   * Normalize species string to valid enum
   */
  private normalizeSpecies(
    species: string | null,
  ): "dog" | "cat" | "bird" | "rabbit" | "other" | "unknown" {
    if (!species) return "unknown";

    const normalized = species.toLowerCase();

    if (normalized.includes("dog") || normalized.includes("canine"))
      return "dog";
    if (normalized.includes("cat") || normalized.includes("feline"))
      return "cat";
    if (normalized.includes("bird") || normalized.includes("avian"))
      return "bird";
    if (normalized.includes("rabbit") || normalized.includes("bunny"))
      return "rabbit";

    return "other";
  }

  /**
   * Get date range for sync
   */
  private getDateRange(options?: InboundSyncOptions): {
    start: Date;
    end: Date;
  } {
    if (options?.dateRange) {
      return options.dateRange;
    }

    // Default: today + next 7 days
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Record sync audit in database
   */
  private async recordSyncAudit(
    syncId: string,
    syncType: "inbound" | "cases" | "reconciliation",
    stats: SyncStats,
    success: boolean,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.supabase.from("case_sync_audits").insert({
        id: syncId,
        clinic_id: this.clinicId,
        sync_type: syncType,
        appointments_found: stats.total,
        cases_created: stats.created,
        cases_updated: stats.updated,
        cases_skipped: stats.skipped,
        cases_deleted: stats.deleted ?? 0,
        status: success ? "completed" : "failed",
        error_message: errorMessage ?? null,
      });
    } catch (error) {
      logger.error("Failed to record sync audit", {
        syncId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
