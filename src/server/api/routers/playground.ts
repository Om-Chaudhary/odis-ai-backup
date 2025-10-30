import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

// ============================================================================
// PLAYGROUND ROUTER
// ============================================================================

export const playgroundRouter = createTRPCRouter({
  /**
   * Get all SOAP templates with user information for playground testing
   */
  getTemplatesForPlayground: adminProcedure.query(async ({ ctx }) => {
    // Use service client to bypass RLS
    const { data, error } = await ctx.serviceClient
      .from("temp_soap_templates")
      .select("*, user:users(id, email, first_name, last_name)")
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch templates for playground",
        cause: error,
      });
    }

    return data;
  }),
});
