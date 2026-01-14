/**
 * Messaging-related Tool Schemas
 *
 * Schemas for message logging and callback requests.
 */

import { z } from "zod";

/* ========================================
   Message Type Enum
   ======================================== */

/**
 * Message type categorization
 */
export const MessageTypeEnum = z.enum([
  "general",
  "billing",
  "records",
  "refill",
  "clinical",
  "other",
]);

export type MessageType = z.infer<typeof MessageTypeEnum>;

/* ========================================
   Leave Message
   ======================================== */

/**
 * Schema: leave_message
 *
 * Log a callback request with categorization.
 * Used by Admin Agent for message logging.
 */
export const LeaveMessageSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Client info
  client_name: z.string().min(1, "client_name is required"),
  client_phone: z.string().min(1, "client_phone is required"),

  // Pet info (optional for general messages)
  pet_name: z.string().optional(),

  // Message details
  message: z.string().min(1, "message is required"),
  is_urgent: z.boolean().default(false),
  message_type: MessageTypeEnum.optional().default("general"),
  best_callback_time: z.string().optional(),
  notes: z.string().optional(),
});

export type LeaveMessageInput = z.infer<typeof LeaveMessageSchema>;
