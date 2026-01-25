/**
 * Sync Audit Utilities
 * Shared audit recording for sync operations
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";
import type { SyncStats } from "../types";
import { createLogger } from "@odis-ai/shared/logger";

const logger = createLogger("sync-audit");

export type SyncType = "inbound" | "cases" | "reconciliation";

export interface CreateSyncAuditParams {
  supabase: SupabaseClient<Database>;
  syncId: string;
  clinicId: string;
  syncType: SyncType;
}

export interface RecordSyncAuditParams {
  supabase: SupabaseClient<Database>;
  syncId: string;
  clinicId: string;
  syncType: SyncType;
  stats: SyncStats;
  success: boolean;
  errorMessage?: string;
}

/**
 * Create initial sync audit record with in_progress status
 * Call this at the START of sync operations
 */
export const createSyncAudit = async (
  params: CreateSyncAuditParams
): Promise<void> => {
  const { supabase, syncId, clinicId, syncType } = params;
  try {
    await supabase.from("case_sync_audits").insert({
      id: syncId,
      clinic_id: clinicId,
      sync_type: syncType,
      appointments_found: 0,
      cases_created: 0,
      cases_updated: 0,
      cases_skipped: 0,
      cases_deleted: 0,
      status: "in_progress",
      error_message: null,
    });

    logger.info("Created sync audit", { syncId, clinicId, syncType });
  } catch (error) {
    logger.error("Failed to create sync audit", {
      syncId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Record sync audit in database (completion)
 * Uses UPSERT to update existing in_progress record
 */
export const recordSyncAudit = async ({
  supabase,
  syncId,
  clinicId,
  syncType,
  stats,
  success,
  errorMessage,
}: RecordSyncAuditParams): Promise<void> => {
  try {
    await supabase.from("case_sync_audits").upsert({
      id: syncId,
      clinic_id: clinicId,
      sync_type: syncType,
      appointments_found: stats.total,
      cases_created: stats.created,
      cases_updated: stats.updated,
      cases_skipped: stats.skipped,
      cases_deleted: stats.deleted ?? 0,
      status: success ? "completed" : "failed",
      error_message: errorMessage ?? null,
    });

    logger.info("Recorded sync audit completion", { syncId, success });
  } catch (error) {
    logger.error("Failed to record sync audit", {
      syncId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
