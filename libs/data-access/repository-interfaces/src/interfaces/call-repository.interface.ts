/**
 * Call Repository Interface
 *
 * Contract for database operations on scheduled_discharge_calls table.
 * Enables dependency injection and testability.
 *
 * @example
 * ```ts
 * class CallService {
 *   constructor(private callRepo: ICallRepository) {}
 *
 *   async scheduleCall(data: CallInsert) {
 *     return this.callRepo.create(data);
 *   }
 * }
 * ```
 */

import type { ScheduledCall, CallStatus } from "../repositories/types";

/**
 * Options for querying calls
 */
export interface FindCallsOptions {
  limit?: number;
  status?: CallStatus;
  orderBy?: "scheduled_for" | "created_at";
  ascending?: boolean;
}

/**
 * Call repository interface
 */
export interface ICallRepository {
  /**
   * Find a call by ID
   *
   * @param id - Call identifier
   * @returns Call if found, null otherwise
   */
  findById(id: string): Promise<ScheduledCall | null>;

  /**
   * Find a call by VAPI call ID
   *
   * @param vapiCallId - VAPI call identifier
   * @returns Call if found, null otherwise
   */
  findByVapiCallId(vapiCallId: string): Promise<ScheduledCall | null>;

  /**
   * Find calls by case ID
   *
   * @param caseId - Case identifier
   * @param options - Query options (limit, status filter, etc.)
   * @returns Array of calls for the case
   */
  findByCase(
    caseId: string,
    options?: FindCallsOptions,
  ): Promise<ScheduledCall[]>;

  /**
   * Find calls by user ID
   *
   * @param userId - User identifier
   * @param options - Query options (limit, status filter, etc.)
   * @returns Array of user's calls
   */
  findByUserId(
    userId: string,
    options?: FindCallsOptions,
  ): Promise<ScheduledCall[]>;

  /**
   * Find all pending calls scheduled for execution
   *
   * @param limit - Maximum number of calls to return (default: 50)
   * @returns Array of pending calls
   */
  findPendingCalls(limit?: number): Promise<ScheduledCall[]>;

  /**
   * Find calls scheduled within a time range
   *
   * @param startTime - Start of time range (ISO 8601)
   * @param endTime - End of time range (ISO 8601)
   * @param status - Optional status filter
   * @returns Array of calls in time range
   */
  findByTimeRange(
    startTime: string,
    endTime: string,
    status?: CallStatus,
  ): Promise<ScheduledCall[]>;

  /**
   * Create a new scheduled call
   *
   * @param data - Call data (without auto-generated fields)
   * @returns Created call with all fields
   */
  create(data: Partial<ScheduledCall>): Promise<ScheduledCall>;

  /**
   * Update a call by ID
   *
   * @param id - Call identifier
   * @param data - Fields to update
   * @returns Updated call
   */
  update(id: string, data: Partial<ScheduledCall>): Promise<ScheduledCall>;

  /**
   * Update call status
   *
   * @param callId - Call identifier
   * @param status - New status
   * @param metadata - Optional additional metadata to update
   * @returns Updated call record
   */
  updateStatus(
    callId: string,
    status: CallStatus,
    metadata?: Record<string, unknown>,
  ): Promise<ScheduledCall>;

  /**
   * Link a VAPI call ID to a scheduled call
   *
   * @param callId - Scheduled call identifier
   * @param vapiCallId - VAPI call identifier
   * @returns Updated call record
   */
  setVapiCallId(callId: string, vapiCallId: string): Promise<ScheduledCall>;

  /**
   * Increment retry count for a failed call
   *
   * @param callId - Call identifier
   * @returns Updated call record
   */
  incrementRetryCount(callId: string): Promise<ScheduledCall>;

  /**
   * Delete a call by ID
   *
   * @param id - Call identifier
   */
  delete(id: string): Promise<void>;

  /**
   * Count calls by criteria
   *
   * @param criteria - Optional criteria to filter calls
   * @returns Total count of matching calls
   */
  count(criteria?: { user_id?: string; status?: CallStatus }): Promise<number>;

  /**
   * Get call statistics for a user
   *
   * @param userId - User identifier
   * @returns Call statistics by status
   */
  getStatsByUser(userId: string): Promise<Record<CallStatus, number>>;
}
