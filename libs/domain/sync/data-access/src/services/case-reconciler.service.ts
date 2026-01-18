/**
 * Case Reconciler Service
 * Reconciles local cases with PIMS data (7-day lookback)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@odis-ai/shared/types";
import type {
  IPimsProvider,
  PimsAppointment,
  ReconciliationOptions,
  ReconciliationResult,
  SyncStats,
} from "../types";
import { createLogger } from "@odis-ai/shared/logger";

const logger = createLogger("case-reconciler");

/**
 * Case row for reconciliation
 */
interface CaseForReconciliation {
  id: string;
  external_id: string | null;
  status: Database["public"]["Enums"]["CaseStatus"] | null;
  scheduled_at: string | null;
  metadata: Json | null;
}

/**
 * CaseReconciler - Reconciles cases with PIMS source of truth
 *
 * Responsibilities:
 * - Compare local cases against PIMS appointments
 * - Soft-delete orphaned cases (removed from PIMS)
 * - Update status for cancelled/no-show appointments
 * - Track reconciliation statistics
 */
export class CaseReconciler {
  private readonly DEFAULT_LOOKBACK_DAYS = 7;

  constructor(
    private supabase: SupabaseClient<Database>,
    private provider: IPimsProvider,
    private clinicId: string,
  ) {}

