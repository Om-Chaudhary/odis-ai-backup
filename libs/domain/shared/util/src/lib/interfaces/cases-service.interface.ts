import type { SupabaseClientType } from "@odis-ai/shared/types/supabase";
import type { Database } from "@odis-ai/shared/types";
import type {
  IngestPayload,
  CaseScheduleOptions,
  ScheduledDischargeCall,
} from "@odis-ai/shared/types/services";
import type { NormalizedEntities } from "@odis-ai/shared/validators";
import type { ICallExecutor } from "./call-executor.interface";

type CaseRow = Database["public"]["Tables"]["cases"]["Row"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type SoapNoteRow = Database["public"]["Tables"]["soap_notes"]["Row"];
type DischargeSummaryRow =
  Database["public"]["Tables"]["discharge_summaries"]["Row"];

/**
 * Interface for case management operations needed by DischargeOrchestrator
 *
 * Breaks circular dependency by allowing services-discharge to depend on
 * this interface instead of concrete CasesService implementation.
 *
 * Note: CasesService implements these methods (and more), but this interface
 * only exposes what DischargeOrchestrator needs.
 *
 * Implemented by: CasesService in @odis-ai/domain/cases
 * Used by: DischargeOrchestrator in @odis-ai/domain/discharge
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
    entities: NormalizedEntities | undefined;
    patient: PatientRow | PatientRow[] | null;
    soapNotes: SoapNoteRow[] | null;
    dischargeSummaries: DischargeSummaryRow[] | null;
    metadata: unknown;
  } | null>;

  /**
   * Schedule a discharge call for an existing case
   */
  scheduleDischargeCall(
    supabase: SupabaseClientType,
    userId: string,
    caseId: string,
    options: CaseScheduleOptions,
    callExecutor?: ICallExecutor,
  ): Promise<ScheduledDischargeCall>;
}
