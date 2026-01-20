import { createTRPCRouter } from "~/server/api/trpc";
import { adminProcedure } from "../middleware";
import {
  listUsersSchema,
  getUserByIdSchema,
  inviteUserSchema,
  updateUserRoleSchema,
  grantClinicAccessSchema,
  revokeClinicAccessSchema,
  deactivateUserSchema,
  getUserActivitySchema,
} from "./schemas";
import { TRPCError } from "@trpc/server";

export const adminUsersRouter = createTRPCRouter({
  /**
   * List all users with optional search and filtering
   */
  list: adminProcedure.input(listUsersSchema).query(async ({ ctx, input }) => {
    const supabase = ctx.supabase;

    let query = supabase.from("users").select("*", { count: "exact" });

    // Apply filters
    if (input.search) {
      query = query.or(
        `email.ilike.%${input.search}%,first_name.ilike.%${input.search}%,last_name.ilike.%${input.search}%`,
      );
    }

    if (input.role && input.role !== "all") {
      query = query.eq("role", input.role);
    }

    // Apply pagination
    query = query
      .order("created_at", { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch users",
        cause: error,
      });
    }

    // If filtering by clinic, get clinic access
    let users = data ?? [];

    if (input.clinicId) {
      const { data: clinicAccess } = await supabase
        .from("user_clinic_access")
        .select("user_id")
        .eq("clinic_id", input.clinicId);

      const clinicUserIds = new Set(clinicAccess?.map((a) => a.user_id) ?? []);
      users = users.filter((u) => clinicUserIds.has(u.id));
    }

    return {
      users,
      total: count ?? 0,
    };
  }),

  /**
   * Get a single user by ID with clinic assignments
   */
  getById: adminProcedure
    .input(getUserByIdSchema)
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", input.userId)
        .single();

      if (error || !user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Get clinic access
      const { data: clinicAccess } = await supabase
        .from("user_clinic_access")
        .select(
          `
          clinic_id,
          role,
          clinics (
            id,
            name,
            slug,
            is_active
          )
        `,
        )
        .eq("user_id", input.userId);

      return {
        ...user,
        clinics: clinicAccess ?? [],
      };
    }),

  /**
   * Invite a new user (creates invitation record)
   */
  invite: adminProcedure
    .input(inviteUserSchema)
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      // Check if user already exists
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", input.email)
        .single();

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists",
        });
      }

      // Create invitation
      // Note: In a real implementation, this would use the invitation service
      // For now, we'll just return a success message
      return {
        success: true,
        message: `Invitation will be sent to ${input.email}`,
      };
    }),

  /**
   * Update a user's platform role
   */
  updateRole: adminProcedure
    .input(updateUserRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const { data, error } = await supabase
        .from("users")
        .update({ role: input.role })
        .eq("id", input.userId)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user role",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Grant a user access to a clinic
   */
  grantClinicAccess: adminProcedure
    .input(grantClinicAccessSchema)
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      // Check if access already exists
      const { data: existing } = await supabase
        .from("user_clinic_access")
        .select("*")
        .eq("user_id", input.userId)
        .eq("clinic_id", input.clinicId)
        .single();

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already has access to this clinic",
        });
      }

      const { data, error } = await supabase
        .from("user_clinic_access")
        .insert({
          user_id: input.userId,
          clinic_id: input.clinicId,
          role: input.role,
        })
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to grant clinic access",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Revoke a user's access to a clinic
   */
  revokeClinicAccess: adminProcedure
    .input(revokeClinicAccessSchema)
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const { error } = await supabase
        .from("user_clinic_access")
        .delete()
        .eq("user_id", input.userId)
        .eq("clinic_id", input.clinicId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to revoke clinic access",
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * Deactivate a user (soft delete)
   */
  deactivate: adminProcedure
    .input(deactivateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      // In a real implementation, you'd have an is_active column
      // For now, we'll just remove their clinic access
      const { error } = await supabase
        .from("user_clinic_access")
        .delete()
        .eq("user_id", input.userId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to deactivate user",
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * Get recent activity for a user
   */
  getUserActivity: adminProcedure
    .input(getUserActivitySchema)
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      // Get recent cases created by user with patient name from canonical_patients
      const { data: cases } = await supabase
        .from("cases")
        .select(
          `
          id,
          created_at,
          canonical_patients (
            name
          )
        `,
        )
        .eq("user_id", input.userId)
        .order("created_at", { ascending: false })
        .limit(input.limit);

      // Transform cases to include patient_name at top level
      const transformedCases = (cases ?? []).map((c) => ({
        id: c.id,
        created_at: c.created_at,
        patient_name:
          (c.canonical_patients as { name: string } | null)?.name ?? null,
      }));

      // Get recent calls made by user
      const { data: calls } = await supabase
        .from("scheduled_discharge_calls")
        .select("id, status, created_at")
        .eq("user_id", input.userId)
        .order("created_at", { ascending: false })
        .limit(input.limit);

      return {
        cases: transformedCases,
        calls: calls ?? [],
      };
    }),
});
