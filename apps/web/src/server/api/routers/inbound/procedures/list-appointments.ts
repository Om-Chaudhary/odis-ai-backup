/**
 * List Appointment Requests Procedure
 *
 * Fetches appointment requests from the appointment_requests table
 * with filtering, pagination, and role-based access control.
 */

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createClient } from "@odis-ai/db/server";
import { listAppointmentRequestsInput } from "../schemas";

/**
 * Get user's clinic ID for filtering
 */
async function getUserClinicId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, role, clinic_id")
    .eq("id", userId)
    .single();

  if (error || !user) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch user information",
    });
  }

  return user;
}

export const listAppointmentsRouter = createTRPCRouter({
  /**
   * List appointment requests with filters and pagination
   */
  listAppointmentRequests: protectedProcedure
    .input(listAppointmentRequestsInput)
    .query(async ({ ctx, input }) => {
      const supabase = await createClient();

      // Get current user's clinic
      const user = await getUserClinicId(supabase, ctx.user.id);

      // Build query
      let query = supabase
        .from("appointment_requests")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Filter by clinic (users only see their clinic's data)
      if (user.clinic_id) {
        query = query.eq("clinic_id", user.clinic_id);
      }

      // Apply status filter
      if (input.status) {
        query = query.eq("status", input.status);
      }

      // Apply new client filter
      if (input.isNewClient !== undefined) {
        query = query.eq("is_new_client", input.isNewClient);
      }

      // Apply date filters
      if (input.startDate) {
        query = query.gte("created_at", input.startDate);
      }

      if (input.endDate) {
        const endDate = new Date(input.endDate);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDate.toISOString());
      }

      // Apply search filter (searches client name, patient name, phone, reason)
      if (input.search) {
        query = query.or(
          `client_name.ilike.%${input.search}%,patient_name.ilike.%${input.search}%,client_phone.ilike.%${input.search}%,reason.ilike.%${input.search}%`,
        );
      }

      // Apply pagination
      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize - 1;
      query = query.range(from, to);

      const { data: appointments, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch appointment requests: ${error.message}`,
        });
      }

      // Transform to camelCase for frontend
      const transformedAppointments = (appointments ?? []).map((apt) => ({
        id: apt.id,
        clinicId: apt.clinic_id,
        providerId: apt.provider_id,
        clientName: apt.client_name,
        clientPhone: apt.client_phone,
        patientName: apt.patient_name,
        species: apt.species,
        breed: apt.breed,
        reason: apt.reason,
        requestedDate: apt.requested_date,
        requestedStartTime: apt.requested_start_time,
        requestedEndTime: apt.requested_end_time,
        status: apt.status,
        isNewClient: apt.is_new_client,
        isOutlier: apt.is_outlier,
        notes: apt.notes,
        vapiCallId: apt.vapi_call_id,
        confirmedAppointmentId: apt.confirmed_appointment_id,
        metadata: apt.metadata,
        createdAt: apt.created_at,
        updatedAt: apt.updated_at,
      }));

      return {
        appointments: transformedAppointments,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / input.pageSize),
        },
      };
    }),
});
