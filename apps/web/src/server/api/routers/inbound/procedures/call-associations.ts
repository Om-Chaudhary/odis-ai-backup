/**
 * Call Association Procedures
 *
 * Checks if calls are associated with appointments or messages
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { ActionCardOutput } from "@odis-ai/integrations/vapi/schemas/action-card-output";

export const callAssociationsRouter = createTRPCRouter({
  /**
   * Check if a call has associated VAPI bookings
   */
  checkCallAppointmentAssociation: protectedProcedure
    .input(
      z.object({
        callId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const { data, error } = await supabase
        .from("vapi_bookings")
        .select("id")
        .eq("vapi_call_id", input.callId)
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking appointment association:", error);
        return false;
      }

      return !!data;
    }),

  /**
   * Check if a call has associated clinic messages
   */
  checkCallMessageAssociation: protectedProcedure
    .input(
      z.object({
        callId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const { data, error } = await supabase
        .from("clinic_messages")
        .select("id")
        .eq("vapi_call_id", input.callId)
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking message association:", error);
        return false;
      }

      return !!data;
    }),

  /**
   * Get booking data by VAPI call ID
   * Returns structured booking data for action card display
   */
  getBookingByVapiCallId: protectedProcedure
    .input(
      z.object({
        vapiCallId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const { data, error } = await supabase
        .from("vapi_bookings")
        .select(
          "patient_name, species, breed, date, start_time, reason, client_name, client_phone, status, is_new_client, rescheduled_reason, original_date, original_time",
        )
        .eq("vapi_call_id", input.vapiCallId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching booking by vapi_call_id:", error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        patient_name: data.patient_name,
        species: data.species,
        breed: data.breed,
        date: data.date,
        start_time: data.start_time,
        reason: data.reason,
        client_name: data.client_name,
        client_phone: data.client_phone,
        status: data.status,
        is_new_client: data.is_new_client,
        rescheduled_reason: data.rescheduled_reason,
        original_date: data.original_date,
        original_time: data.original_time,
      };
    }),

  /**
   * Get caller info by phone number from appointments or messages
   * Returns caller name, pet name, species, breed, lastVisit (if from appointment), and source
   * Used to display caller info in the Calls tab and Pet Context in Messages tab
   */
  getCallerNameByPhone: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Normalize phone number by removing all non-digit characters
      const normalizedPhone = input.phone.replace(/\D/g, "");

      // Return null for empty phone numbers
      if (!normalizedPhone) {
        return null;
      }

      const supabase = ctx.supabase;

      // Try to find in vapi_bookings first (by client_phone)
      // Select client_name, patient_name, species, breed, and created_at for context
      const { data: appointment } = await supabase
        .from("vapi_bookings")
        .select("client_name, patient_name, species, breed, created_at")
        .or(
          `client_phone.eq.${normalizedPhone},client_phone.eq.+1${normalizedPhone},client_phone.ilike.%${normalizedPhone.slice(-10)}%`,
        )
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (appointment?.client_name || appointment?.patient_name) {
        return {
          name: appointment.client_name ?? null,
          petName: appointment.patient_name ?? null,
          species: appointment.species ?? null,
          breed: appointment.breed ?? null,
          lastVisit: appointment.created_at ?? null,
          source: "appointment" as const,
        };
      }

      // Try to find in clinic_messages (by caller_phone)
      const { data: message } = await supabase
        .from("clinic_messages")
        .select("caller_name")
        .or(
          `caller_phone.eq.${normalizedPhone},caller_phone.eq.+1${normalizedPhone},caller_phone.ilike.%${normalizedPhone.slice(-10)}%`,
        )
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (message?.caller_name) {
        return {
          name: message.caller_name,
          petName: null,
          species: null,
          breed: null,
          lastVisit: null,
          source: "message" as const,
        };
      }

      // Try to find in inbound_vapi_calls structured_data (from VAPI action cards)
      const { data: vapiCall } = await supabase
        .from("inbound_vapi_calls")
        .select("structured_data, created_at, vapi_call_id")
        .or(
          `customer_phone.eq.${normalizedPhone},customer_phone.eq.+1${normalizedPhone},customer_phone.ilike.%${normalizedPhone.slice(-10)}%`,
        )
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (vapiCall?.structured_data) {
        const structuredData = vapiCall.structured_data as unknown as ActionCardOutput;

        // Log the structured data for debugging
        console.log("Found structured_data for phone lookup:", {
          phone: normalizedPhone,
          callId: vapiCall.vapi_call_id || "unknown",
          structuredData,
          hasAppointmentData: !!structuredData?.appointment_data,
          hasCallbackData: !!structuredData?.callback_data,
          hasEmergencyData: !!structuredData?.emergency_data,
        });

        // Check for appointment data (scheduled/rescheduled/cancellation)
        if (structuredData?.appointment_data) {
          const { client_name, patient_name } = structuredData.appointment_data;
          console.log("Found appointment data with names:", { client_name, patient_name });
          if (client_name || patient_name) {
            return {
              name: client_name ?? null,
              petName: patient_name ?? null,
              species: null,
              breed: null,
              lastVisit: vapiCall.created_at,
              source: "appointment" as const,
            };
          }
        }

        // Check for callback data
        if (structuredData?.callback_data) {
          const { caller_name, pet_name } = structuredData.callback_data;
          console.log("Found callback data with names:", { caller_name, pet_name });
          if (caller_name || pet_name) {
            return {
              name: caller_name ?? null,
              petName: pet_name ?? null,
              species: null,
              breed: null,
              lastVisit: vapiCall.created_at,
              source: "message" as const,
            };
          }
        }

        // Check for emergency data - emergency calls might have caller name in callback_data
        if (structuredData?.emergency_data) {
          console.log("Found emergency data but no associated callback data for names");
        }
      }

      return null;
    }),
});
