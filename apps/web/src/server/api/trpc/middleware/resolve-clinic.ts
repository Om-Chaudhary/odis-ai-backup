/**
 * Clinic Resolution Middleware
 *
 * Provides clinic-aware middleware for tRPC procedures.
 * Extracts common clinic resolution patterns used across 33+ procedures.
 *
 * Patterns supported:
 * - Basic clinic resolution (getClinicByUserId + getClinicUserIds)
 * - Clinic slug with fallback (for admin viewing other clinics)
 * - Entity ownership verification (verify entity belongs to clinic)
 */

import { TRPCError } from "@trpc/server";
import { middleware } from "~/server/api/trpc";
import {
  getClinicByUserId,
  getClinicBySlug,
  getClinicUserIds,
  getUserIdsByClinicName,
  userHasClinicAccess,
  buildClinicScopeFilter,
  getClinicUserIdsEnhanced,
} from "@odis-ai/domain/clinics";
import type { Database } from "@odis-ai/shared/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Clinic row type from database
 */
type ClinicRow = Database["public"]["Tables"]["clinics"]["Row"];

/**
 * Context additions from clinic middleware
 */
export interface ClinicContext {
  /** Resolved clinic (null if user has no clinic) */
  clinic: ClinicRow | null;
  /** User IDs belonging to the clinic (for legacy user_id scoping) */
  clinicUserIds: string[];
  /** Pre-built filter string for Supabase .or() queries */
  clinicScopeFilter: string;
}

/**
 * Extended clinic context when using slug-based resolution
 */
export interface ClinicWithSlugContext extends ClinicContext {
  /** Whether clinic was resolved from slug (vs user's default) */
  resolvedFromSlug: boolean;
}

/**
 * Basic clinic middleware
 *
 * Resolves the authenticated user's clinic and provides:
 * - ctx.clinic: Full clinic record (or null)
 * - ctx.clinicUserIds: All user IDs in the clinic
 * - ctx.clinicScopeFilter: Pre-built filter for .or() queries
 *
 * Use this for procedures that only need the user's own clinic.
 *
 * @example
 * ```ts
 * const myProcedure = protectedProcedure
 *   .use(clinicMiddleware)
 *   .query(async ({ ctx }) => {
 *     const { data } = await ctx.supabase
 *       .from("cases")
 *       .select("*")
 *       .or(ctx.clinicScopeFilter);
 *     return data;
 *   });
 * ```
 */
export const clinicMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const clinic = await getClinicByUserId(ctx.userId, ctx.supabase);

  // Get all user IDs in the clinic
  // Use enhanced version if we have a clinic ID for multi-tenant support
  const clinicUserIds = clinic?.id
    ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
    : await getClinicUserIds(ctx.userId, ctx.supabase);

  const clinicScopeFilter = buildClinicScopeFilter(clinic?.id, clinicUserIds);

  return next({
    ctx: {
      ...ctx,
      clinic,
      clinicUserIds,
      clinicScopeFilter,
    },
  });
});

/**
 * Options for clinic slug resolution
 */
interface ClinicSlugOptions {
  /** Clinic slug from input (optional) */
  clinicSlug?: string;
  /** Whether to verify the user has access to the clinic (default: true) */
  verifyAccess?: boolean;
  /** Whether to throw if clinic slug is provided but not found (default: true) */
  throwOnNotFound?: boolean;
}

/**
 * Resolve clinic with optional slug override
 *
 * This is a helper function for procedures that need to support both:
 * 1. User's default clinic (when no slug provided)
 * 2. Admin viewing another clinic (when slug provided)
 *
 * @param userId - Authenticated user ID
 * @param supabase - Supabase client
 * @param options - Resolution options
 * @returns Resolved clinic context
 *
 * @example
 * ```ts
 * const myProcedure = protectedProcedure
 *   .input(z.object({ clinicSlug: z.string().optional() }))
 *   .query(async ({ ctx, input }) => {
 *     const clinicCtx = await resolveClinicWithSlug(
 *       ctx.userId,
 *       ctx.supabase,
 *       { clinicSlug: input.clinicSlug }
 *     );
 *     // Use clinicCtx.clinic, clinicCtx.clinicUserIds, etc.
 *   });
 * ```
 */
