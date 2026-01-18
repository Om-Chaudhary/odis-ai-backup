/**
 * Admin Middleware
 *
 * Provides admin-only middleware for tRPC procedures.
 * Only users with role='admin' in the users table can access these procedures.
 */

import { TRPCError } from "@trpc/server";
import { protectedProcedure, middleware } from "~/server/api/trpc";

/**
 * Admin middleware - verifies user has admin role
 */
export const adminMiddleware = middleware(async ({ ctx, next }) => {
  const userId = ctx.user?.id;

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  // Check user role from database
  const { data: profile, error } = await ctx.supabase
    .from("users")
    .select("role, clinic_name")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch user profile",
    });
  }

  if (profile.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      adminProfile: profile,
    },
  });
});

/**
 * Admin procedure - requires admin role
 * Exported so it can be reused in other admin routers
 */
export const adminProcedure = protectedProcedure.use(adminMiddleware);
