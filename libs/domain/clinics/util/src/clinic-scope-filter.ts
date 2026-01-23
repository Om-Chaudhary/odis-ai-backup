/**
 * Clinic Scope Filter Utilities
 *
 * Functions for building hybrid filters that support both clinic-based
 * and legacy user-based data scoping.
 */

import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.database.child("clinics");

/**
 * Build a hybrid filter for clinic-scoped queries
 *
 * Creates an OR filter that matches records by:
 * 1. clinic_id = clinicId (new multi-tenant pattern, e.g., synced cases)
 * 2. user_id IN userIds (legacy pattern, e.g., iOS app cases)
 *
 * This enables backward compatibility during the transition from
 * user-based to clinic-based data scoping.
 *
 * @param clinicId - Clinic UUID (can be null/undefined for legacy fallback)
 * @param clinicUserIds - Array of user IDs in the clinic (for legacy records)
 * @returns Filter string for Supabase `.or()` method
 *
 * @example
 * ```ts
 * // With clinic ID (hybrid filter)
 * const filter = buildClinicScopeFilter(clinic?.id, clinicUserIds);
 * // Returns: "clinic_id.eq.abc-123,user_id.in.(user-1,user-2)"
 *
 * // Without clinic ID (legacy fallback)
 * const filter = buildClinicScopeFilter(null, clinicUserIds);
 * // Returns: "user_id.in.(user-1,user-2)"
 *
 * const { data } = await supabase
 *   .from("cases")
 *   .select("*")
 *   .or(filter);
 * ```
 */
export function buildClinicScopeFilter(
  clinicId: string | null | undefined,
  clinicUserIds: string[],
): string {
  const parts: string[] = [];

  if (clinicId) {
    parts.push(`clinic_id.eq.${clinicId}`);
  }

  if (clinicUserIds.length > 0) {
    parts.push(`user_id.in.(${clinicUserIds.join(",")})`);
  }

  if (parts.length > 0) {
    return parts.join(",");
  }

  logger.warn("buildClinicScopeFilter called with no clinicId and no userIds");
  return "id.eq.00000000-0000-0000-0000-000000000000";
}

/**
 * Build a hybrid filter for related tables (e.g., calls, emails)
 *
 * Similar to buildClinicScopeFilter but for tables that reference cases
 * through user_id (legacy) or need clinic-based filtering.
 *
 * @param clinicId - Clinic UUID (required)
 * @param clinicUserIds - Array of user IDs in the clinic
 * @param options - Additional filter options
 * @returns Filter string for Supabase `.or()` method
 */
export function buildClinicScopeFilterWithOptions(
  clinicId: string,
  clinicUserIds: string[],
  _options?: {
    /** Include null clinic_id records owned by clinic users */
    includeNullClinicId?: boolean;
  },
): string {
  const parts: string[] = [];

  parts.push(`clinic_id.eq.${clinicId}`);

  if (clinicUserIds.length > 0) {
    parts.push(`user_id.in.(${clinicUserIds.join(",")})`);
  }

  return parts.join(",");
}
