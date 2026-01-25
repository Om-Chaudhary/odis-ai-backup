/**
 * Structured Output Schemas
 *
 * Zod schemas for VAPI structured data outputs.
 * These schemas define the shape of data extracted by VAPI's analysisPlan.
 *
 * @module vapi/schemas/structured-outputs
 */

export { CallOutcomeSchema, type CallOutcome } from "./call-outcome";
export { PetHealthSchema, type PetHealth } from "./pet-health";
export {
  MedicationComplianceSchema,
  type MedicationCompliance,
} from "./medication-compliance";
export { OwnerSentimentSchema, type OwnerSentiment } from "./owner-sentiment";
export { EscalationSchema, type Escalation } from "./escalation";
export { FollowUpSchema, type FollowUp } from "./follow-up";
export {
  AttentionClassificationSchema,
  type AttentionClassification,
} from "./attention";

/**
 * Schema name constants matching VAPI configuration
 */
export const STRUCTURED_OUTPUT_NAMES = {
  CALL_OUTCOME: "call_outcome",
  PET_HEALTH: "pet_health_status",
  MEDICATION_COMPLIANCE: "medication_compliance",
  OWNER_SENTIMENT: "owner_sentiment",
  ESCALATION: "escalation_tracking",
  FOLLOW_UP: "follow_up_status",
  ACTION_CARD: "action_card_output",
  ATTENTION: "attention_classification",
} as const;

export type StructuredOutputName =
  (typeof STRUCTURED_OUTPUT_NAMES)[keyof typeof STRUCTURED_OUTPUT_NAMES];
