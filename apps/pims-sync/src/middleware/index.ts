/**
 * Middleware Index
 *
 * Export all middleware from a single entry point.
 */

export {
  apiKeyAuth,
  requirePermission,
  type AuthenticatedRequest,
} from "./api-key-auth";
