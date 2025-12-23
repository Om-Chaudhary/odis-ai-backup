/**
 * Outbound Discharge Router Schemas
 *
 * Zod validation schemas for outbound discharge procedures.
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

export const emailStatusEnum = z.enum([
  "queued",
  "sent",
  "failed",
  "cancelled",
]);

export const dischargeCaseStatusEnum = z.enum([
  "pending_review",
  "scheduled",
  "ready",
  "in_progress",
  "completed",
  "failed",
]);

export const reviewCategoryEnum = z.enum([
  "to_review",
  "good",
  "bad",
  "voicemail",
  "failed",
  "no_answer",
  "needs_followup",
]);

export const failureCategoryEnum = z.enum([
  "all_failed",
  "silence_timeout",
  "no_answer",
  "connection_error",
  "voicemail",
  "email_failed",
  "other",
]);

export const attentionTypeEnum = z.enum([
  "health_concern",
  "callback_request",
  "medication_question",
  "appointment_needed",
  "dissatisfaction",
  "billing_question",
  "emergency_signs",
]);

export const attentionSeverityEnum = z.enum(["routine", "urgent", "critical"]);

export const viewModeEnum = z.enum(["all", "needs_review", "needs_attention"]);

// =============================================================================
// Input Schemas
// =============================================================================

export const listDischargeCasesInput = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(5).max(100).default(20),
  status: dischargeCaseStatusEnum.optional(),
  failureCategory: failureCategoryEnum.optional(),
  viewMode: viewModeEnum.optional(),
  attentionTypes: z.array(attentionTypeEnum).optional(),
  attentionSeverity: attentionSeverityEnum.optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  veterinarianId: z.string().uuid().optional(),
});

export const getDischargeCaseStatsInput = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const getDischargeCaseDetailInput = z.object({
  caseId: z.string().uuid(),
});

export const approveAndScheduleInput = z.object({
  caseId: z.string().uuid(),
  phoneEnabled: z.boolean().default(true),
  emailEnabled: z.boolean().default(true),
  /** When true, sends immediately instead of using scheduled delays (useful for test mode) */
  immediateDelivery: z.boolean().default(false),
});

export const skipCaseInput = z.object({
  caseId: z.string().uuid(),
  reason: z.string().optional(),
});

export const updateCallScriptInput = z.object({
  caseId: z.string().uuid(),
  callScript: z.string().min(1),
});

export const updateEmailContentInput = z.object({
  caseId: z.string().uuid(),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
});

export const retryFailedDeliveryInput = z.object({
  caseId: z.string().uuid(),
  retryCall: z.boolean().default(false),
  retryEmail: z.boolean().default(false),
});

export const scheduleRemainingOutreachInput = z.object({
  caseId: z.string().uuid(),
  /** Schedule the phone call for this case */
  scheduleCall: z.boolean().default(false),
  /** Schedule the email for this case */
  scheduleEmail: z.boolean().default(false),
  /** When true, sends immediately instead of using scheduled delays */
  immediateDelivery: z.boolean().default(false),
});

export const cancelScheduledDeliveryInput = z.object({
  caseId: z.string().uuid(),
  cancelCall: z.boolean().default(false),
  cancelEmail: z.boolean().default(false),
});

export const batchCancelInput = z.object({
  /** List of case IDs to cancel scheduled deliveries for */
  caseIds: z.array(z.string().uuid()).min(1).max(100),
  /** Cancel scheduled phone calls */
  cancelCalls: z.boolean().default(true),
  /** Cancel scheduled emails */
  cancelEmails: z.boolean().default(true),
});

export const batchScheduleInput = z.object({
  /** List of case IDs to schedule */
  caseIds: z.array(z.string().uuid()).min(1).max(100),
  /** Enable phone calls for all cases */
  phoneEnabled: z.boolean().default(true),
  /** Enable emails for all cases */
  emailEnabled: z.boolean().default(true),
  /** Timing mode: 'scheduled' uses delay settings, 'immediate' staggers 1 min apart */
  timingMode: z.enum(["scheduled", "immediate"]).default("scheduled"),
  /** Stagger interval in seconds for immediate mode (min: 30, max: 300) */
  staggerIntervalSeconds: z.number().min(30).max(300).default(60),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CallStatus = z.infer<typeof callStatusEnum>;
export type EmailStatus = z.infer<typeof emailStatusEnum>;
export type DischargeCaseStatus = z.infer<typeof dischargeCaseStatusEnum>;
export type ReviewCategory = z.infer<typeof reviewCategoryEnum>;
export type FailureCategory = z.infer<typeof failureCategoryEnum>;
export type AttentionType = z.infer<typeof attentionTypeEnum>;
export type AttentionSeverity = z.infer<typeof attentionSeverityEnum>;
export type ViewMode = z.infer<typeof viewModeEnum>;
export type ListDischargeCasesInput = z.infer<typeof listDischargeCasesInput>;
export type GetDischargeCaseStatsInput = z.infer<
  typeof getDischargeCaseStatsInput
>;
export type GetDischargeCaseDetailInput = z.infer<
  typeof getDischargeCaseDetailInput
>;
export type ApproveAndScheduleInput = z.infer<typeof approveAndScheduleInput>;
export type SkipCaseInput = z.infer<typeof skipCaseInput>;
export type UpdateCallScriptInput = z.infer<typeof updateCallScriptInput>;
export type UpdateEmailContentInput = z.infer<typeof updateEmailContentInput>;
export type RetryFailedDeliveryInput = z.infer<typeof retryFailedDeliveryInput>;
export type ScheduleRemainingOutreachInput = z.infer<
  typeof scheduleRemainingOutreachInput
>;
export type CancelScheduledDeliveryInput = z.infer<
  typeof cancelScheduledDeliveryInput
>;
export type BatchCancelInput = z.infer<typeof batchCancelInput>;
export type BatchScheduleInput = z.infer<typeof batchScheduleInput>;
