/**
 * @odis-ai/types
 *
 * Shared TypeScript types for the ODIS platform.
 * Includes Supabase database types, domain types, and service types.
 */

// Database types (generated from Supabase)
export * from "./database.types";

// Domain types
export * from "./case";
export * from "./case-study";
export * from "./clinic-branding";
export * from "./dashboard";
export * from "./entities";
export * from "./idexx";
export * from "./patient";
export * from "./services";
export * from "./supabase";

// Orchestration exports (avoid name collisions)
export type {
  CallResult,
  EmailResult,
  EmailScheduleResult,
  ExecutionContext,
  ExtractEntitiesResult,
  IngestResult as OrchestrationIngestResult,
  OrchestrationResult,
  StepName,
  StepResult,
  SummaryResult,
} from "./orchestration";
