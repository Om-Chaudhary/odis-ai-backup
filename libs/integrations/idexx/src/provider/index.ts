/**
 * @odis-ai/integrations/idexx/provider
 *
 * IDEXX Neo provider implementation (IPimsProvider)
 */

export * from "./idexx-provider";
export * from "./auth-client";
export * from "./schedule-client";
export * from "./consultation-client";
export * from "./types";
// Re-export appointment management types, excluding duplicates
// IdexxPatient, IdexxClient, IdexxProvider are also in appointment-management-types
// but we prefer those versions as they're more specific to appointment workflows
export {
  type CreateAppointmentInput,
  type AppointmentOperationResult,
  type IdexxPatient,
  type IdexxClient,
  type IdexxProvider as IdexxProviderInfo,
  type IdexxAppointmentType,
  type IdexxRoom,
  type SearchPatientParams,
  type PatientSearchResult,
  type IdexxAppointmentCreatePayload,
  type IdexxAppointmentResponse,
  type AppointmentSearchOptions,
  type CancelAppointmentInput,
  type IdexxAppointmentViewData,
  type IdexxAppointmentDetails,
  type GetAppointmentResult,
  type IdexxAppointmentCreateFormData,
} from "./appointment-management-types";
export * from "./appointment-management-client";
