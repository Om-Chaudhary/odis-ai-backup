/**
 * Admin Router
 *
 * Provides admin-only procedures for managing scheduled items across the clinic.
 * Only users with role='admin' in the users table can access these procedures.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter } from "~/server/api/trpc";
import { adminProcedure } from "./middleware";
import { adminClinicsRouter } from "./clinics/router";
import { adminUsersRouter } from "./users/router";
import { adminSyncRouter } from "./sync/router";

/**
 * Scheduled item type for unified response
 */
interface ScheduledItem {
  id: string;
  type: "call" | "email";
  userId: string;
  userEmail: string | null;
  userName: string | null;
  scheduledFor: string | null;
  status: string;
  patientName: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  caseId: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export const adminRouter = createTRPCRouter({
  // Sub-routers
  clinics: adminClinicsRouter,
  users: adminUsersRouter,
  sync: adminSyncRouter,

  /**
   * Get all scheduled items for users in the same clinic
   */
  getClinicScheduledItems: adminProcedure
    .input(
      z.object({
        statusFilter: z
          .enum([
            "all",
            "queued",
            "in_progress",
            "completed",
            "failed",
            "cancelled",
          ])
          .default("all"),
        typeFilter: z.enum(["all", "call", "email"]).default("all"),
        limit: z.number().min(1).max(200).default(100),
      }),
    )
    .query(async ({ ctx, input }) => {
      const clinicName = ctx.adminProfile.clinic_name;

      if (!clinicName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Admin user must belong to a clinic",
        });
      }

      // Get all user IDs in the same clinic
      const { data: clinicUsers, error: usersError } = await ctx.supabase
        .from("users")
        .select("id, email, first_name, last_name")
        .eq("clinic_name", clinicName);

      if (usersError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch clinic users",
        });
      }

      const userIds = clinicUsers?.map((u) => u.id) ?? [];
      const userMap = new Map(
        clinicUsers?.map((u) => [
          u.id,
          {
            email: u.email,
            name:
              u.first_name || u.last_name
                ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                : null,
          },
        ]),
      );

      if (userIds.length === 0) {
        return { items: [], totalCount: 0 };
      }

      const items: ScheduledItem[] = [];

      // Fetch scheduled calls if type filter allows
      if (input.typeFilter === "all" || input.typeFilter === "call") {
        let callsQuery = ctx.supabase
          .from("scheduled_discharge_calls")
          .select(
            `
            id,
            user_id,
            scheduled_for,
            status,
            customer_phone,
            case_id,
            created_at,
            dynamic_variables,
            metadata
          `,
          )
          .in("user_id", userIds)
          .order("scheduled_for", { ascending: true, nullsFirst: false })
          .limit(input.limit);

        if (input.statusFilter !== "all") {
          const statusMap: Record<string, string> = {
            in_progress: "in-progress",
            queued: "queued",
            completed: "completed",
            failed: "failed",
            cancelled: "cancelled",
          };
          callsQuery = callsQuery.eq(
            "status",
            statusMap[input.statusFilter] ?? input.statusFilter,
          );
        }

        const { data: calls } = await callsQuery;

        if (calls) {
          for (const call of calls) {
            const user = userMap.get(call.user_id);
            const dynamicVars =
              (call.dynamic_variables as Record<string, unknown> | null) ?? {};

            items.push({
              id: call.id,
              type: "call",
              userId: call.user_id,
              userEmail: user?.email ?? null,
              userName: user?.name ?? null,
              scheduledFor: call.scheduled_for,
              status: call.status ?? "queued",
              patientName: (dynamicVars.pet_name as string) ?? null,
              ownerName: (dynamicVars.owner_name as string) ?? null,
              ownerPhone: call.customer_phone,
              ownerEmail: null,
              caseId: call.case_id,
              createdAt: call.created_at,
              metadata: (call.metadata as Record<string, unknown>) ?? {},
            });
          }
        }
      }

      // Fetch scheduled emails if type filter allows
      if (input.typeFilter === "all" || input.typeFilter === "email") {
        let emailsQuery = ctx.supabase
          .from("scheduled_discharge_emails")
          .select(
            `
            id,
            user_id,
            scheduled_for,
            status,
            recipient_name,
            recipient_email,
            case_id,
            created_at,
            metadata
          `,
          )
          .in("user_id", userIds)
          .order("scheduled_for", { ascending: true, nullsFirst: false })
          .limit(input.limit);

        if (input.statusFilter !== "all") {
          emailsQuery = emailsQuery.eq("status", input.statusFilter);
        }

        const { data: emails } = await emailsQuery;

        if (emails) {
          for (const email of emails) {
            const user = userMap.get(email.user_id);

            items.push({
              id: email.id,
              type: "email",
              userId: email.user_id,
              userEmail: user?.email ?? null,
              userName: user?.name ?? null,
              scheduledFor: email.scheduled_for,
              status: email.status ?? "queued",
              patientName: null,
              ownerName: email.recipient_name,
              ownerPhone: null,
              ownerEmail: email.recipient_email,
              caseId: email.case_id,
              createdAt: email.created_at,
              metadata: (email.metadata as Record<string, unknown>) ?? {},
            });
          }
        }
      }

