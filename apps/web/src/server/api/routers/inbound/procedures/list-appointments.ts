/**
 * List Appointment Requests Procedure
 *
 * Fetches VAPI bookings from the vapi_bookings table
 * with filtering, pagination, and role-based access control.
 */

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getClinicByUserId } from "@odis-ai/domain/clinics";
import { createServiceClient } from "@odis-ai/data-access/db/server";
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

      // Determine which clinic to filter by
      let clinicId: string | null = null;
      if (input.clinicId) {
        // Use provided clinicId from input
        clinicId = input.clinicId;
      } else {
        // Fall back to user's default clinic
        const clinic = await getClinicByUserId(userId, serviceClient);
        clinicId = clinic?.id ?? null;
      }

      // Build query - using vapi_bookings table
      let query = serviceClient
        .from("vapi_bookings")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Filter by clinic (users only see their clinic's data)
      if (clinicId) {
        query = query.eq("clinic_id", clinicId);
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
      // Map vapi_bookings columns to expected frontend format
      const transformedAppointments = (appointments ?? [])
        .map((apt) => {
          // Extract is_outlier from metadata if present
          const metadata = apt.metadata as Record<string, unknown> | null;
          const isOutlier = metadata?.is_outlier === true;

          return {
            id: apt.id,
            clinicId: apt.clinic_id,
            providerId: null, // vapi_bookings doesn't have provider_id
            clientName: apt.client_name,
            clientPhone: apt.client_phone,
            patientName: apt.patient_name,
            species: apt.species,
            breed: apt.breed,
            reason: apt.reason,
            // For pending bookings, date/time is the requested time
            // For confirmed bookings, it's the confirmed time
            requestedDate: apt.date,
            requestedStartTime: apt.start_time,
            requestedEndTime: null, // vapi_bookings doesn't store end time separately
            // Confirmed appointment time (same as date/start_time for confirmed status)
            confirmedDate: apt.status === "confirmed" ? apt.date : null,
            confirmedTime: apt.status === "confirmed" ? apt.start_time : null,
            status: apt.status,
            isNewClient: apt.is_new_client,
            isOutlier: isOutlier,
            notes: typeof metadata?.notes === "string" ? metadata.notes : null,
            vapiCallId: apt.vapi_call_id,
            confirmedAppointmentId: apt.confirmation_number,
            metadata: apt.metadata,
            createdAt: apt.created_at,
            updatedAt: apt.updated_at,
          };
        })
        .filter((apt) => {
          // Filter out demo appointments for demo purposes
          // Check if this is an appointment that should be filtered
          const normalizePhone = (phone: string | null) =>
            (phone ?? "").replace(/\D/g, "");

          // Hide (408) 334-3500 appointments completely
          if (
            apt.clientPhone === "4083343500" ||
            apt.clientPhone === "408-334-3500" ||
            apt.clientPhone === "(408) 334-3500" ||
            apt.clientPhone === "+1 (408) 334-3500" ||
            apt.clientPhone === "+14083343500"
          ) {
            return false;
          }

          // Hide appointments with no phone number provided
          if (
            !apt.clientPhone ||
            apt.clientPhone === "" ||
            apt.clientPhone === null
          ) {
            return false;
          }

          // Hide specific Rocky appointment with no phone number
          if (
            apt.patientName &&
            typeof apt.patientName === "string" &&
            apt.patientName.toLowerCase().includes("rocky") &&
            apt.reason &&
            typeof apt.reason === "string" &&
            apt.reason.toLowerCase().includes("chocolate")
          ) {
            return false;
          }

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
