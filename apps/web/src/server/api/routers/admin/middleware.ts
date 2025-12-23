/**
 * Admin Middleware
 *
 * Provides role-based access control for admin procedures.
 * Only users with role === 'admin' can access admin routes.
 */

import { TRPCError } from "@trpc/server";
import { middleware, protectedProcedure } from "~/server/api/trpc";

/**
 * Middleware that verifies the user has admin role.
 * Must be used on all admin procedures.
 */
export const adminMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Fetch user profile to check role
  const { data: profile, error } = await ctx.supabase
    .from("users")
    .select("role")
    .eq("id", ctx.user.id)
    .single();

  if (error) {
    console.error("[Admin Middleware] Failed to fetch user profile:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to verify admin access",
    });
  }

  if (profile?.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      isAdmin: true as const,
    },
  });
});

/**
 * Protected procedure that requires admin role.
 * Use this for all admin-only queries and mutations.
 */
export const adminProcedure = protectedProcedure.use(adminMiddleware);
