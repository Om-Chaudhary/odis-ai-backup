/**
 * Sync Queue Service
 *
 * Manages concurrent sync operations to prevent resource exhaustion.
 * Limits concurrent syncs per clinic and provides queue management.
 */

import { scheduleLogger as logger } from "../lib/logger";
import { config } from "../config";

interface QueuedSync {
  clinicId: string;
  requestId: string;
  timestamp: Date;
  resolve: (value: boolean) => void;
  reject: (reason: Error) => void;
}

/**
 * Sync Queue Service (Singleton)
 *
 * Features:
 * - Limits concurrent syncs per clinic
 * - Queues additional requests
 * - Auto-cleanup stale syncs
 * - Thread-safe operations
 */
export class SyncQueueService {
  private static instance: SyncQueueService;

  // Track active syncs by clinic
  private activeSyncs = new Map<string, Set<string>>();

  // Queue of pending sync requests
  private queue: QueuedSync[] = [];

  // Track sync start times for timeout detection
  private syncStartTimes = new Map<string, Date>();

  // Maximum queue size per clinic
  private readonly maxQueueSize = 10;

  // Stale sync timeout (10 minutes)
  private readonly staleTimeout = 10 * 60 * 1000;

  private constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanupStaleSyncs(), 60 * 1000); // Every minute
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SyncQueueService {
    if (!SyncQueueService.instance) {
      SyncQueueService.instance = new SyncQueueService();
    }
    return SyncQueueService.instance;
  }

  /**
   * Request permission to start a sync
   *
   * @param clinicId - Clinic UUID
   * @param requestId - Unique request identifier
   * @returns Promise that resolves when sync can proceed
   * @throws Error if queue is full
   */
  async requestSync(clinicId: string, requestId: string): Promise<void> {
    const activeCount = this.getActiveSyncCount(clinicId);
    const queuedCount = this.getQueuedCount(clinicId);

    logger.debug(
      `Sync request for clinic ${clinicId}: ${activeCount} active, ${queuedCount} queued`,
    );

    // Check if we can proceed immediately
    if (activeCount < config.MAX_CONCURRENT_SYNCS) {
      this.registerSync(clinicId, requestId);
      logger.info(
        `Sync ${requestId} started immediately for clinic ${clinicId}`,
      );
      return;
    }

    // Check if queue is full
    if (queuedCount >= this.maxQueueSize) {
      logger.warn(
        `Queue full for clinic ${clinicId}, rejecting sync ${requestId}`,
      );
      throw new Error(
        `Sync queue full for clinic. Maximum ${this.maxQueueSize} queued syncs allowed.`,
      );
    }

    // Add to queue and wait
    logger.info(
      `Sync ${requestId} queued for clinic ${clinicId} (position ${queuedCount + 1})`,
    );

    return new Promise<void>((resolve, reject) => {
      this.queue.push({
        clinicId,
        requestId,
        timestamp: new Date(),
        resolve: (canProceed) => {
          if (canProceed) {
            this.registerSync(clinicId, requestId);
            resolve();
          } else {
            reject(new Error("Sync was dequeued without permission"));
          }
        },
        reject,
      });
    });
  }

  /**
   * Complete a sync and process queue
   *
   * @param clinicId - Clinic UUID
   * @param requestId - Request identifier
   */
  completeSync(clinicId: string, requestId: string): void {
    this.unregisterSync(clinicId, requestId);
    logger.info(`Sync ${requestId} completed for clinic ${clinicId}`);

    // Process queue for this clinic
    this.processQueue(clinicId);
  }

  /**
   * Get count of active syncs for a clinic
   */
  getActiveSyncCount(clinicId: string): number {
    return this.activeSyncs.get(clinicId)?.size ?? 0;
  }

  /**
   * Get count of queued syncs for a clinic
   */
  getQueuedCount(clinicId: string): number {
    return this.queue.filter((q) => q.clinicId === clinicId).length;
  }

  /**
   * Get total active syncs across all clinics
   */
  getTotalActiveSyncs(): number {
    let total = 0;
    for (const syncSet of this.activeSyncs.values()) {
      total += syncSet.size;
    }
    return total;
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    totalQueued: number;
    totalActive: number;
    byClinic: Map<string, { active: number; queued: number }>;
  } {
    const byClinic = new Map<string, { active: number; queued: number }>();

    // Count active syncs
    for (const [clinicId, syncSet] of this.activeSyncs.entries()) {
      byClinic.set(clinicId, { active: syncSet.size, queued: 0 });
    }

    // Count queued syncs
    for (const queuedSync of this.queue) {
      const stats = byClinic.get(queuedSync.clinicId) ?? {
        active: 0,
        queued: 0,
      };
      stats.queued++;
      byClinic.set(queuedSync.clinicId, stats);
    }

    return {
      totalQueued: this.queue.length,
      totalActive: this.getTotalActiveSyncs(),
      byClinic,
    };
  }

  /**
   * Register an active sync
   */
  private registerSync(clinicId: string, requestId: string): void {
    if (!this.activeSyncs.has(clinicId)) {
      this.activeSyncs.set(clinicId, new Set());
    }
    this.activeSyncs.get(clinicId)!.add(requestId);
    this.syncStartTimes.set(requestId, new Date());
  }

  /**
   * Unregister an active sync
   */
  private unregisterSync(clinicId: string, requestId: string): void {
    const syncSet = this.activeSyncs.get(clinicId);
    if (syncSet) {
      syncSet.delete(requestId);
      if (syncSet.size === 0) {
        this.activeSyncs.delete(clinicId);
      }
    }
    this.syncStartTimes.delete(requestId);
  }

  /**
   * Process queue for a clinic (dequeue next pending sync)
   */
  private processQueue(clinicId: string): void {
    const activeCount = this.getActiveSyncCount(clinicId);

    if (activeCount >= config.MAX_CONCURRENT_SYNCS) {
      return; // Still at capacity
    }

    // Find next queued sync for this clinic
    const index = this.queue.findIndex((q) => q.clinicId === clinicId);

    if (index === -1) {
      return; // No queued syncs for this clinic
    }

    // Dequeue and allow to proceed
    const [queuedSync] = this.queue.splice(index, 1);
    logger.info(
      `Processing queued sync ${queuedSync!.requestId} for clinic ${clinicId}`,
    );
    queuedSync!.resolve(true);
  }

  /**
   * Cleanup stale syncs (stuck syncs older than timeout)
   */
  private cleanupStaleSyncs(): void {
    const now = new Date();
    const staleSyncs: string[] = [];

    for (const [requestId, startTime] of this.syncStartTimes.entries()) {
      const elapsed = now.getTime() - startTime.getTime();

      if (elapsed > this.staleTimeout) {
        staleSyncs.push(requestId);
      }
    }

    if (staleSyncs.length > 0) {
      logger.warn(`Cleaning up ${staleSyncs.length} stale syncs`);

      for (const requestId of staleSyncs) {
        // Find clinic for this sync
        let clinicId: string | null = null;
        for (const [cid, syncSet] of this.activeSyncs.entries()) {
          if (syncSet.has(requestId)) {
            clinicId = cid;
            break;
          }
        }

        if (clinicId) {
          this.unregisterSync(clinicId, requestId);
          this.processQueue(clinicId);
        }
      }
    }
  }

  /**
   * Cancel all queued syncs (used during shutdown)
   */
  cancelAllQueued(): void {
    logger.info(`Cancelling ${this.queue.length} queued syncs`);

    for (const queuedSync of this.queue) {
      queuedSync.reject(new Error("Server shutting down"));
    }

    this.queue = [];
  }

  /**
   * Wait for all active syncs to complete
   *
   * @param timeoutMs - Maximum time to wait
   * @returns Promise that resolves when all syncs complete or timeout
   */
  async waitForActiveSyncs(timeoutMs: number): Promise<void> {
    const startTime = Date.now();

    while (this.getTotalActiveSyncs() > 0) {
      const elapsed = Date.now() - startTime;

      if (elapsed >= timeoutMs) {
        const remaining = this.getTotalActiveSyncs();
        logger.warn(
          `Timeout waiting for syncs to complete. ${remaining} still active.`,
        );
        break;
      }

      // Wait 500ms before checking again
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

// Export singleton instance
export const syncQueue = SyncQueueService.getInstance();
