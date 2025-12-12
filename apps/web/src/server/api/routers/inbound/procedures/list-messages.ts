/**
 * List Clinic Messages Procedure
 *
 * Fetches clinic messages from the clinic_messages table
 * with filtering, pagination, and role-based access control.
 */

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createClient } from "@odis-ai/db/server";
import { listClinicMessagesInput } from "../schemas";

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

export const listMessagesRouter = createTRPCRouter({
  /**
   * List clinic messages with filters and pagination
   */
  listClinicMessages: protectedProcedure
    .input(listClinicMessagesInput)
    .query(async ({ ctx, input }) => {
      const supabase = await createClient();

      // Get current user's clinic
      const user = await getUserClinicId(supabase, ctx.user.id);

      // Build query
      let query = supabase
        .from("clinic_messages")
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

      // Apply priority filter
      if (input.priority) {
        query = query.eq("priority", input.priority);
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

      // Apply search filter (searches caller name, phone, message content)
      if (input.search) {
        query = query.or(
          `caller_name.ilike.%${input.search}%,caller_phone.ilike.%${input.search}%,message_content.ilike.%${input.search}%`,
        );
      }

      // Apply pagination
      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize - 1;
      query = query.range(from, to);

      const { data: messages, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch clinic messages: ${error.message}`,
        });
      }

      // Transform to camelCase for frontend
      const transformedMessages = (messages ?? []).map((msg) => ({
        id: msg.id,
        clinicId: msg.clinic_id,
        callerName: msg.caller_name,
        callerPhone: msg.caller_phone,
        messageContent: msg.message_content,
        messageType: msg.message_type,
        priority: msg.priority,
        status: msg.status,
        assignedToUserId: msg.assigned_to_user_id,
        vapiCallId: msg.vapi_call_id,
        metadata: msg.metadata,
        readAt: msg.read_at,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at,
      }));

      return {
        messages: transformedMessages,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / input.pageSize),
        },
      };
    }),
});
