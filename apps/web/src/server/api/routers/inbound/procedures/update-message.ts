/**
 * Update Clinic Message Procedure
 *
 * Allows marking messages as read, resolved, or assigning to users.
 */

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createClient } from "@odis-ai/db/server";
import { updateClinicMessageInput, markMessageReadInput } from "../schemas";

/**
 * Get user's clinic ID for authorization
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

export const updateMessageRouter = createTRPCRouter({
  /**
   * Update a clinic message (status, assignment)
   */
  updateClinicMessage: protectedProcedure
    .input(updateClinicMessageInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = await createClient();

      // Get current user's clinic
      const user = await getUserClinicId(supabase, ctx.user.id);

      // First, verify the message belongs to the user's clinic
      const { data: message, error: fetchError } = await supabase
        .from("clinic_messages")
        .select("id, clinic_id, status")
        .eq("id", input.id)
        .single();

      if (fetchError || !message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      // Check authorization
      if (user.clinic_id && message.clinic_id !== user.clinic_id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this message",
        });
      }

      // Build update object
      const updateData: {
        status?: string;
        assigned_to_user_id?: string | null;
        read_at?: string | null;
        updated_at: string;
      } = {
        updated_at: new Date().toISOString(),
      };

      if (input.status !== undefined) {
        updateData.status = input.status;

        // Set read_at when marking as read
        if (input.status === "read" && !message.status) {
          updateData.read_at = new Date().toISOString();
        }
      }

      if (input.assignedToUserId !== undefined) {
        updateData.assigned_to_user_id = input.assignedToUserId;
      }

      // Update the message
      const { data: updated, error: updateError } = await supabase
        .from("clinic_messages")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update message: ${updateError.message}`,
        });
      }

      return {
        success: true,
        message: {
          id: updated.id,
          status: updated.status,
          assignedToUserId: updated.assigned_to_user_id,
          readAt: updated.read_at,
          updatedAt: updated.updated_at,
        },
      };
    }),

  /**
   * Quick action to mark a message as read
   */
  markMessageRead: protectedProcedure
    .input(markMessageReadInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = await createClient();

      // Get current user's clinic
      const user = await getUserClinicId(supabase, ctx.user.id);

      // First, verify the message belongs to the user's clinic
      const { data: message, error: fetchError } = await supabase
        .from("clinic_messages")
        .select("id, clinic_id, status, read_at")
        .eq("id", input.id)
        .single();

      if (fetchError || !message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      // Check authorization
      if (user.clinic_id && message.clinic_id !== user.clinic_id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this message",
        });
      }

      // Skip if already read
      if (message.read_at) {
        return {
          success: true,
          message: {
            id: message.id,
            status: message.status,
            readAt: message.read_at,
          },
        };
      }

      // Mark as read
      const now = new Date().toISOString();
      const { data: updated, error: updateError } = await supabase
        .from("clinic_messages")
        .update({
          status: message.status === "new" ? "read" : message.status,
          read_at: now,
          updated_at: now,
        })
        .eq("id", input.id)
        .select()
        .single();

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to mark message as read: ${updateError.message}`,
        });
      }

      return {
        success: true,
        message: {
          id: updated.id,
          status: updated.status,
          readAt: updated.read_at,
        },
      };
    }),
});
