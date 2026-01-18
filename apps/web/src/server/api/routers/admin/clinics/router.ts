import { createTRPCRouter } from "~/server/api/trpc";
import { adminProcedure } from "../middleware";
import { createClient } from "@odis-ai/data-access/db/server";
import {
  listClinicsSchema,
  getClinicByIdSchema,
  createClinicSchema,
  updateClinicSchema,
  toggleClinicActiveSchema,
  getClinicUsersSchema,
  getClinicStatsSchema,
} from "./schemas";
import { TRPCError } from "@trpc/server";

export const adminClinicsRouter = createTRPCRouter({
  /**
   * List all clinics with optional search and filtering
   */
  list: adminProcedure.input(listClinicsSchema).query(async ({ input }) => {
    const supabase = await createClient();

    let query = supabase.from("clinics").select("*", { count: "exact" });

    // Apply filters
    if (input.search) {
      query = query.or(
        `name.ilike.%${input.search}%,slug.ilike.%${input.search}%`,
      );
    }

    if (input.pimsType && input.pimsType !== "all") {
      query = query.eq("pims_type", input.pimsType);
    }

    if (input.isActive !== undefined) {
      query = query.eq("is_active", input.isActive);
    }

    // Apply pagination
    query = query
      .order("name")
      .range(input.offset, input.offset + input.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch clinics",
        cause: error,
      });
    }

    return {
      clinics: data ?? [],
      total: count ?? 0,
    };
  }),

  /**
   * Get a single clinic by ID with detailed information
   */
  getById: adminProcedure
    .input(getClinicByIdSchema)
    .query(async ({ input }) => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", input.clinicId)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Clinic not found",
        });
      }

      return data;
    }),

  /**
   * Create a new clinic
   */
  create: adminProcedure
    .input(createClinicSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient();

      // Check if slug already exists
      const { data: existing } = await supabase
        .from("clinics")
        .select("id")
        .eq("slug", input.slug)
        .single();

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A clinic with this slug already exists",
        });
      }

      const { data, error } = await supabase
        .from("clinics")
        .insert({
          name: input.name,
          slug: input.slug,
          email: input.email,
          phone: input.phone,
          address: input.address,
          timezone: input.timezone,
          pims_type: input.pimsType,
          business_hours: input.businessHours ?? null,
          is_active: true,
        })
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create clinic",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Update an existing clinic
   */
  update: adminProcedure
    .input(updateClinicSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient();

      const { clinicId, ...updates } = input;

      const { data, error } = await supabase
        .from("clinics")
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.email && { email: updates.email }),
          ...(updates.phone && { phone: updates.phone }),
          ...(updates.address && { address: updates.address }),
          ...(updates.timezone && { timezone: updates.timezone }),
          ...(updates.businessHours && {
            business_hours: updates.businessHours,
          }),
          ...(updates.primaryColor && { primary_color: updates.primaryColor }),
          ...(updates.logoUrl && { logo_url: updates.logoUrl }),
        })
        .eq("id", clinicId)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update clinic",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Toggle clinic active status (soft delete/restore)
   */
  toggleActive: adminProcedure
    .input(toggleClinicActiveSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("clinics")
        .update({ is_active: input.isActive })
        .eq("id", input.clinicId)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update clinic status",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Get all users with access to a clinic
   */
  getClinicUsers: adminProcedure
    .input(getClinicUsersSchema)
    .query(async ({ input }) => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("user_clinic_access")
        .select(
          `
          user_id,
          role,
          users (
            id,
            first_name,
            last_name,
            email,
            role,
            created_at
          )
        `,
        )
        .eq("clinic_id", input.clinicId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch clinic users",
          cause: error,
        });
      }

      // Transform to ensure users is a single object (Supabase returns it as array in types)
      return (data ?? []).map((access) => ({
        ...access,
        users: Array.isArray(access.users) ? access.users[0] : access.users,
      }));
    }),

  /**
   * Get clinic statistics (cases, calls, users)
   */
  getClinicStats: adminProcedure
    .input(getClinicStatsSchema)
    .query(async ({ input }) => {
      const supabase = await createClient();

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - input.days);

      // Get case count
      const { count: caseCount } = await supabase
        .from("cases")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", input.clinicId)
        .gte("created_at", daysAgo.toISOString());

      // Get call count
      const { count: callCount } = await supabase
        .from("calls")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", input.clinicId)
        .gte("created_at", daysAgo.toISOString());

      // Get user count
      const { count: userCount } = await supabase
        .from("user_clinic_access")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", input.clinicId);

      return {
        cases: caseCount ?? 0,
        calls: callCount ?? 0,
        users: userCount ?? 0,
        days: input.days,
      };
    }),
});
