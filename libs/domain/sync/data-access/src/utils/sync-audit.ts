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
 * Record sync audit in database
 */
export async function recordSyncAudit({
  supabase,
  syncId,
  clinicId,
  syncType,
  stats,
  success,
  errorMessage,
}: RecordSyncAuditParams): Promise<void> {
  try {
    await supabase.from("case_sync_audits").insert({
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
  } catch (error) {
    logger.error("Failed to record sync audit", {
      syncId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
