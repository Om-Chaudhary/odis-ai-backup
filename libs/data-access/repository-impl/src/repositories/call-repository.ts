/**
 * Call Repository
 *
 * Database operations for scheduled_discharge_calls table.
 * Provides domain-specific queries for call scheduling and management.
 *
 * @example
 * ```ts
 * const callRepo = new CallRepository(supabase);
 *
 * // Find call by VAPI call ID
 * const call = await callRepo.findByVapiCallId("vapi_123");
 *
 * // Get all pending calls
 * const pending = await callRepo.findPendingCalls();
 *
 * // Update call status
 * await callRepo.updateStatus("call_123", "completed");
 * ```
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository } from "./base";
import type { ScheduledCall, CallStatus } from "./types";

export class CallRepository extends BaseRepository<ScheduledCall> {
  constructor(supabase: SupabaseClient) {
    super(supabase, "scheduled_discharge_calls");
  }

  /**
   * Find a call by VAPI call ID
   *
   * @param vapiCallId - VAPI call identifier
   * @returns Call record if found, null otherwise
   *
   * @example
   * ```ts
   * const call = await callRepo.findByVapiCallId("vapi_abc123");
   * ```
   */
  async findByVapiCallId(vapiCallId: string): Promise<ScheduledCall | null> {
    this.logger.debug("Finding call by VAPI call ID", { vapiCallId });

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("vapi_call_id", vapiCallId)
      .maybeSingle();

    if (error) {
      this.logger.error("Failed to find call by VAPI call ID", {
        vapiCallId,
        error: error.message,
      });
      return null;
    }

    return data as ScheduledCall | null;
  }

  /**
   * Find all pending calls scheduled for execution
   *
   * @param limit - Maximum number of calls to return (default: 50)
   * @returns Array of pending calls
   *
   * @example
   * ```ts
   * const pendingCalls = await callRepo.findPendingCalls(100);
   * ```
   */
  async findPendingCalls(limit = 50): Promise<ScheduledCall[]> {
    this.logger.debug("Finding pending calls", { limit });

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("status", "queued")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(limit);

    if (error) {
      this.logger.error("Failed to find pending calls", {
        error: error.message,
      });
      return [];
    }

    this.logger.debug("Found pending calls", { count: data?.length ?? 0 });
    return (data as ScheduledCall[]) ?? [];
  }

  /**
   * Find calls by user ID
   *
   * @param userId - User identifier
   * @param options - Query options (limit, status filter, etc.)
   * @returns Array of user's calls
   *
   * @example
   * ```ts
   * const userCalls = await callRepo.findByUserId("user_123", {
   *   limit: 20,
   *   status: "completed"
   * });
   * ```
   */
  async findByUserId(
    userId: string,
    options?: {
      limit?: number;
      status?: CallStatus;
      orderBy?: "scheduled_for" | "created_at";
      ascending?: boolean;
    },
  ): Promise<ScheduledCall[]> {
    this.logger.debug("Finding calls by user ID", { userId, options });

    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId);

    // Apply status filter if provided
    if (options?.status) {
      query = query.eq("status", options.status);
    }

    // Apply ordering
    const orderColumn = options?.orderBy ?? "created_at";
    query = query.order(orderColumn, {
      ascending: options?.ascending ?? false,
    });

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error("Failed to find calls by user ID", {
        userId,
        error: error.message,
      });
      return [];
    }

    this.logger.debug("Found user calls", { count: data?.length ?? 0 });
    return (data as ScheduledCall[]) ?? [];
  }

  /**
   * Find calls scheduled within a time range
   *
   * @param startTime - Start of time range (ISO 8601)
   * @param endTime - End of time range (ISO 8601)
   * @param status - Optional status filter
   * @returns Array of calls in time range
   *
   * @example
   * ```ts
   * const todayCalls = await callRepo.findByTimeRange(
   *   "2025-11-17T00:00:00Z",
   *   "2025-11-17T23:59:59Z",
   *   "queued"
   * );
   * ```
   */
  async findByTimeRange(
    startTime: string,
    endTime: string,
    status?: CallStatus,
  ): Promise<ScheduledCall[]> {
    this.logger.debug("Finding calls by time range", {
      startTime,
      endTime,
      status,
    });

    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .gte("scheduled_for", startTime)
      .lte("scheduled_for", endTime);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("scheduled_for", {
      ascending: true,
    });

    if (error) {
      this.logger.error("Failed to find calls by time range", {
        error: error.message,
      });
      return [];
    }

    this.logger.debug("Found calls in time range", {
      count: data?.length ?? 0,
    });
    return (data as ScheduledCall[]) ?? [];
  }

  /**
   * Update call status
   *
   * @param callId - Call identifier
   * @param status - New status
   * @param metadata - Optional additional metadata to update
   * @returns Updated call record
   *
   * @example
   * ```ts
   * await callRepo.updateStatus("call_123", "in-progress", {
   *   start_time: new Date().toISOString()
   * });
   * ```
   */
  async updateStatus(
    callId: string,
    status: CallStatus,
    metadata?: Record<string, unknown>,
  ): Promise<ScheduledCall> {
    this.logger.info("Updating call status", { callId, status, metadata });

    const updateData: Partial<ScheduledCall> = { status };

    // Merge metadata if provided
    if (metadata) {
      const existingCall = await this.findById(callId);
      if (existingCall) {
        updateData.metadata = {
          ...existingCall.metadata,
          ...metadata,
        };
      }
    }

    return this.update(callId, updateData);
  }

  /**
   * Link a VAPI call ID to a scheduled call
   *
   * @param callId - Scheduled call identifier
   * @param vapiCallId - VAPI call identifier
   * @returns Updated call record
   *
   * @example
   * ```ts
   * await callRepo.setVapiCallId("call_123", "vapi_abc123");
   * ```
   */
  async setVapiCallId(
    callId: string,
    vapiCallId: string,
  ): Promise<ScheduledCall> {
    this.logger.info("Setting VAPI call ID", { callId, vapiCallId });

    return this.update(callId, {
      vapi_call_id: vapiCallId,
      status: "in-progress",
    });
  }

  /**
   * Increment retry count for a failed call
   *
   * @param callId - Call identifier
   * @returns Updated call record
   *
   * @example
   * ```ts
   * await callRepo.incrementRetryCount("call_123");
   * ```
   */
  async incrementRetryCount(callId: string): Promise<ScheduledCall> {
    this.logger.info("Incrementing retry count", { callId });

    const call = await this.findById(callId);
    if (!call) {
      throw new Error(`Call not found: ${callId}`);
    }

    const metadata = call.metadata as { retry_count?: number };
    const retryCount = (metadata.retry_count ?? 0) + 1;

    return this.update(callId, {
      metadata: {
        ...call.metadata,
        retry_count: retryCount,
      },
    });
  }

  /**
   * Get call statistics for a user
   *
   * @param userId - User identifier
   * @returns Call statistics by status
   *
   * @example
   * ```ts
   * const stats = await callRepo.getStatsByUser("user_123");
   * // Returns: { queued: 5, in-progress: 2, completed: 10, failed: 1, canceled: 0 }
   * ```
   */
  async getStatsByUser(userId: string): Promise<Record<CallStatus, number>> {
    this.logger.debug("Getting call statistics for user", { userId });

    const stats: Record<CallStatus, number> = {
      queued: 0,
      "in-progress": 0,
      completed: 0,
      failed: 0,
      canceled: 0,
    };

    // Single query with GROUP BY for all statuses
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("status")
      .eq("user_id", userId);

    if (error) {
      this.logger.error("Failed to get call statistics", {
        userId,
        error: error.message,
      });
      return stats;
    }

    // Count occurrences of each status
    if (data) {
      for (const row of data) {
        const status = row.status as CallStatus;
        if (status in stats) {
          stats[status]++;
        }
      }
    }

    this.logger.debug("Call statistics retrieved", { userId, stats });
    return stats;
  }
}
