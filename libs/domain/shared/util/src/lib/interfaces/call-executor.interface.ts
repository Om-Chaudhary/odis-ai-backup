import type { SupabaseClientType } from "@odis-ai/shared/types/supabase";
import type { CallExecutionResult } from "@odis-ai/shared/types/services";

/**
 * Interface for discharge call execution
 *
 * Allows services-cases to execute calls in test mode without depending
 * on concrete implementation in services-discharge.
 *
 * Implemented by: executeScheduledCall in @odis-ai/services-discharge
 * Used by: CasesService in @odis-ai/services-cases (test mode only)
 */
export interface ICallExecutor {
  /**
   * Execute a scheduled discharge call via VAPI
   *
   * @param callId - Database ID of scheduled call
   * @param supabase - Supabase client for database operations
   * @returns Call execution result with status and details
   */
  executeScheduledCall(
    callId: string,
    supabase: SupabaseClientType,
  ): Promise<CallExecutionResult>;
}
