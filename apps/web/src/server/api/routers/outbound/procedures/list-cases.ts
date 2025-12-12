/**
 * List Discharge Cases Procedure
 *
 * Returns paginated list of discharge cases with derived composite status.
 * Joins: cases + patients + discharge_summaries + scheduled_calls + scheduled_emails
 */

import { TRPCError } from "@trpc/server";
import { getClinicUserIds } from "@odis-ai/clinics/utils";
import { getLocalDayRange, DEFAULT_TIMEZONE } from "@odis-ai/utils/timezone";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  listDischargeCasesInput,
  type DischargeCaseStatus,
  type FailureCategory,
} from "../schemas";

interface PatientData {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  date_of_birth: string | null;
  sex: string | null;
  weight_kg: number | null;
  owner_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;
}

interface DischargeSummaryData {
  id: string;
  content: string;
  structured_content: unknown;
  created_at: string;
}

interface ScheduledCallMetadata {
  test_call?: boolean;
  [key: string]: unknown;
}

interface ScheduledCallStructuredData {
  urgent_case?: boolean;
  [key: string]: unknown;
}

interface ScheduledCallData {
  id: string;
  status: string;
  scheduled_for: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  ended_reason: string | null;
  transcript: string | null;
  summary: string | null;
  customer_phone: string | null;
  dynamic_variables: unknown;
  metadata: ScheduledCallMetadata | null;
  structured_data: ScheduledCallStructuredData | null;
  urgent_reason_summary: string | null;
  recording_url: string | null;
  stereo_recording_url: string | null;
}

interface ScheduledEmailData {
  id: string;
  status: string;
  scheduled_for: string;
  sent_at: string | null;
  recipient_email: string;
  subject: string;
  html_content: string;
}

interface SoapNoteData {
  id: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  client_instructions: string | null;
  created_at: string;
}

interface CaseMetadata {
  idexx?: {
    notes?: string;
    consultation_notes?: string;
  };
  [key: string]: unknown;
}

interface CaseRow {
  id: string;
  type: string | null;
  status: string | null;
  created_at: string;
  scheduled_at: string | null;
  user_id: string;
  metadata: CaseMetadata | null;
  extreme_case_check: unknown;
  patients: PatientData[];
  discharge_summaries: DischargeSummaryData[];
  scheduled_discharge_calls: ScheduledCallData[];
  scheduled_discharge_emails: ScheduledEmailData[];
  soap_notes: SoapNoteData[];
}

/**
 * Derive composite discharge status from case data
 */
