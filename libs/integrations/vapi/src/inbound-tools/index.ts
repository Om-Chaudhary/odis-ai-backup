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
  type LogEmergencyTriageInput,
  type Species,
  type UrgencyLevel,
  type TriageAction,

  // Clinical Agent
  CreateRefillRequestSchema,
  PharmacyPreferenceEnum,
  type CreateRefillRequestInput,
  type PharmacyPreference,

  // Admin Agent
  LeaveMessageSchema,
  MessageTypeEnum,
  type LeaveMessageInput,
  type MessageType,

  // Appointment Agent
  CancelAppointmentSchema,
  RescheduleAppointmentSchema,
  type CancelAppointmentInput,
  type RescheduleAppointmentInput,
} from "./schemas";
