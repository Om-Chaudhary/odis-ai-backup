/**
 * Dashboard User Procedures
 *
 * Provides user-related queries for the dashboard.
 */

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  /**
   * Get current user's role from the database
   *
   * Returns the user's role (e.g., 'admin', 'user', etc.) from the users table.
   * This checks the system-level super admin role, not organization roles.
   *
   * Works with both Clerk and Supabase Auth via ctx.userId.
   */
  getCurrentUserRole: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      return { role: null };
    }

    // Query users table for the current user's role
    // Works with both Clerk and Supabase Auth since ctx.userId is the Supabase user ID
    const { data: profile, error } = await ctx.supabase
      .from("users")
      .select("role")
      .eq("id", ctx.userId)
      .single();

    if (error || !profile) {
      console.error("[getCurrentUserRole] Error fetching user role:", error);
      return { role: null };
    }

    return { role: profile.role };
  }),
});
