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

      // Add static mock messages for Eric Silva and Maria Serpa (Dec 15, 2025)
      const staticMessages = [
        {
          id: "eric-silva-static",
          clinicId: "demo-clinic-eric-silva",
          callerName: "Eric Silva",
          callerPhone: "4084260512",
          messageContent:
            "Caller noticed stitches coming loose on their pet, Jack. There's very little bleeding, and the pet is not in discomfort. Caller requests a callback for further instructions.",
          messageType: "callback_request",
          priority: "normal",
          status: "new",
          assignedToUserId: null,
          vapiCallId: null,
          metadata: {
            demoCallData: {
              recordingUrl: "/audio/JackStitches.MP3",
              transcript: `AI: Thank you for calling Alum Rock Animal Hospital. This is the after-hours line. How may I help you tonight?

User: Hi, this is Eric Silva. I'm calling because my dog Jack just had surgery a few days ago and I noticed that some of his stitches look like they're coming loose.

AI: I understand your concern, Eric. Let me ask a few questions to better assess the situation. Is there any bleeding around the incision site?

User: There's a little bit, but it's very minimal. Just a tiny bit of blood.

AI: Okay, and is Jack showing any signs of discomfort or pain? Is he licking or scratching at the area?

User: No, he seems pretty comfortable actually. He's not bothering it at all. I just noticed it when I was checking on him.

AI: That's good to hear. Based on what you've described - minimal bleeding and Jack not showing discomfort - this doesn't appear to be an emergency situation. However, I want to make sure we follow up with you properly.

User: Yeah, I'd appreciate that. I just want to make sure everything is okay.

AI: Absolutely. I'm going to leave a message for the veterinary team to call you back first thing in the morning. They'll be able to give you specific instructions or schedule a follow-up appointment if needed. Can you confirm your callback number is the one you're calling from?

User: Yes, that's correct. 408-426-0512.

AI: Perfect. A team member will reach out to you tomorrow morning. In the meantime, try to keep Jack from licking the area - you can use an e-collar if you have one. If you notice increased bleeding, swelling, discharge, or if Jack starts acting painful, please call back or go to an emergency clinic.

User: Okay, thank you so much. I appreciate your help.

AI: You're welcome, Eric. Take care of Jack, and someone will be in touch tomorrow. Have a good night.`,
              durationSeconds: 142,
              summary:
                "Eric Silva called concerned about loose stitches on his dog Jack post-surgery. Minimal bleeding reported, pet not in discomfort. Callback requested for morning follow-up with veterinary team.",
            },
          },
          readAt: null,
          // Dec 15, 2025 7:06 PM PST = Dec 16, 2025 3:06 AM UTC
          createdAt: "2025-12-16T03:06:00.000Z",
          updatedAt: "2025-12-16T03:06:00.000Z",
        },
        {
          id: "maria-serpa-static",
          clinicId: "demo-clinic-maria-serpa",
          callerName: "Maria Serpa",
          callerPhone: "4085612356",
          messageContent:
            "Caller Maria Serpa would like to cancel her dog's appointment.",
          messageType: "appointment_change",
          priority: "normal",
          status: "new",
          assignedToUserId: null,
          vapiCallId: null,
          metadata: {
            demoCallData: {
              recordingUrl: "/audio/cancelAppt.MP3",
              transcript: `AI: Thank you for calling Alum Rock Animal Hospital. This is the after-hours line. How may I help you?

User: Hi, this is Maria Serpa. I need to cancel my dog's appointment.

AI: Of course, Maria. I'd be happy to help you with that. Can you tell me your dog's name and when the appointment was scheduled for?

User: Her name is Luna, and the appointment is scheduled for tomorrow morning at 10 AM.

AI: Thank you. I've noted that you need to cancel Luna's appointment for tomorrow at 10 AM. May I ask the reason for the cancellation? This helps our team with scheduling.

User: We had a family emergency come up and I won't be able to make it.

AI: I completely understand, Maria. I'm sorry to hear about your family emergency. I'll make sure the team gets this message first thing in the morning and cancels Luna's appointment.

User: Thank you. Can I call back later to reschedule?

AI: Absolutely. You can call back anytime during our regular business hours, which are Monday through Friday 8 AM to 6 PM, and Saturday 8 AM to 2 PM. They'll be happy to help you find a new appointment time for Luna.

User: Perfect, thank you so much.

AI: You're welcome, Maria. I hope everything is okay with your family. Take care, and we look forward to seeing Luna when you're able to reschedule.

User: Thanks, bye.

AI: Goodbye, take care.`,
              durationSeconds: 87,
              summary:
                "Maria Serpa called to cancel her dog Luna's appointment scheduled for tomorrow at 10 AM due to a family emergency. She will call back to reschedule during business hours.",
            },
          },
          readAt: null,
          // Dec 15, 2025 7:01 PM PST = Dec 16, 2025 3:01 AM UTC
          createdAt: "2025-12-16T03:01:00.000Z",
          updatedAt: "2025-12-16T03:01:00.000Z",
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

      // Combine and sort all messages by date (most recent first)
      const allMessages = [...staticMessages, ...filteredMessages].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

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
