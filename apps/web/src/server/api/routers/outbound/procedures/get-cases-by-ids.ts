/**
 * Get Discharge Cases by IDs
 *
 * Returns multiple discharge cases by their IDs with basic data
 * for the bulk scheduling flow.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const getCasesByIdsInput = z.object({
  caseIds: z.array(z.string().uuid()).min(1).max(100),
});

interface PatientData {
  id: string;
  name: string;
  owner_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;
}

interface CaseRow {
  id: string;
  patients: PatientData[];
}

export const getCasesByIdsRouter = createTRPCRouter({
  getCasesByIds: protectedProcedure
    .input(getCasesByIdsInput)
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;

      const { data, error } = await supabase
        .from("cases")
        .select(
          `
          id,
          patients!inner (
            id,
            name,
            owner_name,
            owner_phone,
            owner_email
          )
        `,
        )
        .in("id", input.caseIds);

      if (error) {
        console.error("Failed to fetch cases:", error);
        return { cases: [] };
      }

      const cases = (data as unknown as CaseRow[]).map((row) => {
        const patient = row.patients[0];
        return {
          id: row.id,
          patient: {
            id: patient?.id ?? "",
            name: patient?.name ?? "Unknown",
          },
          owner: {
            name: patient?.owner_name ?? null,
            phone: patient?.owner_phone ?? null,
            email: patient?.owner_email ?? null,
          },
        };
      });

      return { cases };
    }),
});
