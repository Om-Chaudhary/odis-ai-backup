/**
 * List Users Procedure
 *
 * Returns paginated list of all users with filtering and sorting.
 */

import { TRPCError } from "@trpc/server";
import { createServiceClient } from "@odis-ai/db/server";
import { createTRPCRouter } from "~/server/api/trpc";
import { adminProcedure } from "../middleware";
import { listUsersInput, getUserInput, updateUserInput } from "../schemas";

export const listUsersRouter = createTRPCRouter({
  listUsers: adminProcedure
    .input(listUsersInput)
    .query(async ({ input }) => {
      const supabase = await createServiceClient();

      try {
        let query = supabase.from("users").select(
          `
            id,
            email,
            first_name,
            last_name,
            role,
            clinic_name,
            clinic_email,
            clinic_phone,
            test_mode_enabled,
            onboarding_completed,
            created_at,
            updated_at
          `,
          { count: "exact" },
        );

        // Apply search filter
        if (input.search) {
          const searchTerm = `%${input.search}%`;
          query = query.or(
            `email.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},clinic_name.ilike.${searchTerm}`,
          );
        }

        // Apply role filter
        if (input.role) {
          query = query.eq("role", input.role);
        }

        // Apply clinic name filter
        if (input.clinicName) {
          query = query.ilike("clinic_name", `%${input.clinicName}%`);
        }

        // Apply sorting
        query = query.order(input.sortBy, {
          ascending: input.sortOrder === "asc",
        });

        // Apply pagination
        const from = (input.page - 1) * input.pageSize;
        const to = from + input.pageSize - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;

        if (error) throw error;

        // Transform data to camelCase
        const users = (data ?? []).map((user) => ({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          clinicName: user.clinic_name,
          clinicEmail: user.clinic_email,
          clinicPhone: user.clinic_phone,
          testModeEnabled: user.test_mode_enabled,
          onboardingCompleted: user.onboarding_completed,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        }));

        return {
          users,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            total: count ?? 0,
            totalPages: Math.ceil((count ?? 0) / input.pageSize),
          },
        };
      } catch (error) {
        console.error("[Admin List Users] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch users",
        });
      }
    }),

  getUser: adminProcedure.input(getUserInput).query(async ({ input }) => {
    const supabase = await createServiceClient();

    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", input.userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        throw error;
      }

      // Get user's case count
      const { count: caseCount } = await supabase
        .from("cases")
        .select("*", { count: "exact", head: true })
        .eq("user_id", input.userId);

      // Get user's patient count
      const { count: patientCount } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("user_id", input.userId);

      // Get user's call count
      const { count: callCount } = await supabase
        .from("scheduled_discharge_calls")
        .select("*", { count: "exact", head: true })
        .eq("user_id", input.userId);

      // Get user's email count
      const { count: emailCount } = await supabase
        .from("scheduled_discharge_emails")
        .select("*", { count: "exact", head: true })
        .eq("user_id", input.userId);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          clinicName: user.clinic_name,
          clinicEmail: user.clinic_email,
          clinicPhone: user.clinic_phone,
          emergencyPhone: user.emergency_phone,
          testModeEnabled: user.test_mode_enabled,
          onboardingCompleted: user.onboarding_completed,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          // Discharge settings
          preferredEmailStartTime: user.preferred_email_start_time,
          preferredEmailEndTime: user.preferred_email_end_time,
          preferredCallStartTime: user.preferred_call_start_time,
          preferredCallEndTime: user.preferred_call_end_time,
          emailDelayDays: user.email_delay_days,
          callDelayDays: user.call_delay_days,
          maxCallRetries: user.max_call_retries,
        },
        stats: {
          cases: caseCount ?? 0,
          patients: patientCount ?? 0,
          calls: callCount ?? 0,
          emails: emailCount ?? 0,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[Admin Get User] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user",
      });
    }
  }),

  updateUser: adminProcedure
    .input(updateUserInput)
    .mutation(async ({ input }) => {
      const supabase = await createServiceClient();

      try {
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (input.updates.role !== undefined) {
          updateData.role = input.updates.role;
        }
        if (input.updates.testModeEnabled !== undefined) {
          updateData.test_mode_enabled = input.updates.testModeEnabled;
        }
        if (input.updates.clinicName !== undefined) {
          updateData.clinic_name = input.updates.clinicName;
        }

        const { data, error } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", input.userId)
          .select("id")
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "User not found",
            });
          }
          throw error;
        }

        return { success: true, userId: data.id };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Admin Update User] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user",
        });
      }
    }),
});
