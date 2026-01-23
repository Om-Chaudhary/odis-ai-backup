/**
 * Discharge Status Derivation Utilities
 *
 * Shared functions for deriving composite discharge case statuses
 * from call, email, and case data. Used across outbound procedures.
 */

/**
 * Composite status for a discharge case based on call/email states
 */
export type DischargeCaseStatus =
  | "pending_review"
  | "scheduled"
  | "ready"
  | "in_progress"
  | "completed"
  | "failed";

/**
 * Category of failure for failed cases
 */
export type FailureCategory =
  | "all_failed"
  | "silence_timeout"
  | "no_answer"
  | "connection_error"
  | "voicemail"
  | "email_failed"
  | "other";

/**
 * Delivery status for phone/email columns
 */
export type DeliveryStatus =
  | "sent"
  | "pending"
  | "failed"
  | "not_applicable"
  | null;

/**
 * Derive composite discharge status from case data.
 *
 * Priority order:
 * 1. failed - call or email failed
 * 2. completed - call completed (or no call) AND email sent (or no email)
 * 3. in_progress - call is ringing or in progress
 * 4. scheduled - has queued items with future scheduled_for time
 * 5. ready - has queued items with past/current scheduled_for time
 * 6. pending_review - default state
 */
export function deriveDischargeStatus(
  caseStatus: string | null,
  hasDischargeSummary: boolean,
  callStatus: string | null,
  emailStatus: string | null,
  callScheduledFor: string | null,
  emailScheduledFor: string | null,
): DischargeCaseStatus {
  const now = new Date();

  // Failed: call or email failed
  if (callStatus === "failed" || emailStatus === "failed") {
    return "failed";
  }

  // Completed: call completed (or no call needed) and email sent (or no email needed)
  if (
    (callStatus === "completed" || callStatus === null) &&
    (emailStatus === "sent" || emailStatus === null) &&
    (callStatus === "completed" || emailStatus === "sent")
  ) {
    return "completed";
  }

  // In Progress: call is ringing or in progress
  if (callStatus === "ringing" || callStatus === "in_progress") {
    return "in_progress";
  }

  // Check if queued items are scheduled for the future
  const callIsFuture = callScheduledFor && new Date(callScheduledFor) > now;
  const emailIsFuture = emailScheduledFor && new Date(emailScheduledFor) > now;

  // Scheduled: has queued items with future scheduled_for time
  if (
    (callStatus === "queued" && callIsFuture) ||
    (emailStatus === "queued" && emailIsFuture)
  ) {
    return "scheduled";
  }

  // Ready: has queued items with past/current scheduled_for time (ready to send)
  if (callStatus === "queued" || emailStatus === "queued") {
    return "ready";
  }

  // Pending Review: case completed with discharge summary, but nothing scheduled
  if (caseStatus === "completed" && hasDischargeSummary) {
    return "pending_review";
  }

  // Default to pending_review
  return "pending_review";
}

/**
 * Derive delivery status for phone/email columns.
 *
 * Maps raw status strings to normalized delivery status values.
 */
export function deriveDeliveryStatus(
  status: string | null,
  hasContactInfo: boolean,
): DeliveryStatus {
  if (!hasContactInfo) return "not_applicable";
  if (!status) return null;

  switch (status) {
    case "completed":
    case "sent":
      return "sent";
    case "queued":
    case "ringing":
    case "in_progress":
      return "pending";
    case "failed":
      return "failed";
    default:
      return null;
  }
}

/**
 * Actionable attention types that warrant showing in "needs attention" view.
 *
 * Only cases with these types are actionable:
 * - medication_question (Pill icon)
 * - callback_request (Phone icon)
 * - appointment_needed (Calendar icon)
 *
 * Excludes health_concern (triangle) and emergency_signs (octagon) which
 * are informational rather than requiring staff action.
 */
const ACTIONABLE_ATTENTION_TYPES = [
  "medication_question",
  "callback_request",
  "appointment_needed",
] as const;

/**
 * Check if attention types contain actionable items that warrant being shown
 * in the "needs attention" view.
 */
export function hasActionableAttentionTypes(
  attentionTypes: string[] | null,
): boolean {
  if (!attentionTypes || attentionTypes.length === 0) {
    return false;
  }

  return attentionTypes.some((type) =>
    (ACTIONABLE_ATTENTION_TYPES as readonly string[]).includes(type),
  );
}

/**
 * Categorize a failure based on ended_reason and statuses.
 *
 * Returns a specific failure category for analytics and filtering.
 * Returns null if neither call nor email failed.
 */
export function categorizeFailure(
  callEndedReason: string | null,
  callStatus: string | null,
  emailStatus: string | null,
): Exclude<FailureCategory, "all_failed"> | null {
  // If neither call nor email failed, not a failure
  if (callStatus !== "failed" && emailStatus !== "failed") {
    return null;
  }

  // Email failure (when call didn't fail)
  if (emailStatus === "failed" && callStatus !== "failed") {
    return "email_failed";
  }

  // Call failure - categorize by ended_reason
  if (callStatus === "failed" && callEndedReason) {
    const reason = callEndedReason.toLowerCase();

    if (
      reason.includes("silence-timed-out") ||
      reason.includes("silence_timed_out")
    ) {
      return "silence_timeout";
    }
    if (
      reason.includes("no-answer") ||
      reason.includes("did-not-answer") ||
      reason.includes("no_answer")
    ) {
      return "no_answer";
    }
    if (reason.includes("voicemail")) {
      return "voicemail";
    }
    if (
      reason.includes("error") ||
      reason.includes("failed-to-connect") ||
      reason.includes("sip")
    ) {
      return "connection_error";
    }
  }

  return "other";
}