  /**
   * Reconcile cases for lookback period
   */
  async reconcile(
    options?: ReconciliationOptions,
  ): Promise<ReconciliationResult> {
    const syncId = crypto.randomUUID();
    const startTime = Date.now();
    const errors: Array<{
      message: string;
      context?: Record<string, unknown>;
    }> = [];
    const deletedCases: string[] = [];

    const lookbackDays = options?.lookbackDays ?? this.DEFAULT_LOOKBACK_DAYS;

    logger.info("Starting case reconciliation", {
      syncId,
      clinicId: this.clinicId,
      provider: this.provider.name,
      lookbackDays,
    });

    const stats: SyncStats & { deleted: number; reconciled: number } = {
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      deleted: 0,
      reconciled: 0,
    };

    try {
      // Calculate date range for lookback
      const { start, end } = this.getDateRange(lookbackDays);

      // Fetch current appointments from PIMS
      const pimsAppointments = await this.provider.fetchAppointments(
        start,
        end,
      );

      logger.info("Fetched PIMS appointments for reconciliation", {
        syncId,
        count: pimsAppointments.length,
        dateRange: { start: start.toISOString(), end: end.toISOString() },
      });

      // Build set of PIMS appointment IDs
      const pimsAppointmentIds = new Set(
        pimsAppointments.map((appt) => this.buildExternalId(appt.id)),
      );

      // Build map of PIMS appointments by external ID for status checks
      const pimsAppointmentMap = new Map(
        pimsAppointments.map((appt) => [this.buildExternalId(appt.id), appt]),
      );

      // Get local cases for the same period
      const localCases = await this.getLocalCases(start, end);
      stats.total = localCases.length;

      logger.info("Found local cases for reconciliation", {
        syncId,
        localCases: localCases.length,
        pimsAppointments: pimsAppointments.length,
      });

      // Process each local case
      for (const caseRow of localCases) {
        try {
          const result = await this.reconcileCase(
            caseRow,
            pimsAppointmentIds,
            pimsAppointmentMap,
          );

          switch (result.action) {
            case "deleted":
              stats.deleted++;
              deletedCases.push(caseRow.id);
              break;
            case "updated":
              stats.updated++;
              break;
            case "skipped":
              stats.skipped++;
              break;
          }
          stats.reconciled++;
        } catch (error) {
          stats.failed++;
          const message =
            error instanceof Error ? error.message : "Unknown error";
          errors.push({
            message: `Failed to reconcile case ${caseRow.id}: ${message}`,
            context: { caseId: caseRow.id },
          });
          logger.error("Failed to reconcile case", {
            syncId,
            caseId: caseRow.id,
            error: message,
          });
        }
      }

      // Record sync audit
      await this.recordSyncAudit(
        syncId,
        "reconciliation",
        stats,
        errors.length === 0,
      );

      const durationMs = Date.now() - startTime;

      logger.info("Case reconciliation completed", {
        syncId,
        stats,
        durationMs,
        deletedCases: deletedCases.length,
        hasErrors: errors.length > 0,
      });

      return {
        success: errors.length === 0,
        syncId,
        stats,
        durationMs,
        errors: errors.length > 0 ? errors : undefined,
        deletedCases: deletedCases.length > 0 ? deletedCases : undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const durationMs = Date.now() - startTime;

      logger.error("Case reconciliation failed", {
        syncId,
        error: message,
        durationMs,
      });

      await this.recordSyncAudit(
        syncId,
        "reconciliation",
        stats,
        false,
        message,
      );

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
   * Reconcile a single case
   */
  private async reconcileCase(
    caseRow: CaseForReconciliation,
    pimsAppointmentIds: Set<string>,
    pimsAppointmentMap: Map<string, PimsAppointment>,
  ): Promise<{ action: "deleted" | "updated" | "skipped" }> {
    // Skip cases without external ID (not from PIMS sync)
    if (!caseRow.external_id) {
      return { action: "skipped" };
    }

    // Check if appointment still exists in PIMS
    const existsInPims = pimsAppointmentIds.has(caseRow.external_id);
    const pimsAppointment = pimsAppointmentMap.get(caseRow.external_id);

    if (!existsInPims) {
      // Appointment removed from PIMS - soft delete
      await this.softDeleteCase(caseRow.id, "removed_from_pims");
      return { action: "deleted" };
    }

    // Check if status changed in PIMS
    if (pimsAppointment && this.shouldUpdateStatus(caseRow, pimsAppointment)) {
      await this.updateCaseStatus(caseRow.id, pimsAppointment);
      return { action: "updated" };
    }

    return { action: "skipped" };
  }

  /**
   * Check if case status should be updated based on PIMS
   */
  private shouldUpdateStatus(
    caseRow: CaseForReconciliation,
    pimsAppointment: PimsAppointment,
  ): boolean {
    const pimsStatus = this.mapAppointmentStatus(pimsAppointment.status);
    return caseRow.status !== pimsStatus;
  }

  /**
   * Soft delete a case by setting status to reviewed and updating metadata
   */
  private async softDeleteCase(caseId: string, reason: string): Promise<void> {
    // First fetch current metadata
    const { data: currentCase, error: fetchError } = await this.supabase
      .from("cases")
      .select("metadata")
      .eq("id", caseId)
      .single();

    if (fetchError) {
      throw new Error(
        `Failed to fetch case for soft delete: ${fetchError.message}`,
      );
    }

    const currentMetadata = (currentCase?.metadata ?? {}) as Record<
      string,
      unknown
    >;

    // Update with reconciliation info
    const { error } = await this.supabase
      .from("cases")
      .update({
        status: "reviewed", // 'reviewed' = closed/archived cases
        metadata: {
          ...currentMetadata,
          reconciliation: {
            softDeleted: true,
            reason,
            deletedAt: new Date().toISOString(),
          },
        } as unknown as Database["public"]["Tables"]["cases"]["Update"]["metadata"],
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseId);

    if (error) {
      throw new Error(`Failed to soft delete case: ${error.message}`);
    }

    logger.debug("Soft deleted case", { caseId, reason });
  }

  /**
   * Update case status from PIMS
   */
  private async updateCaseStatus(
    caseId: string,
    pimsAppointment: PimsAppointment,
  ): Promise<void> {
    const newStatus = this.mapAppointmentStatus(pimsAppointment.status);

    const { error } = await this.supabase
      .from("cases")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseId);

    if (error) {
      throw new Error(`Failed to update case status: ${error.message}`);
    }

    logger.debug("Updated case status from PIMS", {
      caseId,
      pimsStatus: pimsAppointment.status,
      newStatus,
    });
  }

  /**
   * Get local cases for date range
   */
  private async getLocalCases(
    startDate: Date,
    endDate: Date,
  ): Promise<CaseForReconciliation[]> {
    const { data, error } = await this.supabase
      .from("cases")
      .select("id, external_id, status, scheduled_at, metadata")
      .eq("clinic_id", this.clinicId)
      .gte("scheduled_at", startDate.toISOString())
      .lte("scheduled_at", endDate.toISOString())
      // Only reconcile PIMS-synced cases
      .like("source", "pims:%");

    if (error) {
      throw new Error(`Failed to fetch local cases: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Build external ID for PIMS appointment
   */
  private buildExternalId(appointmentId: string): string {
    return `pims-appt-${this.provider.name.toLowerCase().replace(/\s+/g, "-")}-${appointmentId}`;
  }

  /**
   * Get date range for lookback
   */
  private getDateRange(lookbackDays: number): { start: Date; end: Date } {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setDate(start.getDate() - lookbackDays);
    start.setHours(0, 0, 0, 0);

    return { start, end };
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
