import type { SupabaseClientType } from "@odis-ai/types/supabase";
import type {
  IngestPayload,
  CaseScheduleOptions,
  ScheduledDischargeCall,
} from "@odis-ai/types/services";
import type { NormalizedEntities } from "@odis-ai/validators";

/**
 * Interface for case management operations
 *
 * Breaks circular dependency by allowing services-discharge to depend on
 * this interface instead of concrete CasesService implementation.
 *
 * Implemented by: CasesService in @odis-ai/services-cases
 * Used by: DischargeOrchestrator in @odis-ai/services-discharge
 */
export interface ICasesService {
  /**
   * Ingest case data from various sources (text, IDEXX, structured data)
   *
   * @param supabase - Supabase client for database operations
   * @param userId - ID of user creating the case
   * @param payload - Ingest payload with mode, data, and options
   * @returns Case ID, extracted entities, and optional scheduled call
   */
  ingest(
    supabase: SupabaseClientType,
    userId: string,
    payload: IngestPayload,
  ): Promise<{
    caseId: string;
    entities: NormalizedEntities;
    scheduledCall: ScheduledDischargeCall | null;
  }>;

  /**
   * Schedule a discharge call for an existing case
   *
   * @param supabase - Supabase client for database operations
   * @param userId - ID of user scheduling the call
   * @param caseId - ID of case to schedule call for
   * @param options - Scheduling options (time, variables, etc.)
   * @returns Scheduled discharge call details
   */
  scheduleCall(
    supabase: SupabaseClientType,
    userId: string,
    caseId: string,
    options: CaseScheduleOptions,
  ): Promise<ScheduledDischargeCall>;

  /**
   * Update case status
   *
   * @param supabase - Supabase client for database operations
   * @param caseId - ID of case to update
   * @param status - New status value
   */
  updateStatus(
    supabase: SupabaseClientType,
    caseId: string,
    status: string,
  ): Promise<void>;
}
