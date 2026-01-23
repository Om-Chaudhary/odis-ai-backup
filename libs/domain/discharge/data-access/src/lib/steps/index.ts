/**
 * Discharge Steps
 *
 * Modular step handlers for the discharge orchestrator.
 */

// Types
export type { StepContext } from "./types";

// Step handlers
export { executeIngestion } from "./ingestion-step";
export { executeEntityExtraction } from "./entity-extraction-step";
export { executeSummaryGeneration } from "./summary-generation-step";
export {
  executeEmailPreparation,
  executeEmailScheduling,
} from "./email-scheduling-step";
export { executeCallScheduling } from "./call-scheduling-step";

// Utilities
export {
  cleanHtmlContent,
  detectEuthanasia,
  extractIdexxConsultationNotes,
} from "./step-utils";
