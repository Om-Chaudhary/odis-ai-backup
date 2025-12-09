/**
 * Orchestration Type Definitions
 *
 * TypeScript types for the orchestration system, including execution context,
 * step results, and orchestration outcomes.
 */

import type { User } from "@supabase/supabase-js";
import type { SupabaseClientType } from "~/types/supabase";
import type { NormalizedEntities } from "@odis/validators/scribe";

/* ========================================
   Step Names
   ======================================== */

/**
 * Step names in the orchestration workflow
 */
export type StepName =
  | "ingest"
  | "extractEntities"
  | "generateSummary"
  | "prepareEmail"
  | "scheduleEmail"
  | "scheduleCall";

/* ========================================
   Execution Context
   ======================================== */

/**
 * Execution context passed to step handlers
 * Contains authenticated user, database client, and timing information
 */
export interface ExecutionContext {
  user: User;
  supabase: SupabaseClientType;
  startTime: number;
}

/* ========================================
   Step Results
   ======================================== */

/**
 * Result of a single step execution
 */
export interface StepResult {
  step: StepName;
  status: "completed" | "skipped" | "failed";
  duration: number;
  data?: unknown;
  error?: string;
}

/**
 * Result data for ingestion step
 */
export interface IngestResult {
  caseId: string;
  entities: NormalizedEntities;
  scheduledCall?: {
    id: string;
    scheduledFor: string;
  } | null;
}

/**
 * Result data for entity extraction step
 */
export interface ExtractEntitiesResult {
  caseId: string;
  entities: NormalizedEntities;
  source: "transcription" | "idexx_consultation_notes" | "existing";
}

/**
 * Result data for summary generation step
 */
export interface SummaryResult {
  summaryId: string;
  content: string;
}

/**
 * Result data for email preparation step
 */
export interface EmailResult {
  subject: string;
  html: string;
  text: string;
}

/**
 * Result data for email scheduling step
 */
export interface EmailScheduleResult {
  emailId: string;
  scheduledFor: string;
}

/**
 * Result data for call scheduling step
 */
export interface CallResult {
  callId: string;
  scheduledFor: string;
}

/* ========================================
   Orchestration Result
   ======================================== */

/**
 * Complete orchestration result
 * Contains success status, completed data, and metadata about execution
 */
export interface OrchestrationResult {
  success: boolean;
  data: {
    completedSteps: StepName[];
    skippedSteps: StepName[];
    failedSteps: StepName[];
    ingestion?: IngestResult;
    extractedEntities?: ExtractEntitiesResult;
    summary?: SummaryResult;
    email?: EmailResult;
    emailSchedule?: EmailScheduleResult;
    call?: CallResult;
  };
  metadata: {
    totalProcessingTime: number;
    stepTimings: Record<string, number>;
    warnings?: string[];
    errors?: Array<{ step: StepName; error: string }>;
  };
}
