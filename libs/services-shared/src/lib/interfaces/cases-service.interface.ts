import type { SupabaseClientType } from "@odis-ai/types/supabase";
import type { Database } from "@odis-ai/types";
import type {
  IngestPayload,
  CaseScheduleOptions,
  ScheduledDischargeCall,
} from "@odis-ai/types/services";
import type { NormalizedEntities } from "@odis-ai/validators";

type CaseRow = Database["public"]["Tables"]["cases"]["Row"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

/**
 * Interface for case management operations needed by DischargeOrchestrator
 *
 * Breaks circular dependency by allowing services-discharge to depend on
 * this interface instead of concrete CasesService implementation.
 *
 * Note: CasesService implements these methods (and more), but this interface
 * only exposes what DischargeOrchestrator needs.
 *
 * Implemented by: CasesService in @odis-ai/services-cases
 * Used by: DischargeOrchestrator in @odis-ai/services-discharge
 */
export interface ICasesService {
  /**
   * Ingest case data from various sources (text, IDEXX, structured data)
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
   * Enrich entities with patient data from database
   */
  enrichEntitiesWithPatient(
    entities: NormalizedEntities | undefined,
    patient: PatientRow | PatientRow[] | null,
  ): void;

  /**
   * Get case with entities (returns subset of properties used by DischargeOrchestrator)
   */
  getCaseWithEntities(
    supabase: SupabaseClientType,
    caseId: string,
  ): Promise<{
    case: CaseRow;
    entities?: NormalizedEntities;
    patient?: PatientRow | PatientRow[] | null;
    dischargeSummaries?: unknown;
    metadata?: unknown;
  } | null>;

  /**
   * Schedule a discharge call for an existing case
   */
  scheduleDischargeCall(
    supabase: SupabaseClientType,
    userId: string,
    caseId: string,
    options: CaseScheduleOptions,
  ): Promise<ScheduledDischargeCall>;
}
