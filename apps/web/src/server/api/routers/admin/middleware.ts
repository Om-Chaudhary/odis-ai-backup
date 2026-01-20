/**
 * Admin Middleware
 *
 * Provides admin-only middleware for tRPC procedures.
 * Uses hybrid auth: checks both Clerk users and Supabase Auth users.
 *
 * Super admins (role='admin' in users table) have system-wide access.
 */

import { TRPCError } from "@trpc/server";
import { protectedProcedure, middleware } from "~/server/api/trpc";

/**
 * Admin middleware - verifies user has super admin role
 *
 * Works with both Clerk and Supabase Auth via direct query to users table.
 */
export const adminMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  // Check if user is super admin via direct query (works with both Clerk and Supabase Auth)
  const { data: adminCheck, error } = await ctx.supabase
    .from("users")
    .select("role")
    .eq("id", ctx.userId)
    .single();

  if (error) {
    console.error("[Admin Middleware] Error checking admin status:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to verify admin access",
    });
  }

  if (adminCheck?.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Super admin access required",
    });
  }

  // Get user profile for additional context
  let profileResult;

  if (ctx.isClerkAuth && ctx.userId) {
    // For Clerk users, look up by id (Clerk userId is stored as user id)
    profileResult = await ctx.supabase
      .from("users")
      .select("id, role, clinic_name")
      .eq("id", ctx.userId)
      .single();
  } else if (ctx.user) {
    // For Supabase users, look up by user ID
    profileResult = await ctx.supabase
      .from("users")
      .select("id, role, clinic_name")
      .eq("id", ctx.user.id)
      .single();
  } else {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unable to fetch user profile",
    });
  }

  if (profileResult.error || !profileResult.data) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch admin profile",
    });
  }

  return next({
    ctx: {
      ...ctx,
      adminProfile: profileResult.data,
    },
  });
});

/**
 * Admin procedure - requires super admin role
 *
 * Works with both Clerk (web) and Supabase Auth (iOS).
 * Exported so it can be reused in other admin routers.
 */
export const adminProcedure = protectedProcedure.use(adminMiddleware);