      // Sort combined items by scheduled time
      items.sort((a, b) => {
        if (!a.scheduledFor && !b.scheduledFor) return 0;
        if (!a.scheduledFor) return 1;
        if (!b.scheduledFor) return -1;
        return (
          new Date(a.scheduledFor).getTime() -
          new Date(b.scheduledFor).getTime()
        );
      });

      return {
        items: items.slice(0, input.limit),
        totalCount: items.length,
      };
    }),

  /**
   * Cancel a scheduled call or email
   */
  cancelScheduledItem: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        type: z.enum(["call", "email"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const table =
        input.type === "call"
          ? "scheduled_discharge_calls"
          : "scheduled_discharge_emails";

      const { error } = await ctx.supabase
        .from(table)
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to cancel ${input.type}`,
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * Reschedule a call or email to a new time
   */
  rescheduleItem: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        type: z.enum(["call", "email"]),
        newScheduledFor: z.string().datetime(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const table =
        input.type === "call"
          ? "scheduled_discharge_calls"
          : "scheduled_discharge_emails";

      const { error } = await ctx.supabase
        .from(table)
        .update({
          scheduled_for: input.newScheduledFor,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to reschedule ${input.type}`,
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * Trigger immediate execution by setting scheduled_for to now
   */
  triggerImmediateExecution: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        type: z.enum(["call", "email"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const table =
        input.type === "call"
          ? "scheduled_discharge_calls"
          : "scheduled_discharge_emails";

      // Set scheduled_for to now - QStash will pick it up on next poll
      const now = new Date().toISOString();

      const { error } = await ctx.supabase
        .from(table)
        .update({
          scheduled_for: now,
          status: "queued", // Reset to queued if it was in another state
          updated_at: now,
        })
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to trigger ${input.type}`,
          cause: error,
        });
      }

      return { success: true, triggeredAt: now };
    }),

  /**
   * Get admin dashboard stats
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const clinicName = ctx.adminProfile.clinic_name;

    if (!clinicName) {
      return {
        totalQueued: 0,
        totalInProgress: 0,
        totalCompleted: 0,
        totalFailed: 0,
      };
    }

    // Get all user IDs in the same clinic
    const { data: clinicUsers } = await ctx.supabase
      .from("users")
      .select("id")
      .eq("clinic_name", clinicName);

    const userIds = clinicUsers?.map((u) => u.id) ?? [];

    if (userIds.length === 0) {
      return {
        totalQueued: 0,
        totalInProgress: 0,
        totalCompleted: 0,
        totalFailed: 0,
      };
    }

    // Count calls by status
    const { data: calls } = await ctx.supabase
      .from("scheduled_discharge_calls")
      .select("status")
      .in("user_id", userIds);

    // Count emails by status
    const { data: emails } = await ctx.supabase
      .from("scheduled_discharge_emails")
      .select("status")
      .in("user_id", userIds);

    const allItems = [...(calls ?? []), ...(emails ?? [])];

    return {
      totalQueued: allItems.filter(
        (i) => i.status === "queued" || i.status === "ringing",
      ).length,
      totalInProgress: allItems.filter((i) => i.status === "in-progress")
        .length,
      totalCompleted: allItems.filter(
        (i) => i.status === "completed" || i.status === "sent",
      ).length,
      totalFailed: allItems.filter((i) => i.status === "failed").length,
    };
  }),

  /**
   * Bulk cancel multiple scheduled items
   */
  bulkCancelItems: adminProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string().uuid(),
            type: z.enum(["call", "email"]),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const results = await Promise.allSettled(
        input.items.map(async (item) => {
          const table =
            item.type === "call"
              ? "scheduled_discharge_calls"
              : "scheduled_discharge_emails";

          const { error } = await ctx.supabase
            .from(table)
            .update({
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id);

          if (error) throw error;
          return { id: item.id, type: item.type };
        }),
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return {
        success: true,
        total: input.items.length,
        successful,
        failed,
      };
    }),

  /**
   * Bulk reschedule multiple items
   */
  bulkRescheduleItems: adminProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string().uuid(),
            type: z.enum(["call", "email"]),
          }),
        ),
        newScheduledFor: z.string().datetime(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const results = await Promise.allSettled(
        input.items.map(async (item) => {
          const table =
            item.type === "call"
              ? "scheduled_discharge_calls"
              : "scheduled_discharge_emails";

          const { error } = await ctx.supabase
            .from(table)
            .update({
              scheduled_for: input.newScheduledFor,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id);

          if (error) throw error;
          return { id: item.id, type: item.type };
        }),
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return {
        success: true,
        total: input.items.length,
        successful,
        failed,
      };
    }),
});
