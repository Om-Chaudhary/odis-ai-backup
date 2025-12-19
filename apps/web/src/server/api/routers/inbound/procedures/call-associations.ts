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
});
