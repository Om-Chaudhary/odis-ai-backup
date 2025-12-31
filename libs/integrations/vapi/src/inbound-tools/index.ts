/**
 * Inbound Squad Tool Utilities
 *
 * Shared utilities for VAPI inbound squad tool endpoints.
 * Provides argument extraction, response building, and clinic lookup.
 *
 * @example
 * ```ts
 * import {
 *   extractToolArguments,
 *   buildVapiResponse,
 *   buildSuccessResponse,
 *   buildErrorResponse,
 *   findClinicByAssistantId,
 *   handleCorsPreflightRequest,
 *   LogEmergencyTriageSchema,
 * } from "@odis-ai/integrations/vapi/inbound-tools";
 * ```
 */

// Tool argument extraction
export {
  extractToolArguments,
  type ExtractedToolArgs,
} from "./extract-tool-arguments";

// Response building
export {
  buildVapiResponse,
  buildSuccessResponse,
  buildErrorResponse,
  handleCorsPreflightRequest,
  type VapiToolResult,
} from "./build-vapi-response";

// Clinic lookup
export {
  findClinicByAssistantId,
  findClinicWithConfigByAssistantId,
  findClinicById,
  findClinicWithConfigById,
  type ClinicLookupResult,
  type ClinicWithConfig,
} from "./find-clinic-by-assistant";

// Schemas
export {
  // Emergency Agent
  LogEmergencyTriageSchema,
  SpeciesEnum,
  UrgencyLevelEnum,
  TriageActionEnum,
  GetErInfoSchema,
  type LogEmergencyTriageInput,
  type Species,
  type UrgencyLevel,
  type TriageAction,
  type GetErInfoInput,

  // Clinical Agent
  CreateRefillRequestSchema,
  CheckRefillStatusSchema,
  LogLabResultInquirySchema,
  PharmacyPreferenceEnum,
  type CreateRefillRequestInput,
  type CheckRefillStatusInput,
  type LogLabResultInquiryInput,
  type PharmacyPreference,

  // Admin Agent
  LeaveMessageSchema,
  LogRecordsRequestSchema,
  LogBillingInquirySchema,
  MessageTypeEnum,
  RecordsTypeEnum,
  DestinationTypeEnum,
  BillingInquiryTypeEnum,
  type LeaveMessageInput,
  type LogRecordsRequestInput,
  type LogBillingInquiryInput,
  type MessageType,
  type RecordsType,
  type DestinationType,
  type BillingInquiryType,

  // Appointment Agent
  CancelAppointmentSchema,
  RescheduleAppointmentSchema,
  type CancelAppointmentInput,
  type RescheduleAppointmentInput,

  // Info Agent
  GetClinicInfoSchema,
  ClinicInfoCategoryEnum,
  type GetClinicInfoInput,
  type ClinicInfoCategory,
} from "./schemas";
