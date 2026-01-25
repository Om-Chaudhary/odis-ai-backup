/**
 * Progress Throttler Utility
 * Throttles progress updates to reduce database writes
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";
import { createLogger } from "@odis-ai/shared/logger";

const logger = createLogger("progress-throttler");

export interface ProgressUpdate {
  supabase: SupabaseClient<Database>;
  syncId: string;
  total_items: number;
  processed_items: number;
  progress_percentage: number;
}

/**
 * ProgressThrottler - Throttles progress updates to reduce DB writes
 *
 * Features:
 * - Throttles updates to minimum interval (default: 2 seconds)
 * - Always forces update on first call and completion (100%)
 * - Buffers pending updates between intervals
 * - Flushes pending updates on completion
 */
export class ProgressThrottler {
  private lastUpdateTime = 0;
  private readonly minIntervalMs: number;
  private pendingUpdate: ProgressUpdate | null = null;
  private updateTimer: NodeJS.Timeout | null = null;

  constructor(minIntervalMs = 2000) {
    // Default: max 1 update per 2 seconds
    this.minIntervalMs = minIntervalMs;
  }

  /**
   * Queue a progress update. Will be throttled to minIntervalMs.
   * Always forces update on first call and last call (100%).
   */
  async queueUpdate(
    update: ProgressUpdate,
    forceImmediate = false,
  ): Promise<void> {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;

    // Force immediate update for:
    // 1. First update (total_items discovered)
    // 2. Completion (progress = 100%)
    // 3. Explicit force flag
    const shouldUpdateNow =
      forceImmediate ||
      this.lastUpdateTime === 0 ||
      update.progress_percentage === 100 ||
      timeSinceLastUpdate >= this.minIntervalMs;

    if (shouldUpdateNow) {
      await this.executeUpdate(update);
      this.pendingUpdate = null;
      if (this.updateTimer) {
        clearTimeout(this.updateTimer);
        this.updateTimer = null;
      }
    } else {
      // Buffer the update, schedule for next interval
      this.pendingUpdate = update;

      if (!this.updateTimer) {
        const remainingTime = this.minIntervalMs - timeSinceLastUpdate;
        this.updateTimer = setTimeout(async () => {
          if (this.pendingUpdate) {
            await this.executeUpdate(this.pendingUpdate);
            this.pendingUpdate = null;
          }
          this.updateTimer = null;
        }, remainingTime);
      }
    }
  }

  /**
   * Execute a progress update to the database
   */
  private async executeUpdate(update: ProgressUpdate): Promise<void> {
    try {
      // Note: Type casting is used here because the migration adding these fields
      // hasn't been run yet. Once the migration runs, these fields will exist.
      const { error } = await update.supabase
        .from("case_sync_audits")
        .update({
          total_items: update.total_items,
          processed_items: update.processed_items,
          progress_percentage: update.progress_percentage,
          last_progress_update: new Date().toISOString(),
        } as never)
        .eq("id", update.syncId);

      if (error) {
        logger.error("Failed to update progress", {
          syncId: update.syncId,
          error: error.message,
        });
      } else {
        logger.debug("Progress updated", {
          syncId: update.syncId,
          processed: update.processed_items,
          total: update.total_items,
          percentage: update.progress_percentage,
        });
      }

      this.lastUpdateTime = Date.now();
    } catch (error) {
      logger.error("Failed to execute progress update", {
        syncId: update.syncId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Force flush any pending update (call before final completion)
   */
  async flush(): Promise<void> {
    if (this.pendingUpdate) {
      await this.executeUpdate(this.pendingUpdate);
      this.pendingUpdate = null;
    }
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
  }
}
