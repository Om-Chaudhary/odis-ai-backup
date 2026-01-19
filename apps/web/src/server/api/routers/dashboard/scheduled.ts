/**
 * Dashboard Scheduled Items Procedures
 *
 * Upcoming scheduled items and cases needing attention.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { CallStatus, EmailStatus, CaseStatus } from "@odis-ai/shared/types";
import {
  type SupabasePatientsResponse,
  type DynamicVariables,
  normalizeString,
} from "./types";
import {
  getClinicUserIds,
  getClinicBySlug,
  getClinicByUserId,
  userHasClinicAccess,
  getClinicUserIdsEnhanced,
} from "@odis-ai/domain/clinics";
import { TRPCError } from "@trpc/server";

export const scheduledRouter = createTRPCRouter({
  /**
   * Get upcoming scheduled items (next 48 hours)
   */
  getUpcomingScheduled: protectedProcedure
    .input(z.object({ clinicSlug: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic - either from slug or user's primary clinic
      let clinic;
      if (input?.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
        if (!clinic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Clinic not found",
          });
        }
        const hasAccess = await userHasClinicAccess(
          userId,
          clinic.id,
          ctx.supabase,
        );
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this clinic",
          });
        }
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      const now = new Date();
      const in48Hours = new Date();
      in48Hours.setHours(in48Hours.getHours() + 48);

      // Get upcoming calls (clinic-scoped)
      const { data: upcomingCalls } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select(
          `
        id,
        scheduled_for,
        status,
        dynamic_variables,
        customer_phone
      `,
        )
        .in("user_id", clinicUserIds)
        .in("status", ["queued", "ringing"])
        .gte("scheduled_for", now.toISOString())
        .lte("scheduled_for", in48Hours.toISOString())
        .order("scheduled_for", { ascending: true });

      // Get upcoming emails (clinic-scoped)
      const { data: upcomingEmails } = await ctx.supabase
        .from("scheduled_discharge_emails")
        .select(
          `
        id,
        scheduled_for,
        status,
        recipient_name,
        recipient_email
      `,
        )
        .in("user_id", clinicUserIds)
        .eq("status", "queued")
        .gte("scheduled_for", now.toISOString())
        .lte("scheduled_for", in48Hours.toISOString())
        .order("scheduled_for", { ascending: true });

      const items: Array<{
        id: string;
        type: "call" | "email";
        scheduledFor: string | null;
        status: CallStatus | EmailStatus;
        description: string;
        metadata: Record<string, unknown>;
      }> = [
        ...(upcomingCalls?.map((c) => {
          const dynamicVars =
            (c.dynamic_variables as DynamicVariables | null) ?? {};
          return {
            id: String(c.id ?? ""),
            type: "call" as const,
            scheduledFor: c.scheduled_for ? String(c.scheduled_for) : null,
            status: (c.status ?? null) as CallStatus,
            description: `Call to ${
              dynamicVars?.owner_name ?? c.customer_phone ?? "unknown"
            }`,
            metadata: {
              phone: c.customer_phone,
              patientName: dynamicVars?.pet_name,
            },
          };
        }) ?? []),
        ...(upcomingEmails?.map((e) => ({
          id: String(e.id ?? ""),
          type: "email" as const,
          scheduledFor: e.scheduled_for ? String(e.scheduled_for) : null,
          status: (e.status ?? null) as EmailStatus,
          description: `Email to ${
            e.recipient_name ?? e.recipient_email ?? "unknown"
          }`,
          metadata: {
            email: e.recipient_email,
            recipientName: e.recipient_name,
          },
        })) ?? []),
      ].sort((a, b) => {
        if (!a.scheduledFor || !b.scheduledFor) return 0;
        return (
          new Date(a.scheduledFor).getTime() -
          new Date(b.scheduledFor).getTime()
        );
      });

      return items;
    }),

  /**
   * Get cases needing attention with full details
   */
  getCasesNeedingAttention: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
        clinicSlug: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic - either from slug or user's primary clinic
      let clinic;
      if (input.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
        if (!clinic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Clinic not found",
          });
        }
        const hasAccess = await userHasClinicAccess(
          userId,
          clinic.id,
          ctx.supabase,
        );
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this clinic",
          });
        }
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      // Get cases with missing discharge or SOAP notes (clinic-scoped)
      let casesQuery = ctx.supabase
        .from("cases")
        .select(
          `
          id,
          status,
          created_at,
          type,
          patients!inner (
            id,
            name,
            owner_name,
            owner_phone,
            owner_email,
            species
          ),
          discharge_summaries (id),
          soap_notes (id)
        `,
        )
        .in("user_id", clinicUserIds)
        .in("status", ["ongoing", "draft"]);

      if (startDate) {
        casesQuery = casesQuery.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        casesQuery = casesQuery.lte("created_at", end.toISOString());
      }

      const { data: cases } = await casesQuery.order("created_at", {
        ascending: false,
      });

      if (!cases) return [];

      // Filter cases that need attention
      const casesNeedingAttention = cases
        .map((c) => {
          const patients = (c.patients as SupabasePatientsResponse) ?? [];
          const patient = patients[0];
          const dischargeSummaries = Array.isArray(c.discharge_summaries)
            ? c.discharge_summaries
            : [];
          const soapNotes = Array.isArray(c.soap_notes) ? c.soap_notes : [];

          const missingDischarge = dischargeSummaries.length === 0;
          const missingSoap = soapNotes.length === 0;
          const missingContact = !patient?.owner_phone && !patient?.owner_email;

          // Case needs attention if missing contact info (most important for discharge)
          const needsAttention = missingContact;

          if (!needsAttention) return null;

          return {
            id: c.id,
            status: c.status,
            created_at: String(c.created_at ?? new Date().toISOString()),
            type: c.type,
            patient: {
              id: patient?.id ?? "",
              name: normalizeString(patient?.name) ?? "Unknown Patient",
              owner_name: normalizeString(patient?.owner_name),
              owner_phone: normalizeString(patient?.owner_phone),
              owner_email: normalizeString(patient?.owner_email),
              species: normalizeString(patient?.species),
            },
            missingDischarge,
            missingSoap,
            missingContact,
            priority: missingContact ? 1 : 0,
          };
        })
        .filter(
          (
            c,
          ): c is {
            id: string;
            status: CaseStatus | null;
            created_at: string;
            type: "checkup" | "emergency" | "surgery" | "follow_up" | null;
            patient: {
              id: string;
              name: string;
              owner_name: string | null;
              owner_phone: string | null;
              owner_email: string | null;
              species: string | null;
            };
            missingDischarge: boolean;
            missingSoap: boolean;
            missingContact: true;
            priority: number;
          } => c !== null && c.missingContact === true,
        )
        .sort((a, b) => {
          // Sort by priority (higher first), then by date (newer first)
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, input.limit);

      return casesNeedingAttention;
    }),
});
