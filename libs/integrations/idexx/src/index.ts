/**
 * @odis-ai/idexx
 *
 * IDEXX integration library.
 * Includes data transformation, validation, credential management,
 * browser automation, and PIMS provider implementation.
 */

export * from "./transformer";
export * from "./validation";
// Export page-data types with renamed exports to avoid conflicts with provider types
export {
  type IdexxPageData,
  type IdexxStaffMember,
  type IdexxPatient as IdexxPageDataPatient,
  type IdexxClient as IdexxPageDataClient,
  type IdexxConsultation,
  type IdexxClinic,
} from "./types";
export * from "./credential-manager";

// Browser automation (also available via @odis-ai/integrations/idexx/browser)
export * from "./browser";

// PIMS provider (also available via @odis-ai/integrations/idexx/provider)
// Exports IdexxPatient, IdexxClient from appointment-management-types
export * from "./provider";
