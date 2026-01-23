/**
 * Clinic Utilities - Re-export Module
 *
 * This file re-exports all clinic utilities for backward compatibility.
 * New code should import from the specific modules directly.
 *
 * @example
 * ```ts
 * // Backward compatible (existing imports continue to work)
 * import { getClinicByUserId, getOrCreateClinic } from "@odis-ai/domain/clinics";
 *
 * // Preferred for new code (more explicit)
 * import { getClinicByUserId } from "@odis-ai/domain/clinics/clinic-lookup";
 * import { getOrCreateClinic } from "@odis-ai/domain/clinics/clinic-creation";
 * ```
 */

// Clinic lookup functions
export {
  getClinicByUserId,
  getClinicByName,
  getClinicById,
  getClinicBySlug,
  getUserClinicId,
} from "./clinic-lookup";

// Clinic slug utilities
export { ensureUniqueClinicSlug, generateSlugFromName } from "./clinic-slug";

// User clinic access functions
export {
  getUserIdsByClinicName,
  getClinicUserIds,
  getUserClinics,
  getUserPrimaryClinic,
  userHasClinicAccess,
  getClinicUserIdsEnhanced,
} from "./user-clinic-access";

// Clinic scope filter utilities
export {
  buildClinicScopeFilter,
  buildClinicScopeFilterWithOptions,
} from "./clinic-scope-filter";

// Clinic and provider creation
export { getOrCreateClinic, getOrCreateProvider } from "./clinic-creation";
