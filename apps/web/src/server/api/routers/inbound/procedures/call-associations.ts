/**
 * Call Association Procedures
 *
 * Checks if calls are associated with appointments or messages
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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

      return null;
    }),
});
