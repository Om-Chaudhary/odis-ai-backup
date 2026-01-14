/**
 * VAPI Clinic Resolver
 *
 * Resolves VAPI assistant IDs to clinic records.
 * Re-exports from inbound-tools for consistency.
 *
 * @module vapi/core/clinic-resolver
 */

// Re-export the existing, well-tested implementation
export {
  findClinicByAssistantId,
  findClinicWithConfigByAssistantId,
  findClinicById,
  findClinicWithConfigById,
  type ClinicLookupResult,
  type ClinicWithConfig,
} from "../inbound-tools/find-clinic-by-assistant";

// Convenience aliases
export {
  findClinicByAssistantId as resolveClinic,
  findClinicWithConfigByAssistantId as resolveClinicWithConfig,
} from "../inbound-tools/find-clinic-by-assistant";
