/**
 * Discharge Step Handlers
 *
 * Re-exports modular step handlers from the steps/ directory.
 * This file maintains backward compatibility for existing imports.
 *
 * Step modules:
 * - ingestion-step.ts - Data ingestion from raw input
 * - entity-extraction-step.ts - AI-powered entity extraction
 * - summary-generation-step.ts - Discharge summary generation
 * - email-scheduling-step.ts - Email preparation and scheduling
 * - call-scheduling-step.ts - VAPI call scheduling
 */

// Re-export types
export type { StepContext } from "./steps/types";

// Re-export all step handlers
export { executeIngestion } from "./steps/ingestion-step";
export { executeEntityExtraction } from "./steps/entity-extraction-step";
export { executeSummaryGeneration } from "./steps/summary-generation-step";
export {
  executeEmailPreparation,
  executeEmailScheduling,
} from "./steps/email-scheduling-step";
export { executeCallScheduling } from "./steps/call-scheduling-step";
