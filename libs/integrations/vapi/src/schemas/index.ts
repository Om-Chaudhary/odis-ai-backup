/**
 * VAPI Tool Schemas
 *
 * Domain-grouped Zod schemas for all VAPI tool inputs.
 * These schemas validate inputs from VAPI tool calls.
 *
 * @module vapi/schemas
 *
 * @example
 * ```typescript
 * import {
 *   BookAppointmentSchema,
 *   LeaveMessageSchema,
 *   type BookAppointmentInput,
 * } from "@odis-ai/integrations/vapi/schemas";
 * ```
 */

// Appointments
export {
  CheckAvailabilitySchema,
  CheckAvailabilityRangeSchema,
  BookAppointmentSchema,
  VerifyAppointmentSchema,
  CancelAppointmentSchema,
  RescheduleAppointmentSchema,
  type CheckAvailabilityInput,
  type CheckAvailabilityRangeInput,
  type BookAppointmentInput,
  type VerifyAppointmentInput,
  type VerifyAppointmentResult,
  type CancelAppointmentInput,
  type RescheduleAppointmentInput,
  type AvailableSlot,
  type BookingResult,
} from "./appointments";

// Messaging
export {
  MessageTypeEnum,
  LeaveMessageSchema,
  type MessageType,
  type LeaveMessageInput,
} from "./messaging";

// Triage
export {
  SpeciesEnum,
  UrgencyLevelEnum,
  TriageActionEnum,
  LogEmergencyTriageSchema,
  type Species,
  type UrgencyLevel,
  type TriageAction,
  type LogEmergencyTriageInput,
} from "./triage";

// Clinical
export {
  PharmacyPreferenceEnum,
  CreateRefillRequestSchema,
  type PharmacyPreference,
  type CreateRefillRequestInput,
} from "./clinical";

// Action Card Output (Structured Data Plan)
export {
  ACTION_CARD_OUTPUT_SCHEMA,
  ACTION_CARD_OUTPUT_CONFIG,
  type ActionCardOutput,
} from "./action-card-output";

// Structured Outputs (Zod schemas for VAPI analysis)
export {
  CallOutcomeSchema,
  PetHealthSchema,
  MedicationComplianceSchema,
  OwnerSentimentSchema,
  EscalationSchema,
  FollowUpSchema,
  AttentionClassificationSchema,
  STRUCTURED_OUTPUT_NAMES,
  type CallOutcome,
  type PetHealth,
  type MedicationCompliance,
  type OwnerSentiment,
  type Escalation,
  type FollowUp,
  type AttentionClassification,
  type StructuredOutputName,
} from "./structured-outputs";
