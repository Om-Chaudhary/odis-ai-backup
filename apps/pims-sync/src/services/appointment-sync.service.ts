/**
 * Appointment Sync Service
 *
 * Core logic for syncing appointments from PIMS to pims_appointments table.
 * Extracted from sync.route.ts for reuse by both API endpoints and scheduler.
 * Includes IDEXX schedule blocks (is_block) as of 2026-02-21.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";
import type { IPimsProvider } from "@odis-ai/domain/sync";
import { createLogger } from "@odis-ai/shared/logger";
import { createTimeRange, timeRangeToPostgres } from "@odis-ai/shared/util";

const logger = createLogger("appointment-sync");

/**
 * Resource-ID filter for availability scheduling.
 * IDEXX columns (rooms) each have a numeric resource ID returned as `provider.id`.
 * When a clinic has an entry here, only appointments whose `provider.id` matches
 * one of the listed IDs are written to pims_appointments.
 * Clinics not listed here include all rooms (default behavior).
 *
 * Masson column→ID mapping (from IDEXX Neo):
 *   Exam Room One → "7", Exam Room Two → "9", Surgery/Drop Off → "6"
 */
const CLINIC_SCHEDULING_RESOURCE_IDS: Record<string, string[]> = {
  // Masson Veterinary Hospital: only Exam Room One (resource ID "7")
  "efcc1733-7a7b-4eab-8104-a6f49defd7a6": ["7"],
};

export interface AppointmentSyncOptions {
  startDate?: Date;
  endDate?: Date;
  daysAhead?: number;
}

export interface AppointmentSyncResult {
  success: boolean;
  syncId: string | null;
  stats: {
    found: number;
    added: number;
    updated: number;
    removed: number;
  };
  durationMs: number;
  error?: string;
}

interface AppointmentV2Record {
  clinic_id: string;
  time_range: string;
  neo_appointment_id: string;
  patient_name: string | null;
  client_name: string | null;
  client_phone: string | null;
  provider_name: string | null;
  room_id: string | null;
  appointment_type: string | null;
  status: string;
  source: string;
  sync_hash: string | null;
  last_synced_at: string;
  deleted_at: string | null;
}

/**
 * Execute appointment sync for a clinic
 *
 * @param supabase - Supabase service client (must bypass RLS)
 * @param provider - Authenticated PIMS provider
 * @param clinicId - Clinic UUID
 * @param options - Sync options (date range)
 */
