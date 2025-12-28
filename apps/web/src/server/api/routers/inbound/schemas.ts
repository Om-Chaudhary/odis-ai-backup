/**
 * Inbound Router Schemas
 *
 * Zod validation schemas for inbound data procedures:
 * - vapi_bookings (from VAPI schedule-appointment tool)
 * - clinic_messages (from VAPI leave-message tool)
 */

import { z } from "zod";

// =============================================================================
// Enums
// =============================================================================

export const appointmentStatusEnum = z.enum([
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
]);

export const messageStatusEnum = z.enum(["new", "read", "resolved"]);

export const messagePriorityEnum = z.enum(["urgent", "normal"]);

export const messageTypeEnum = z.enum([
  "callback_request",
  "general_inquiry",
  "prescription_refill",
  "other",
]);

export const callStatusEnum = z.enum([
  "queued",
  "ringing",
  "in_progress",
  "completed",
  "failed",
  "cancelled",
]);

export const userSentimentEnum = z.enum(["positive", "neutral", "negative"]);

// =============================================================================
// Input Schemas - Appointment Requests
// =============================================================================

export const listAppointmentRequestsInput = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(5).max(100).default(25),
  status: appointmentStatusEnum.optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isNewClient: z.boolean().optional(),
});

export const updateAppointmentRequestInput = z.object({
  id: z.string().uuid(),
  status: appointmentStatusEnum,
  notes: z.string().optional(),
  confirmedAppointmentId: z.string().uuid().optional(),
  confirmedDate: z.string().optional(), // "YYYY-MM-DD" format
  confirmedTime: z.string().optional(), // "HH:MM" format
});

// =============================================================================
// Input Schemas - Clinic Messages
// =============================================================================

export const listClinicMessagesInput = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(5).max(100).default(25),
  status: messageStatusEnum.optional(),
  priority: messagePriorityEnum.optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const updateClinicMessageInput = z.object({
  id: z.string().uuid(),
  status: messageStatusEnum.optional(),
  assignedToUserId: z.string().uuid().nullable().optional(),
});

export const markMessageReadInput = z.object({
  id: z.string().uuid(),
});

// =============================================================================
// Input Schemas - Stats
// =============================================================================

export const getInboundStatsInput = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type AppointmentStatus = z.infer<typeof appointmentStatusEnum>;
export type MessageStatus = z.infer<typeof messageStatusEnum>;
export type MessagePriority = z.infer<typeof messagePriorityEnum>;
export type MessageType = z.infer<typeof messageTypeEnum>;
export type CallStatus = z.infer<typeof callStatusEnum>;
export type UserSentiment = z.infer<typeof userSentimentEnum>;

export type ListAppointmentRequestsInput = z.infer<
  typeof listAppointmentRequestsInput
>;
export type UpdateAppointmentRequestInput = z.infer<
  typeof updateAppointmentRequestInput
>;
export type ListClinicMessagesInput = z.infer<typeof listClinicMessagesInput>;
export type UpdateClinicMessageInput = z.infer<typeof updateClinicMessageInput>;
export type MarkMessageReadInput = z.infer<typeof markMessageReadInput>;
export type GetInboundStatsInput = z.infer<typeof getInboundStatsInput>;
