/**
 * List Appointment Requests Procedure
 *
 * Fetches appointment requests from the appointment_requests table
 * with filtering, pagination, and role-based access control.
 */

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getClinicByUserId } from "@odis-ai/domain/clinics";
import { createServiceClient } from "@odis-ai/data-access/db";
import { listAppointmentRequestsInput } from "../schemas";

export const listAppointmentsRouter = createTRPCRouter({
  /**
   * List appointment requests with filters and pagination
   */
  listAppointmentRequests: protectedProcedure
    .input(listAppointmentRequestsInput)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Use service client to bypass RLS for reliable data access
      const serviceClient = await createServiceClient();

      // Get current user's clinic using service client
      const clinic = await getClinicByUserId(userId, serviceClient);

      // Build query
      let query = serviceClient
        .from("appointment_requests")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Filter by clinic (users only see their clinic's data)
      if (clinic?.id) {
        query = query.eq("clinic_id", clinic.id);
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
        // Use UTC hours to ensure end of day in UTC timezone
        const endDate = new Date(input.endDate);
        endDate.setUTCHours(23, 59, 59, 999);
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

      const { data: appointments, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch appointment requests: ${error.message}`,
        });
      }

      // Transform to camelCase for frontend
      const transformedAppointments = (appointments ?? [])
        .map((apt) => ({
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
          // Confirmed appointment time (what AI booked)
          confirmedDate: apt.confirmed_date,
          confirmedTime: apt.confirmed_time,
          status: apt.status,
          isNewClient: apt.is_new_client,
          isOutlier: apt.is_outlier,
          notes: apt.notes,
          vapiCallId: apt.vapi_call_id,
          confirmedAppointmentId: apt.confirmed_appointment_id,
          metadata: apt.metadata,
          createdAt: apt.created_at,
          updatedAt: apt.updated_at,
        }))
        .filter((apt) => {
          // Filter out demo appointments for demo purposes
          // Check if this is an appointment that should be filtered
          const normalizePhone = (phone: string | null) =>
            (phone ?? "").replace(/\D/g, "");

          const canelaPhoneNumbers = [
            "4089214136", // Yvonne Trigo's number
          ];

          const andreaPhoneNumbers = [
            "4088910469", // Andrea Watkins' number
          ];

          // Hide Canela's scheduled appointment completely
          if (
            apt.patientName &&
            typeof apt.patientName === "string" &&
            apt.patientName.toLowerCase().includes("canela") &&
            canelaPhoneNumbers.some((phone) =>
              normalizePhone(apt.clientPhone).includes(phone),
            )
          ) {
            return false;
          }

          // Hide Andrea's real appointments (demo version will be injected)
          if (
            apt.clientName &&
            typeof apt.clientName === "string" &&
            apt.clientName.toLowerCase().includes("andrea") &&
            andreaPhoneNumbers.some((phone) =>
              normalizePhone(apt.clientPhone).includes(phone),
            )
          ) {
            return false;
          }

          return true;
        });

      return {
        appointments: transformedAppointments,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: transformedAppointments.length, // Use filtered count
          totalPages: Math.ceil(
            transformedAppointments.length / input.pageSize,
          ),
        },
      };
    }),
});
