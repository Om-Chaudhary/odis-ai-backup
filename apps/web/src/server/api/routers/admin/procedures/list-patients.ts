/**
 * List Patients Procedure
 *
 * Returns paginated list of all patients across all users with filtering.
 */

import { TRPCError } from "@trpc/server";
import { createServiceClient } from "@odis-ai/db/server";
import { createTRPCRouter } from "~/server/api/trpc";
import { adminProcedure } from "../middleware";
import { listPatientsInput, getPatientInput } from "../schemas";

export const listPatientsRouter = createTRPCRouter({
  listPatients: adminProcedure
    .input(listPatientsInput)
    .query(async ({ input }) => {
      const supabase = await createServiceClient();

      try {
        let query = supabase.from("patients").select(
          `
            id,
            name,
            species,
            breed,
            age,
            weight,
            owner_name,
            owner_phone,
            owner_email,
            user_id,
            created_at,
            updated_at,
            users (
              id,
              email,
              first_name,
              last_name,
              clinic_name
            )
          `,
          { count: "exact" },
        );

        // Apply user filter
        if (input.userId) {
          query = query.eq("user_id", input.userId);
        }

        // Apply species filter
        if (input.species) {
          query = query.ilike("species", `%${input.species}%`);
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

        // Type assertion for Supabase join
        type UserJoin = {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          clinic_name: string | null;
        } | null;

        let patients = (data ?? []).map((p) => {
          const userRaw = (Array.isArray(p.users)
            ? p.users[0]
            : p.users) as unknown as UserJoin;
          return {
            id: p.id,
            name: p.name,
            species: p.species,
            breed: p.breed,
            age: p.age,
            weight: p.weight,
            ownerName: p.owner_name,
            ownerPhone: p.owner_phone,
            ownerEmail: p.owner_email,
            userId: p.user_id,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            user: userRaw
              ? {
                  id: userRaw.id,
                  email: userRaw.email,
                  firstName: userRaw.first_name,
                  lastName: userRaw.last_name,
                  clinicName: userRaw.clinic_name,
                }
              : null,
          };
        });

        // Apply search filter
        if (input.search) {
          const searchLower = input.search.toLowerCase();
          const matchesSearch = (value: string | null | undefined): boolean =>
            Boolean(value?.toLowerCase().includes(searchLower));
          patients = patients.filter(
            (p) =>
              matchesSearch(p.name) ||
              matchesSearch(p.ownerName) ||
              matchesSearch(p.ownerEmail) ||
              matchesSearch(p.species) ||
              matchesSearch(p.breed) ||
              matchesSearch(p.user?.email) ||
              matchesSearch(p.user?.clinicName) ||
              matchesSearch(p.id),
          );
        }

        return {
          patients,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            total: count ?? 0,
            totalPages: Math.ceil((count ?? 0) / input.pageSize),
          },
        };
      } catch (error) {
        console.error("[Admin List Patients] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch patients",
        });
      }
    }),

  getPatient: adminProcedure.input(getPatientInput).query(async ({ input }) => {
    const supabase = await createServiceClient();

    try {
      const { data: patient, error } = await supabase
        .from("patients")
        .select(
          `
            *,
            users (
              id,
              email,
              first_name,
              last_name,
              clinic_name
            ),
            cases (
              id,
              type,
              status,
              created_at
            )
          `,
        )
        .eq("id", input.patientId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Patient not found",
          });
        }
        throw error;
      }

      return { patient };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[Admin Get Patient] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch patient",
      });
    }
  }),
});
