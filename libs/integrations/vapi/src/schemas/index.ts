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
  BookAppointmentSchema,
  CancelAppointmentSchema,
  RescheduleAppointmentSchema,
  type CheckAvailabilityInput,
  type BookAppointmentInput,
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
  GetErInfoSchema,
  type Species,
  type UrgencyLevel,
  type TriageAction,
  type LogEmergencyTriageInput,
  type GetErInfoInput,
} from "./triage";

// Clinical
export {
  PharmacyPreferenceEnum,
  CreateRefillRequestSchema,
  CheckRefillStatusSchema,
  LogLabResultInquirySchema,
  type PharmacyPreference,
  type CreateRefillRequestInput,
  type CheckRefillStatusInput,
  type LogLabResultInquiryInput,
} from "./clinical";

// Records
export {
  RecordsTypeEnum,
  DestinationTypeEnum,
  LogRecordsRequestSchema,
  type RecordsType,
  type DestinationType,
  type LogRecordsRequestInput,
} from "./records";

// Billing
export {
  BillingInquiryTypeEnum,
  LogBillingInquirySchema,
  type BillingInquiryType,
  type LogBillingInquiryInput,
} from "./billing";

// Info
export {
  ClinicInfoCategoryEnum,
  GetClinicInfoSchema,
  type ClinicInfoCategory,
  type GetClinicInfoInput,
} from "./info";

// Action Card Output (Structured Data Plan)
export {
  ACTION_CARD_OUTPUT_SCHEMA,
  ACTION_CARD_OUTPUT_CONFIG,
  type ActionCardOutput,
} from "./action-card-output";
