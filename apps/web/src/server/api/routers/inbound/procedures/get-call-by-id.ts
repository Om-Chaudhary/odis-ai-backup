/**
 * Get Inbound Call by ID Procedure
 *
 * Fetches a single inbound VAPI call by its UUID
 * for deep linking support from external tools/extensions.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getClinicByUserId } from "@odis-ai/domain/clinics";

// Dynamic import for lazy-loaded library
const getServiceClient = () =>
  import("@odis-ai/data-access/db/server").then((m) => m.createServiceClient);

export const getCallByIdRouter = createTRPCRouter({
  /**
   * Get an inbound call by its ID
   */
  getCallById: protectedProcedure
    .input(
      z.object({
        callId: z.string().uuid("Invalid call ID format"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Use service client to bypass RLS for reliable data access
      const createServiceClient = await getServiceClient();
      const serviceClient = await createServiceClient();

      // Get current user's clinic
      const clinic = await getClinicByUserId(userId, serviceClient);

      if (!clinic?.id || !clinic?.name) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User clinic not found",
        });
      }

      // Fetch the call with clinic verification using clinic_name
      // (inbound_vapi_calls uses clinic_name, not clinic_id)
      const { data: call, error } = await serviceClient
        .from("inbound_vapi_calls")
        .select("*")
        .eq("id", input.callId)
        .ilike("clinic_name", clinic.name)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Call not found or access denied",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch call: ${error.message}`,
        });
      }

      return call;
    }),
});
