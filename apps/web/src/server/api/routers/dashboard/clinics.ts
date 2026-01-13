/**
 * Dashboard Clinic Procedures
 *
 * Provides clinic-related data for the dashboard, including multi-clinic support.
 */

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getUserClinics } from "@odis-ai/domain/clinics";

export const clinicsRouter = createTRPCRouter({
  /**
   * Get all clinics the current user has access to
   *
   * Returns array of clinics with id, name, and slug.
   * Used by clinic selector component for multi-clinic users.
   */
  getUserClinics: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const clinics = await getUserClinics(userId, ctx.supabase);

    return clinics.map((clinic) => ({
      id: clinic.id,
      name: clinic.name,
      slug: clinic.slug,
    }));
  }),
});
