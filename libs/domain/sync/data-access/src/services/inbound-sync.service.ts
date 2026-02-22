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
} from "../types.js";
import { createLogger } from "@odis-ai/shared/logger";
import {
  createPatientFromPimsAppointment,
  updatePatientFromPimsAppointment,
} from "@odis-ai/domain/cases";
import {
  createSyncAudit,
  recordSyncAudit,
  mapAppointmentStatus,
  mapAppointmentType,
  buildPimsExternalId,
  buildPimsSource,
  asCaseInsertMetadata,
  asCaseUpdateMetadata,
  ProgressThrottler,
} from "../utils";

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
      // Create initial sync audit with in_progress status
      await createSyncAudit({
        supabase: this.supabase,
        syncId,
        clinicId: this.clinicId,
        syncType: "inbound",
      });

      // Initialize progress throttler (2-second throttle)
      const throttler = new ProgressThrottler(2000);

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

      // Update with total count immediately (force)
      if (appointments.length > 0) {
        await throttler.queueUpdate(
          {
            supabase: this.supabase,
            syncId,
            total_items: appointments.length,
            processed_items: 0,
            progress_percentage: 0,
          },
          true,
        ); // Force immediate update
      }

      // Process each appointment (skip blocks — they occupy time slots but don't create cases)
      for (let i = 0; i < appointments.length; i++) {
        const appointment = appointments[i];
        if (!appointment) continue;

        // Skip IDEXX schedule blocks (e.g. "TP has Dr. appt") — no case needed
        if (appointment.type === "block") {
          stats.skipped++;
          continue;
        }

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

        // Update progress (throttled automatically)
        const processed = i + 1;
        const percentage = Math.floor((processed / appointments.length) * 100);
        await throttler.queueUpdate({
          supabase: this.supabase,
          syncId,
          total_items: appointments.length,
          processed_items: processed,
          progress_percentage: percentage,
        });
      }

      // Flush any pending updates before final completion
      await throttler.flush();

      // Record sync audit
      await recordSyncAudit({
        supabase: this.supabase,
        syncId,
        clinicId: this.clinicId,
        syncType: "inbound",
        stats,
        success: errors.length === 0,
      });

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

      // Note: throttler may not be initialized if error happens before try block
      // This is fine - we'll just record the failed audit without flushing

      // Record failed sync audit
      await recordSyncAudit({
        supabase: this.supabase,
        syncId,
        clinicId: this.clinicId,
        syncType: "inbound",
        stats,
        success: false,
        errorMessage: message,
      });

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
    const externalId = buildPimsExternalId(this.provider.name, appointment.id);

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
            metadata: asCaseUpdateMetadata(metadata),
            scheduled_at: appointment.startTime?.toISOString() ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          throw new Error(`Failed to update case: ${error.message}`);
        }

        // Update patient record if it exists
        await updatePatientFromPimsAppointment(this.supabase, existing.id, {
          patientInfo: {
            name: appointment.patient.name ?? "Unknown",
            species: this.normalizeSpecies(appointment.patient.species),
            breed: appointment.patient.breed ?? null,
          },
          ownerInfo: {
            name: appointment.client.name ?? null,
            phone: appointment.client.phone ?? null,
            email: appointment.client.email ?? null,
          },
        });

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
    const { data: newCase, error } = await this.supabase
      .from("cases")
      .insert({
        external_id: externalId,
        clinic_id: this.clinicId,
        source: buildPimsSource(this.provider.name),
        status: mapAppointmentStatus(appointment.status),
        type: mapAppointmentType(appointment.type),
        scheduled_at: appointment.startTime?.toISOString() ?? null,
        metadata: asCaseInsertMetadata(metadata),
        visibility: "private", // Clinic-internal cases are private
      })
      .select("id")
      .single();

    if (error || !newCase) {
      throw new Error(
        `Failed to create case: ${error?.message ?? "Unknown error"}`,
      );
    }

    // Create patient record for this case
    await createPatientFromPimsAppointment(this.supabase, {
      caseId: newCase.id,
      clinicId: this.clinicId,
      patientInfo: {
        name: appointment.patient.name ?? "Unknown",
        species: this.normalizeSpecies(appointment.patient.species),
        breed: appointment.patient.breed ?? null,
      },
      ownerInfo: {
        name: appointment.client.name ?? null,
        phone: appointment.client.phone ?? null,
        email: appointment.client.email ?? null,
      },
    });

    logger.debug("Created new case with patient from appointment", {
      caseId: newCase.id,
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
        caseType: mapAppointmentType(appointment.type) ?? "unknown",
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
}