export async function resolveClinicWithSlug(
  userId: string,
  supabase: SupabaseClient<Database>,
  options: ClinicSlugOptions = {},
): Promise<ClinicWithSlugContext> {
  const { clinicSlug, verifyAccess = true, throwOnNotFound = true } = options;

  let clinic: ClinicRow | null = null;
  let resolvedFromSlug = false;

  if (clinicSlug) {
    clinic = await getClinicBySlug(clinicSlug, supabase);

    if (!clinic && throwOnNotFound) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Clinic not found",
      });
    }

    if (clinic && verifyAccess) {
      const hasAccess = await userHasClinicAccess(userId, clinic.id, supabase);
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this clinic",
        });
      }
    }

    resolvedFromSlug = !!clinic;
  }

  // Fall back to user's default clinic if no slug or slug not found
  clinic ??= await getClinicByUserId(userId, supabase);

  // Get clinic user IDs
  const clinicUserIds = clinic?.id
    ? await getClinicUserIdsEnhanced(clinic.id, supabase)
    : await getClinicUserIds(userId, supabase);

  const clinicScopeFilter = buildClinicScopeFilter(clinic?.id, clinicUserIds);

  return {
    clinic,
    clinicUserIds,
    clinicScopeFilter,
    resolvedFromSlug,
  };
}

/**
 * Entity ownership verification options
 */
interface VerifyOwnershipOptions {
  /** Entity's clinic_name field (for legacy records) */
  entityClinicName?: string | null;
  /** Entity's clinic_id field (for new records) */
  entityClinicId?: string | null;
  /** Custom error message for forbidden access */
  forbiddenMessage?: string;
  /** Custom error message for not found */
  notFoundMessage?: string;
}

/**
 * Verify entity belongs to user's clinic
 *
 * Use this for Pattern C: Entity ownership checks where you need to
 * verify that an entity (case, call, appointment) belongs to the user's clinic.
 *
 * @param clinic - User's resolved clinic (from clinicMiddleware)
 * @param entity - The entity being accessed (must exist, null = not found)
 * @param options - Verification options
 * @throws TRPCError NOT_FOUND if entity is null
 * @throws TRPCError FORBIDDEN if entity doesn't belong to clinic
 *
 * @example
 * ```ts
 * const myProcedure = protectedProcedure
 *   .use(clinicMiddleware)
 *   .input(z.object({ caseId: z.string() }))
 *   .query(async ({ ctx, input }) => {
 *     const { data: caseData } = await ctx.supabase
 *       .from("cases")
 *       .select("*, clinic_name")
 *       .eq("id", input.caseId)
 *       .single();
 *
 *     verifyClinicOwnership(ctx.clinic, caseData, {
 *       entityClinicName: caseData?.clinic_name,
 *     });
 *
 *     return caseData;
 *   });
 * ```
 */
export function verifyClinicOwnership<T>(
  clinic: ClinicRow | null,
  entity: T | null,
  options: VerifyOwnershipOptions = {},
): asserts entity is NonNullable<T> {
  const {
    entityClinicName,
    entityClinicId,
    forbiddenMessage = "You do not have access to this resource",
    notFoundMessage = "Resource not found",
  } = options;

  // Check entity exists
  if (!entity) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: notFoundMessage,
    });
  }

  // Skip ownership check if user has no clinic (admin or legacy)
  if (!clinic) {
    return;
  }

  // Check by clinic_id (preferred for new records)
  if (entityClinicId && entityClinicId !== clinic.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: forbiddenMessage,
    });
  }

  // Check by clinic_name (for legacy records)
  if (
    entityClinicName &&
    clinic.name &&
    entityClinicName.toLowerCase() !== clinic.name.toLowerCase()
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: forbiddenMessage,
    });
  }
}

/**
 * Get user IDs by clinic name (re-export for convenience)
 *
 * This is useful when you need to get user IDs for a specific clinic
 * without the full clinic resolution flow.
 */
export { getUserIdsByClinicName };

/**
 * Build clinic scope filter (re-export for convenience)
 *
 * Use this when you need to build custom filters outside the middleware.
 */
export { buildClinicScopeFilter };

/**
 * Check if user has clinic access (re-export for convenience)
 *
 * Use for manual access checks outside the middleware flow.
 */
export { userHasClinicAccess };