function deriveDischargeStatus(
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
 * Derive delivery status for phone/email columns
 */
function deriveDeliveryStatus(
  status: string | null,
  hasContactInfo: boolean,
): "sent" | "pending" | "failed" | "not_applicable" | null {
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
 * Categorize a failure based on ended_reason and statuses
 */
function categorizeFailure(
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

export const listCasesRouter = createTRPCRouter({
  listDischargeCases: protectedProcedure
    .input(listDischargeCasesInput)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get user's test mode setting
      const { data: userSettings } = await ctx.supabase
        .from("users")
        .select("test_mode_enabled")
        .eq("id", userId)
        .single();

      const testModeEnabled = userSettings?.test_mode_enabled ?? false;

      // Get all user IDs in the same clinic for shared view
      const clinicUserIds = await getClinicUserIds(userId, ctx.supabase);

      // Build base query with all related data
      let query = ctx.supabase
        .from("cases")
        .select(
          `
          id,
          type,
          status,
          created_at,
          scheduled_at,
          user_id,
          metadata,
          extreme_case_check,
          patients (
            id,
            name,
            species,
            breed,
            date_of_birth,
            sex,
            weight_kg,
            owner_name,
            owner_phone,
            owner_email
          ),
          discharge_summaries (
            id,
            content,
            structured_content,
            created_at
          ),
          scheduled_discharge_calls (
            id,
            status,
            scheduled_for,
            started_at,
            ended_at,
            duration_seconds,
            ended_reason,
            transcript,
            summary,
            customer_phone,
            dynamic_variables,
            metadata,
            structured_data,
            urgent_reason_summary,
            recording_url,
            stereo_recording_url
          ),
          scheduled_discharge_emails (
            id,
            status,
            scheduled_for,
            sent_at,
            recipient_email,
            subject,
            html_content
          ),
          soap_notes (
            id,
            subjective,
            objective,
            assessment,
            plan,
            client_instructions,
            created_at
          )
        `,
          { count: "exact" },
        )
        .in("user_id", clinicUserIds)
        .order("scheduled_at", { ascending: false, nullsFirst: false });

      // Apply date filters with proper timezone-aware boundaries
      // Use scheduled_at (appointment time) instead of created_at (sync time)
      // This matches how the extension groups cases by appointment date
      // Falls back to created_at when scheduled_at is null (COALESCE pattern)
      if (input.startDate && input.endDate) {
        // Both dates provided - use timezone-aware range with fallback
        const startRange = getLocalDayRange(input.startDate, DEFAULT_TIMEZONE);
        const endRange = getLocalDayRange(input.endDate, DEFAULT_TIMEZONE);
        // Use .or() to implement COALESCE(scheduled_at, created_at) logic:
        // 1. Cases where scheduled_at is in range, OR
        // 2. Cases where scheduled_at is null AND created_at is in range
        query = query.or(
          `and(scheduled_at.gte.${startRange.startISO},scheduled_at.lte.${endRange.endISO}),and(scheduled_at.is.null,created_at.gte.${startRange.startISO},created_at.lte.${endRange.endISO})`,
        );
      } else if (input.startDate) {
        // Only start date - get timezone-aware start of day with fallback
        const { startISO } = getLocalDayRange(
          input.startDate,
          DEFAULT_TIMEZONE,
        );
        query = query.or(
          `scheduled_at.gte.${startISO},and(scheduled_at.is.null,created_at.gte.${startISO})`,
        );
      } else if (input.endDate) {
        // Only end date - get timezone-aware end of day with fallback
        const { endISO } = getLocalDayRange(input.endDate, DEFAULT_TIMEZONE);
        query = query.or(
          `scheduled_at.lte.${endISO},and(scheduled_at.is.null,created_at.lte.${endISO})`,
        );
      }

      const { data: cases, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch discharge cases: ${error.message}`,
        });
      }

      // Transform and filter cases
      const transformedCases = ((cases as CaseRow[]) ?? []).map((c) => {
        const patient = c.patients?.[0];
        const dischargeSummary = c.discharge_summaries?.[0];
        const scheduledCall = c.scheduled_discharge_calls?.[0];
        const scheduledEmail = c.scheduled_discharge_emails?.[0];

        const callStatus = scheduledCall?.status ?? null;
        const emailStatus = scheduledEmail?.status ?? null;
        const callScheduledFor = scheduledCall?.scheduled_for ?? null;
        const emailScheduledFor = scheduledEmail?.scheduled_for ?? null;

        // Check if this is a test call (metadata.test_call === true)
        const callMetadata =
          scheduledCall?.metadata as ScheduledCallMetadata | null;
        const isTestCall = callMetadata?.test_call === true;

        const compositeStatus = deriveDischargeStatus(
          c.status,
          !!dischargeSummary,
          callStatus,
          emailStatus,
          callScheduledFor,
          emailScheduledFor,
        );

        const hasPhone = !!patient?.owner_phone;
        const hasEmail = !!patient?.owner_email;

        // Extract IDEXX notes from metadata
        // Priority: consultation_notes (rich clinical data) > notes (short appointment note)
        const metadata = c.metadata;
        const rawConsultationNotes = metadata?.idexx?.consultation_notes;
        const idexxNotes = rawConsultationNotes
          ? rawConsultationNotes
              .replace(/<[^>]*>/g, " ")
              .replace(/&nbsp;/g, " ")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/\s+/g, " ")
              .trim()
          : (metadata?.idexx?.notes ?? null);

        // Transform SOAP notes
        const soapNotes = (c.soap_notes ?? []).map((note) => ({
          id: note.id,
          subjective: note.subjective,
          objective: note.objective,
          assessment: note.assessment,
          plan: note.plan,
          clientInstructions: note.client_instructions,
          createdAt: note.created_at,
        }));

        // Categorize failure if this is a failed case
        const callEndedReason = scheduledCall?.ended_reason ?? null;
        const failureCategory = categorizeFailure(
          callEndedReason,
          callStatus,
          emailStatus,
        );

        return {
          id: c.id,
          caseId: c.id,
          patient: {
            id: patient?.id ?? "",
            name: patient?.name ?? "Unknown",
            species: patient?.species ?? null,
            breed: patient?.breed ?? null,
            dateOfBirth: patient?.date_of_birth ?? null,
            sex: patient?.sex ?? null,
            weightKg: patient?.weight_kg ?? null,
          },
          owner: {
            name: patient?.owner_name ?? null,
            phone: patient?.owner_phone ?? null,
            email: patient?.owner_email ?? null,
          },
          caseType: c.type,
          caseStatus: c.status,
          veterinarian: "Dr. Staff", // TODO: Get from user/case
          status: compositeStatus,
          failureCategory,
          phoneSent: deriveDeliveryStatus(callStatus, hasPhone),
          emailSent: deriveDeliveryStatus(emailStatus, hasEmail),
          dischargeSummary: dischargeSummary?.content ?? "",
          structuredContent: dischargeSummary?.structured_content ?? null,
          callScript:
            (scheduledCall?.dynamic_variables as Record<string, unknown>)
              ?.call_script ?? "",
          emailContent: scheduledEmail?.html_content ?? "",
          scheduledCall: scheduledCall
            ? {
                id: scheduledCall.id,
                status: scheduledCall.status,
                scheduledFor: scheduledCall.scheduled_for,
                startedAt: scheduledCall.started_at,
                endedAt: scheduledCall.ended_at,
                durationSeconds: scheduledCall.duration_seconds,
                endedReason: scheduledCall.ended_reason,
                transcript: scheduledCall.transcript,
                summary: scheduledCall.summary,
                customerPhone: scheduledCall.customer_phone,
                structuredData: scheduledCall.structured_data,
                urgentReasonSummary: scheduledCall.urgent_reason_summary,
                recordingUrl: scheduledCall.recording_url,
                stereoRecordingUrl: scheduledCall.stereo_recording_url,
              }
            : null,
          isUrgentCase:
            (
              scheduledCall?.structured_data as ScheduledCallStructuredData | null
            )?.urgent_case === true,
          scheduledEmail: scheduledEmail
            ? {
                id: scheduledEmail.id,
                status: scheduledEmail.status,
                scheduledFor: scheduledEmail.scheduled_for,
                sentAt: scheduledEmail.sent_at,
                recipientEmail: scheduledEmail.recipient_email,
                subject: scheduledEmail.subject,
              }
            : null,
          timestamp: c.scheduled_at ?? c.created_at,
          createdAt: c.created_at,
          extremeCaseCheck: c.extreme_case_check,
          idexxNotes,
          soapNotes,
          scheduledEmailFor: emailScheduledFor,
          scheduledCallFor: callScheduledFor,
          isTestCall,
        };
      });

      // Filter out test calls when test mode is disabled
      // This ensures production users don't see test cases in their dashboard
      let filteredCases = transformedCases;
      if (!testModeEnabled) {
        filteredCases = filteredCases.filter((c) => !c.isTestCall);
      }

      // Apply status filter (client-side since it's derived)
      if (input.status) {
        filteredCases = filteredCases.filter((c) => c.status === input.status);
      }

      // Apply failure category filter
      if (input.failureCategory) {
        if (input.failureCategory === "all_failed") {
          // Show all failed cases
          filteredCases = filteredCases.filter((c) => c.status === "failed");
        } else {
          // Filter by specific failure category
          filteredCases = filteredCases.filter(
            (c) => c.failureCategory === input.failureCategory,
          );
        }
      }

      // Apply search filter
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filteredCases = filteredCases.filter(
          (c) =>
            c.patient.name.toLowerCase().includes(searchLower) ||
            (c.owner.name?.toLowerCase() ?? "").includes(searchLower) ||
            (c.owner.phone ?? "").includes(input.search!) ||
            (c.owner.email?.toLowerCase() ?? "").includes(searchLower),
        );
      }

      // Calculate pagination
      const totalFiltered = filteredCases.length;
      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize;
      const paginatedCases = filteredCases.slice(from, to);

      return {
        cases: paginatedCases,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: totalFiltered,
          totalPages: Math.ceil(totalFiltered / input.pageSize),
        },
      };
    }),
});
