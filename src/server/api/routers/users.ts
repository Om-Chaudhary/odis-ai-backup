import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const userRoleEnum = z.enum([
  "veterinarian",
  "vet_tech",
  "admin",
  "practice_owner",
  "client",
]);

const userSchema = z.object({
  email: z.string().email("Valid email is required"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  role: userRoleEnum,
  clinic_name: z.string().nullable().optional(),
  license_number: z.string().nullable().optional(),
  onboarding_completed: z.boolean().default(false),
  avatar_url: z.string().nullable().optional(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const usersRouter = createTRPCRouter({
  /**
   * List all users with optional filters
   */
  listUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: userRoleEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.serviceClient
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      // Search by name or email
      if (input.search) {
        query = query.or(
          `email.ilike.%${input.search}%,first_name.ilike.%${input.search}%,last_name.ilike.%${input.search}%`
        );
      }

      // Filter by role
      if (input.role) {
        query = query.eq("role", input.role);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch users",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Get single user by ID
   */
  getUser: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.serviceClient
        .from("users")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Create new user (requires creating auth user first, then profile)
   */
  createUser: adminProcedure
    .input(
      userSchema.extend({
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { password, ...profileData } = input;

      // Create auth user using Supabase Admin API
      const { data: authData, error: authError } =
        await ctx.supabase.auth.admin.createUser({
          email: input.email,
          password: password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            first_name: input.first_name,
            last_name: input.last_name,
          },
        });

      if (authError || !authData.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: authError?.message ?? "Failed to create auth user",
          cause: authError,
        });
      }

      // Create user profile
      const { data: userData, error: userError } = await ctx.serviceClient
        .from("users")
        .insert({
          id: authData.user.id,
          ...profileData,
        })
        .select()
        .single();

      if (userError) {
        // If profile creation fails, we should delete the auth user
        await ctx.supabase.auth.admin.deleteUser(authData.user.id);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user profile",
          cause: userError,
        });
      }

      return userData;
    }),

  /**
   * Update user profile
   */
  updateUser: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: userSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.serviceClient
        .from("users")
        .update(input.data)
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Delete user (deletes both auth user and profile)
   */
  deleteUser: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Delete user profile first
      const { error: profileError } = await ctx.serviceClient
        .from("users")
        .delete()
        .eq("id", input.id);

      if (profileError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete user profile",
          cause: profileError,
        });
      }

      // Delete auth user
      const { error: authError } = await ctx.supabase.auth.admin.deleteUser(
        input.id
      );

      if (authError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete auth user",
          cause: authError,
        });
      }

      return { success: true };
    }),

  /**
   * Reset user password (admin only)
   */
  resetUserPassword: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        newPassword: z
          .string()
          .min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.auth.admin.updateUserById(
        input.userId,
        {
          password: input.newPassword,
        }
      );

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reset password",
          cause: error,
        });
      }

      return { success: true };
    }),
});
