/**
 * tRPC Middleware Exports
 *
 * Re-exports all middleware for convenient imports.
 */

export {
  clinicMiddleware,
  resolveClinicWithSlug,
  verifyClinicOwnership,
  getUserIdsByClinicName,
  buildClinicScopeFilter,
  userHasClinicAccess,
  type ClinicContext,
  type ClinicWithSlugContext,
} from "./resolve-clinic";
