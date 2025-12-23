/**
 * List All Cases Procedure
 *
 * Returns paginated list of all cases across all users with filtering.
 */

import { TRPCError } from "@trpc/server";
import { createServiceClient } from "@odis-ai/db/server";
import { createTRPCRouter } from "~/server/api/trpc";
import { adminProcedure } from "../middleware";
import { listAllCasesInput, getCaseInput } from "../schemas";

export const listAllCasesRouter = createTRPCRouter({
  listAllCases: adminProcedure
    .input(listAllCasesInput)
    .query(async ({ input }) => {
      const supabase = await createServiceClient();

      try {
        let query = supabase.from("cases").select(
          `
            id,
            type,
            status,
            source,
            created_at,
            updated_at,
            scheduled_at,
            user_id,
            is_starred,
            is_urgent,
            patients (
              id,
              name,
              species,
              breed,
              owner_name,
              owner_phone,
              owner_email
            ),
            users (
              id,
              email,
              first_name,
              last_name,
              clinic_name
            ),
            discharge_summaries (
              id,
              created_at
            ),
            scheduled_discharge_calls (
              id,
              status,
              scheduled_for
            ),
            scheduled_discharge_emails (
              id,
              status,
              scheduled_for
            )
          `,
          { count: "exact" },
        );

        // Apply user filter
        if (input.userId) {
          query = query.eq("user_id", input.userId);
        }

        // Apply status filter
        if (input.status) {
          query = query.eq("status", input.status);
        }

        // Apply date filters
        if (input.startDate) {
          query = query.gte("created_at", input.startDate);
        }
        if (input.endDate) {
          query = query.lte("created_at", input.endDate);
        }

        // Apply sorting
        query = query.order(input.sortBy, {
          ascending: input.sortOrder === "asc",
          nullsFirst: false,
        });

        // Apply pagination
        const from = (input.page - 1) * input.pageSize;
        const to = from + input.pageSize - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;

        if (error) throw error;

        // Apply search filter (client-side for complex matching)
        // Note: Supabase returns users as object (not array) for foreign key joins
        type UserJoin = {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          clinic_name: string | null;
        } | null;

        let cases = (data ?? []).map((c) => {
          const patient = c.patients?.[0];
          // Handle users - could be object or array depending on Supabase types
          const userRaw = (Array.isArray(c.users)
            ? c.users[0]
            : c.users) as unknown as UserJoin;
          const hasDischarge = (c.discharge_summaries?.length ?? 0) > 0;
          const latestCall = c.scheduled_discharge_calls?.[0];
          const latestEmail = c.scheduled_discharge_emails?.[0];

          return {
            id: c.id,
            type: c.type,
            status: c.status,
            source: c.source,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            scheduledAt: c.scheduled_at,
            isStarred: c.is_starred,
            isUrgent: c.is_urgent,
            patient: patient
              ? {
                  id: patient.id,
                  name: patient.name,
                  species: patient.species,
                  breed: patient.breed,
                  ownerName: patient.owner_name,
                  ownerPhone: patient.owner_phone,
                  ownerEmail: patient.owner_email,
                }
              : null,
            user: userRaw
              ? {
                  id: userRaw.id,
                  email: userRaw.email,
                  firstName: userRaw.first_name,
                  lastName: userRaw.last_name,
                  clinicName: userRaw.clinic_name,
                }
              : null,
            hasDischarge,
            callStatus: latestCall?.status ?? null,
            emailStatus: latestEmail?.status ?? null,
            callScheduledFor: latestCall?.scheduled_for ?? null,
            emailScheduledFor: latestEmail?.scheduled_for ?? null,
          };
        });

        // Apply search filter
        if (input.search) {
          const searchLower = input.search.toLowerCase();
          const matchesSearch = (value: string | null | undefined): boolean =>
            Boolean(value?.toLowerCase().includes(searchLower));
          cases = cases.filter(
            (c) =>
              matchesSearch(c.patient?.name) ||
              matchesSearch(c.patient?.ownerName) ||
              matchesSearch(c.patient?.ownerEmail) ||
              matchesSearch(c.user?.email) ||
              matchesSearch(c.user?.clinicName) ||
              matchesSearch(c.id),
          );
        }

        return {
          cases,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            total: count ?? 0,
            totalPages: Math.ceil((count ?? 0) / input.pageSize),
          },
        };
      } catch (error) {
        console.error("[Admin List Cases] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch cases",
        });
      }
    }),

  getCase: adminProcedure.input(getCaseInput).query(async ({ input }) => {
    const supabase = await createServiceClient();

    try {
      const { data: caseData, error } = await supabase
        .from("cases")
        .select(
          `
            *,
            patients (*),
            users (
              id,
              email,
              first_name,
              last_name,
              clinic_name
            ),
            discharge_summaries (*),
            scheduled_discharge_calls (*),
            scheduled_discharge_emails (*),
            soap_notes (*),
            transcriptions (*)
          `,
        )
        .eq("id", input.caseId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Case not found",
          });
        }
        throw error;
      }

      return { case: caseData };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[Admin Get Case] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch case",
      });
    }
  }),
});
