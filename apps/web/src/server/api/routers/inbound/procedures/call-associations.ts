/**
 * Call Association Procedures
 *
 * Checks if calls are associated with appointments or messages
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createClient } from "@odis-ai/db/server";

export const callAssociationsRouter = createTRPCRouter({
  /**
   * Check if a call has associated appointment requests
   */
  checkCallAppointmentAssociation: protectedProcedure
    .input(
      z.object({
        callId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("appointment_requests")
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
    .query(async ({ input }) => {
      const supabase = await createClient();

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
   * Get caller name by phone number from appointments or messages
   * Used to display caller names instead of phone numbers in the Calls tab
   */
  getCallerNameByPhone: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
      }),
    )
    .query(async ({ input }) => {
      // Normalize phone number by removing all non-digit characters
      const normalizedPhone = input.phone.replace(/\D/g, "");

      // Return null for empty phone numbers
      if (!normalizedPhone) {
        return null;
      }

      const supabase = await createClient();

      // Try to find in appointment_requests first (by client_phone)
      const { data: appointment } = await supabase
        .from("appointment_requests")
        .select("client_name")
        .or(
          `client_phone.eq.${normalizedPhone},client_phone.eq.+1${normalizedPhone},client_phone.ilike.%${normalizedPhone.slice(-10)}%`,
        )
        .limit(1)
        .single();

      if (appointment?.client_name) {
        return {
          name: appointment.client_name,
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
        .limit(1)
        .single();

      if (message?.caller_name) {
        return { name: message.caller_name, source: "message" as const };
      }

      return null;
    }),
});
