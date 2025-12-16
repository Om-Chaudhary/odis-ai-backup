/**
 * List Clinic Messages Procedure
 *
 * Fetches clinic messages from the clinic_messages table
 * with filtering, pagination, and role-based access control.
 */

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getClinicByUserId } from "@odis-ai/clinics/utils";
import { listClinicMessagesInput } from "../schemas";

export const listMessagesRouter = createTRPCRouter({
  /**
   * List clinic messages with filters and pagination
   */
  listClinicMessages: protectedProcedure
    .input(listClinicMessagesInput)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get current user's clinic (gracefully handles missing user record)
      const clinic = await getClinicByUserId(userId, ctx.supabase);

      // Build query
      let query = ctx.supabase
        .from("clinic_messages")
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

      // Add static mock messages for Eric Silva and Maria Serpa
      const today = new Date();
      const staticMessages = [
        {
          id: "eric-silva-static",
          clinicId: clinic?.id ?? null,
          callerName: "Eric Silva",
          callerPhone: "4084260512",
          messageContent:
            "Caller noticed stitches coming loose on their pet, Jack. There's very little bleeding, and the pet is not in discomfort. Caller requests a callback for further instructions.",
          messageType: "callback_request",
          priority: "normal",
          status: "new",
          assignedToUserId: null,
          vapiCallId: null,
          metadata: {},
          readAt: null,
          createdAt: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            19,
            9,
            0,
          ).toISOString(), // 7:09 PM
          updatedAt: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            19,
            9,
            0,
          ).toISOString(),
        },
        {
          id: "maria-serpa-static",
          clinicId: clinic?.id ?? null,
          callerName: "Maria Serpa",
          callerPhone: "4085612356",
          messageContent:
            "Caller Maria Serpa would like to cancel her dog's appointment.",
          messageType: "appointment_change",
          priority: "normal",
          status: "new",
          assignedToUserId: null,
          vapiCallId: null,
          metadata: {},
          readAt: null,
          createdAt: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            19,
            2,
            0,
          ).toISOString(), // 7:02 PM
          updatedAt: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            19,
            2,
            0,
          ).toISOString(),
        },
      ];

      // Filter out any existing database messages for Eric Silva and Maria Serpa
      const filteredMessages = transformedMessages.filter(
        (msg) =>
          msg.callerPhone !== "4084260512" &&
          msg.callerPhone !== "408-426-0512" &&
          msg.callerPhone !== "+14084260512" &&
          msg.callerPhone !== "4085612356" &&
          msg.callerPhone !== "408-561-2356" &&
          msg.callerPhone !== "+14085612356",
      );

      // Prepend static messages to the filtered results (they appear first due to DESC order)
      const allMessages = [...staticMessages, ...filteredMessages];

      return {
        messages: allMessages,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: (count ?? 0) + staticMessages.length,
          totalPages: Math.ceil(
            ((count ?? 0) + staticMessages.length) / input.pageSize,
          ),
        },
      };
    }),
});
