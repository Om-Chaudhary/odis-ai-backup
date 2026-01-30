/**
 * Inbound Calls Validation Schemas
 *
 * Zod validation schemas for inbound call procedures.
 */

import { z } from "zod";

// =============================================================================
// Enums
// =============================================================================

export const callStatusEnum = z.enum([
  "queued",
  "ringing",
  "in_progress",
  "completed",
  "failed",
  "cancelled",
]);

export const userSentimentEnum = z.enum(["positive", "neutral", "negative"]);

export const callOutcomeEnum = z.enum([
  "scheduled",
  "rescheduled",
  "cancellation",
  "emergency",
  "callback",
  "info",
]);

// =============================================================================
// Input Schemas - Call Listing
// =============================================================================

export const listInboundCallsInput = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(5).max(100).default(20),
  status: callStatusEnum.optional(),
  sentiment: userSentimentEnum.optional(),
  outcomes: z.array(callOutcomeEnum).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  clinicName: z.string().optional(),
  clinicId: z.string().uuid().optional(),
  assistantId: z.string().optional(),
  search: z.string().optional(),
});

export const getInboundCallInput = z.object({
  id: z.string().uuid(),
});

export const getInboundCallByVapiIdInput = z.object({
  vapiCallId: z.string(),
});

export const getInboundCallStatsInput = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  clinicName: z.string().optional(),
});

export const getInboundCallsByClinicInput = z.object({
  clinicName: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(5).max(100).default(20),
});

export const deleteInboundCallInput = z.object({
  id: z.string().uuid(),
});

// =============================================================================
// Input Schemas - Transcript
// =============================================================================

export const updateDisplayTranscriptInput = z.object({
  id: z.string().uuid(),
  displayTranscript: z.string().nullable(),
  useDisplayTranscript: z.boolean(),
});

export const translateTranscriptInput = z.object({
  transcript: z.string().min(1),
});

export const cleanTranscriptInput = z.object({
  transcript: z.string().min(1),
  clinicName: z.string().optional(),
  knowledgeBase: z
    .object({
      hospitalNames: z.array(z.string()).optional(),
      staffNames: z.array(z.string()).optional(),
      petNames: z.array(z.string()).optional(),
      customTerms: z.array(z.string()).optional(),
    })
    .optional(),
});

// =============================================================================
// Input Schemas - VAPI Sync
// =============================================================================

export const fetchCallFromVAPIInput = z.object({
  vapiCallId: z.string().min(1, "VAPI call ID cannot be empty"),
});

export const getCallDataForAppointmentInput = z.object({
  vapiCallId: z.string().min(1, "VAPI call ID cannot be empty"),
});

export const syncCallFromVAPIInput = z.object({
  id: z.string().uuid(),
  forceUpdate: z.boolean().default(false),
});

export const batchSyncFromVAPIInput = z.object({
  ids: z.array(z.string().uuid()).max(50),
  forceUpdate: z.boolean().default(false),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CallStatus = z.infer<typeof callStatusEnum>;
export type UserSentiment = z.infer<typeof userSentimentEnum>;
export type CallOutcome = z.infer<typeof callOutcomeEnum>;

export type ListInboundCallsInput = z.infer<typeof listInboundCallsInput>;
export type GetInboundCallInput = z.infer<typeof getInboundCallInput>;
export type GetInboundCallByVapiIdInput = z.infer<
  typeof getInboundCallByVapiIdInput
>;
export type GetInboundCallStatsInput = z.infer<typeof getInboundCallStatsInput>;
export type GetInboundCallsByClinicInput = z.infer<
  typeof getInboundCallsByClinicInput
>;
export type DeleteInboundCallInput = z.infer<typeof deleteInboundCallInput>;

export type UpdateDisplayTranscriptInput = z.infer<
  typeof updateDisplayTranscriptInput
>;
export type TranslateTranscriptInput = z.infer<typeof translateTranscriptInput>;
export type CleanTranscriptInput = z.infer<typeof cleanTranscriptInput>;

export type FetchCallFromVAPIInput = z.infer<typeof fetchCallFromVAPIInput>;
export type GetCallDataForAppointmentInput = z.infer<
  typeof getCallDataForAppointmentInput
>;
export type SyncCallFromVAPIInput = z.infer<typeof syncCallFromVAPIInput>;
export type BatchSyncFromVAPIInput = z.infer<typeof batchSyncFromVAPIInput>;