export async function executeAppointmentSync(
  supabase: SupabaseClient<Database>,
  provider: IPimsProvider,
  clinicId: string,
  options?: AppointmentSyncOptions,
): Promise<AppointmentSyncResult> {
  const startTime = Date.now();
  let syncId: string | null = null;

  logger.info("Starting appointment sync", { clinicId, options });

  try {
    // Build date range
    const startDate = options?.startDate ?? new Date();
    startDate.setHours(0, 0, 0, 0);

    const daysAhead = options?.daysAhead ?? 7;
    const endDate =
      options?.endDate ??
      new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    endDate.setHours(23, 59, 59, 999);

    const startDateStr = startDate.toISOString().split("T")[0]!;
    const endDateStr = endDate.toISOString().split("T")[0]!;

    // Create sync record
    const { data: syncRecord, error: syncError } = await supabase
      .from("schedule_syncs")
      .insert({
        clinic_id: clinicId,
        sync_start_date: startDateStr,
        sync_end_date: endDateStr,
        sync_type: "appointments",
        status: "in_progress",
        started_at: new Date(startTime).toISOString(),
      })
      .select("id")
      .single();

    if (syncError) {
      logger.error("Failed to create sync record", {
        clinicId,
        error: syncError.message,
      });
    } else {
      syncId = syncRecord.id;
    }

    // Fetch appointments from PIMS
    logger.info("Fetching appointments from PIMS", {
      clinicId,
      dateRange: { start: startDateStr, end: endDateStr },
    });

    const allAppointments = await provider.fetchAppointments(startDate, endDate);

    // Apply resource-ID filter: only include appointments from specific IDEXX columns.
    // When set, only these rooms count toward availability (e.g. Masson: resource ID "7" = Exam Room One).
    // Other clinics (e.g. Alumrock) have no filter and include all rooms.
    const resourceFilter = CLINIC_SCHEDULING_RESOURCE_IDS[clinicId];

    if (resourceFilter) {
      // Log unique resource IDs to confirm the mapping is correct.
      const idCounts = new Map<string, number>();
      for (const a of allAppointments) {
        const key = a.provider?.id ?? "NULL";
        idCounts.set(key, (idCounts.get(key) ?? 0) + 1);
      }
      const idSummary = Array.from(idCounts.entries())
        .map(([id, count]) => `id=${id}: ${count}`)
        .join(", ");
      logger.info(
        `[${clinicId}] IDEXX resource IDs (${allAppointments.length} total): ${idSummary} | allowed IDs: ${resourceFilter.join(", ")}`,
      );
    }

    const appointments = resourceFilter
      ? allAppointments.filter(
          (a) =>
            a.type === "block" ||
            matchesResourceFilter(a, resourceFilter),
        )
      : allAppointments;

    if (resourceFilter) {
      logger.info(
        `[${clinicId}] Resource filter: ${allAppointments.length} total -> ${appointments.length} after filter (allowed IDs: ${resourceFilter.join(", ")})`,
      );
    }

    logger.info("Fetched appointments from PIMS", {
      clinicId,
      appointmentCount: appointments.length,
    });

    // Process appointments
    let appointmentsAdded = 0;
    const appointmentsUpdated = 0;
    let appointmentsRemoved = 0;

    if (appointments.length > 0) {
      // Convert PIMS appointments to database format
      const appointmentRecords = appointments.map((appt) => {
        let timeStr = "00:00:00";
        let endTimeStr = "00:00:00";

        if (appt.startTime) {
          const hours = String(appt.startTime.getHours()).padStart(2, "0");
          const minutes = String(appt.startTime.getMinutes()).padStart(2, "0");
          timeStr = `${hours}:${minutes}:00`;

          const durationMs = (appt.duration ?? 15) * 60 * 1000;
          const endTime = new Date(appt.startTime.getTime() + durationMs);
          const endHours = String(endTime.getHours()).padStart(2, "0");
          const endMinutes = String(endTime.getMinutes()).padStart(2, "0");
          endTimeStr = `${endHours}:${endMinutes}:00`;
        }

        return {
          clinic_id: clinicId,
          neo_appointment_id: appt.id,
          date: appt.date,
          start_time: timeStr,
          end_time: endTimeStr,
          patient_name: appt.patient?.name ?? null,
          client_name: appt.client?.name ?? null,
          client_phone: appt.client?.phone ?? null,
          provider_name: appt.provider?.name ?? null,
          room_id: appt.provider?.id ?? null,
          appointment_type: appt.type ?? null,
          status: mapAppointmentStatus(appt.status),
          last_synced_at: new Date().toISOString(),
          deleted_at: null,
        };
      });

      // Get clinic timezone
      const { data: clinicData } = await supabase
        .from("clinics")
        .select("timezone")
        .eq("id", clinicId)
        .single();

      const clinicTimezone = clinicData?.timezone ?? "America/Los_Angeles";

      // Convert to time range format and write to pims_appointments
      const timeRangeRecords = convertToV2Records(
        clinicId,
        appointmentRecords,
        clinicTimezone,
      );

      const writeResult = await writeAppointmentToV2Table(
        supabase,
        clinicId,
        timeRangeRecords,
      );

      if (writeResult.success) {
        appointmentsAdded = writeResult.count;
      } else {
        logger.warn("pims_appointments write failed", {
          clinicId,
          error: writeResult.error,
        });
      }

      // Soft-delete appointments not in this sync
      const syncedIds = appointments.map((a) => a.id);
      const { data: removedData, error: removeError } = await supabase
        .from("pims_appointments")
        .update({
          deleted_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        })
        .eq("clinic_id", clinicId)
        .gte("date", startDateStr)
        .lte("date", endDateStr)
        .is("deleted_at", null)
        .not(
          "neo_appointment_id",
          "in",
          `(${syncedIds.join(",")})`,
        )
        .select("id");

      if (removeError) {
        logger.warn("Failed to soft-delete stale appointments", {
          clinicId,
          error: removeError.message,
        });
      } else {
        appointmentsRemoved = removedData?.length ?? 0;
      }
    }

    // Update sync record with success
    if (syncId) {
      await supabase
        .from("schedule_syncs")
        .update({
          status: "completed",
          appointments_added: appointmentsAdded,
          appointments_updated: appointmentsUpdated,
          appointments_removed: appointmentsRemoved,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        })
        .eq("id", syncId);
    }

    const result: AppointmentSyncResult = {
      success: true,
      syncId,
      stats: {
        found: appointments.length,
        added: appointmentsAdded,
        updated: appointmentsUpdated,
        removed: appointmentsRemoved,
      },
      durationMs: Date.now() - startTime,
    };

    logger.info("Appointment sync completed", {
      clinicId,
      ...result,
    });

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    logger.error("Appointment sync failed", {
      clinicId,
      syncId,
      error: errorMessage,
    });

    // Update sync record with failure
    if (syncId) {
      await supabase
        .from("schedule_syncs")
        .update({
          status: "failed",
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        })
        .eq("id", syncId);
    }

    return {
      success: false,
      syncId,
      stats: { found: 0, added: 0, updated: 0, removed: 0 },
      durationMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

/**
 * Map PIMS appointment status to standardized status
 */
function mapAppointmentStatus(status: string | null | undefined): string {
  if (!status) return "scheduled";

  const statusLower = status.toLowerCase();

  if (
    statusLower.includes("cancel") ||
    statusLower === "cancelled" ||
    statusLower === "canceled"
  ) {
    return "cancelled";
  }
  if (
    statusLower.includes("no show") ||
    statusLower === "no_show" ||
    statusLower === "noshow"
  ) {
    return "no_show";
  }
  if (
    statusLower.includes("final") ||
    statusLower === "finalized" ||
    statusLower === "complete" ||
    statusLower === "completed"
  ) {
    return "finalized";
  }
  if (
    statusLower.includes("progress") ||
    statusLower === "in_progress" ||
    statusLower === "checked_in"
  ) {
    return "in_progress";
  }

  return "scheduled";
}

/**
 * Write appointments to pims_appointments table (time range-based)
 */
async function writeAppointmentToV2Table(
  supabase: SupabaseClient<Database>,
  clinicId: string,
  appointments: AppointmentV2Record[],
): Promise<{ success: boolean; count: number; error?: string }> {
  if (appointments.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const batchSize = 100;
    let totalUpserted = 0;

    for (let i = 0; i < appointments.length; i += batchSize) {
      const batch = appointments.slice(i, i + batchSize);
      const { error } = await supabase.from("pims_appointments").upsert(batch, {
        onConflict: "clinic_id,neo_appointment_id",
      });

      if (error) {
        logger.error("Failed to upsert pims_appointments batch", {
          clinicId,
          batchIndex: i,
          error: error.message,
        });
        return { success: false, count: totalUpserted, error: error.message };
      }

      totalUpserted += batch.length;
    }

    logger.info("Appointments written to pims_appointments", {
      clinicId,
      count: totalUpserted,
    });

    return { success: true, count: totalUpserted };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to write appointments to pims_appointments", {
      clinicId,
      error: errorMessage,
    });
    return { success: false, count: 0, error: errorMessage };
  }
}

/**
 * Check if an appointment matches the resource-ID filter.
 * Compares `provider.id` (the IDEXX resource/column ID) against allowed IDs.
 */
function matchesResourceFilter(
  appointment: { provider?: { name?: string | null; id?: string | null } },
  allowedResourceIds: string[],
): boolean {
  const resourceId = appointment.provider?.id?.trim();
  if (!resourceId) return false;
  return allowedResourceIds.includes(resourceId);
}

/**
 * Converts appointment records to v2 time range format
 */
function convertToV2Records(
  clinicId: string,
  records: Array<{
    neo_appointment_id: string;
    date: string;
    start_time: string;
    end_time: string;
    patient_name: string | null;
    client_name: string | null;
    client_phone: string | null;
    provider_name: string | null;
    room_id: string | null;
    appointment_type: string | null;
    status: string;
  }>,
  timezone = "America/Los_Angeles",
): AppointmentV2Record[] {
  const DEFAULT_DURATION_MINUTES = 15;

  return records.map((record) => {
    let endTime = record.end_time;
    if (record.start_time === record.end_time) {
      const [h, m] = record.start_time.split(":").map(Number);
      const d = new Date(
        2000,
        0,
        1,
        h ?? 0,
        (m ?? 0) + DEFAULT_DURATION_MINUTES,
      );
      endTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;
    }

    const timeRange = createTimeRange(
      record.date,
      record.start_time,
      endTime,
      timezone,
    );

    return {
      clinic_id: clinicId,
      time_range: timeRangeToPostgres(timeRange),
      neo_appointment_id: record.neo_appointment_id,
      patient_name: record.patient_name,
      client_name: record.client_name,
      client_phone: record.client_phone,
      provider_name: record.provider_name,
      room_id: record.room_id,
      appointment_type: record.appointment_type,
      status: record.status,
      source: "idexx",
      sync_hash: null,
      last_synced_at: new Date().toISOString(),
      deleted_at: null,
    };
  });
}
