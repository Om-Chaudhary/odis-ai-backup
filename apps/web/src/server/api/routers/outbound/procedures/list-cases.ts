/**
 * List Discharge Cases Procedure
 *
 * Returns paginated list of discharge cases with derived composite status.
 * Joins: cases + patients + discharge_summaries + scheduled_calls + scheduled_emails
 */

import { TRPCError } from "@trpc/server";
import {
  getClinicUserIds,
  getClinicByUserId,
  getClinicBySlug,
  getUserIdsByClinicName,
  buildClinicScopeFilter,
} from "@odis-ai/domain/clinics";
import {
  getLocalDayRange,
  DEFAULT_TIMEZONE,
} from "@odis-ai/shared/util/timezone";
import {
  deriveDischargeStatus,
  deriveDeliveryStatus,
  hasActionableAttentionTypes,
  categorizeFailure,
} from "@odis-ai/shared/util";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { listDischargeCasesInput } from "../schemas";
import type { StructuredDischargeContent } from "~/components/dashboard/outbound";

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

type ScheduledCallStructuredData = Record<string, unknown>;

// Types for new structured output data
type CallOutcomeData = {
  call_outcome?: string;
  conversation_stage_reached?: string;
  owner_available?: boolean;
  call_duration_appropriate?: boolean;
} | null;

type PetHealthData = {
  pet_recovery_status?: string;
  symptoms_reported?: string[];
  new_concerns_raised?: boolean;
  condition_resolved?: boolean;
} | null;

type MedicationComplianceData = {
  medication_discussed?: boolean;
  medication_compliance?: string;
  medication_issues?: string[];
  medication_guidance_provided?: boolean;
} | null;

type OwnerSentimentData = {
  owner_sentiment?: string;
  owner_engagement_level?: string;
  expressed_gratitude?: boolean;
  expressed_concern_about_care?: boolean;
} | null;

type EscalationData = {
  escalation_triggered?: boolean;
  escalation_type?: string;
  transfer_attempted?: boolean;
  transfer_successful?: boolean;
  escalation_reason?: string;
} | null;

type FollowUpData = {
  recheck_reminder_delivered?: boolean;
  recheck_confirmed?: boolean;
  appointment_requested?: boolean;
  follow_up_call_needed?: boolean;
  follow_up_reason?: string;
} | null;

interface ScheduledCallData {
  id: string;
  status: string;
  scheduled_for: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  ended_reason: string | null;
  transcript: string | null;
  cleaned_transcript: string | null;
  summary: string | null;
  customer_phone: string | null;
  dynamic_variables: unknown;
  metadata: ScheduledCallMetadata | null;
  structured_data: ScheduledCallStructuredData | null;
  recording_url: string | null;
  stereo_recording_url: string | null;
  attention_types: string[] | null;
  attention_severity: string | null;
  attention_flagged_at: string | null;
  attention_summary: string | null;
  // New structured output columns
  call_outcome_data: CallOutcomeData;
  pet_health_data: PetHealthData;
  medication_compliance_data: MedicationComplianceData;
  owner_sentiment_data: OwnerSentimentData;
  escalation_data: EscalationData;
  follow_up_data: FollowUpData;
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
  is_starred: boolean | null;
  patients: PatientData[];
  discharge_summaries: DischargeSummaryData[];
  scheduled_discharge_calls: ScheduledCallData[];
  scheduled_discharge_emails: ScheduledEmailData[];
  soap_notes: SoapNoteData[];
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

      // Get all user IDs in the target clinic for shared view
      // If clinicSlug is provided (admin viewing another clinic), use that clinic's users
      // Otherwise fall back to the authenticated user's clinic
      let clinicUserIds: string[];
      let clinic: Awaited<ReturnType<typeof getClinicBySlug>>;
      if (input.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
        if (clinic) {
          clinicUserIds = await getUserIdsByClinicName(
            clinic.name,
            ctx.supabase,
          );
        } else {
          // Clinic not found, fall back to user's own clinic
          clinic = await getClinicByUserId(userId, ctx.supabase);
          clinicUserIds = await getClinicUserIds(userId, ctx.supabase);
        }
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
        clinicUserIds = await getClinicUserIds(userId, ctx.supabase);
      }

      // Check if this is a needs_attention query (different query strategy)
      const isNeedsAttentionMode = input.viewMode === "needs_attention";

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
          is_starred,
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
            cleaned_transcript,
            summary,
            customer_phone,
            dynamic_variables,
            metadata,
            structured_data,
            recording_url,
            stereo_recording_url,
            attention_types,
            attention_severity,
            attention_flagged_at,
            attention_summary,
            call_outcome_data,
            pet_health_data,
            medication_compliance_data,
            owner_sentiment_data,
            escalation_data,
            follow_up_data
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
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds));

      // For needs_attention mode:
      // - Skip date filtering (show ALL needs attention cases)
      // - Filtering by needsAttention happens post-transform (see below)
      // - Sorting by severity happens post-transform (see below)
      if (isNeedsAttentionMode) {
        // Order by created_at for initial fetch, will be re-sorted by severity after transform
        query = query.order("created_at", {
          ascending: false,
          nullsFirst: false,
        });
      } else {
        // Default ordering for non-attention views
        // Order by created_at (discharge date) to show most recent discharges first
        query = query.order("created_at", {
          ascending: false,
          nullsFirst: false,
        });

        // Apply date filters with proper timezone-aware boundaries
        // Use scheduled_at (appointment/consultation time) instead of created_at (sync time)
        // This matches how the extension groups cases by appointment date
        // Falls back to created_at when scheduled_at is null (COALESCE pattern)
        if (input.startDate && input.endDate) {
          // Both dates provided - use timezone-aware range with fallback
          const startRange = getLocalDayRange(
            input.startDate,
            DEFAULT_TIMEZONE,
          );
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
          caseType: c.type as
            | "checkup"
            | "emergency"
            | "surgery"
            | "follow_up"
            | null,
          caseStatus: c.status,
          veterinarian: "Dr. Staff", // TODO: Get from user/case
          status: compositeStatus,
          failureCategory,
          phoneSent: deriveDeliveryStatus(callStatus, hasPhone),
          emailSent: deriveDeliveryStatus(emailStatus, hasEmail),
          dischargeSummary: dischargeSummary?.content ?? "",
          structuredContent: (dischargeSummary?.structured_content ??
            null) as StructuredDischargeContent | null,
          callScript:
            ((
              scheduledCall?.dynamic_variables as
                | Record<string, unknown>
                | null
                | undefined
            )?.call_script as string | undefined) ?? "",
          emailContent: scheduledEmail?.html_content ?? "",
          scheduledCall: scheduledCall
            ? {
                id: scheduledCall.id,
                userId: c.user_id,
                caseId: c.id,
                vapiCallId: null, // Not included in current query
                customerPhone: scheduledCall.customer_phone,
                scheduledFor: scheduledCall.scheduled_for,
                status: scheduledCall.status as
                  | "queued"
                  | "ringing"
                  | "in_progress"
                  | "completed"
                  | "failed"
                  | "cancelled",
                startedAt: scheduledCall.started_at,
                endedAt: scheduledCall.ended_at,
                durationSeconds: scheduledCall.duration_seconds,
                recordingUrl: scheduledCall.recording_url,
                transcript: scheduledCall.transcript,
                cleanedTranscript: scheduledCall.cleaned_transcript,
                summary: scheduledCall.summary,
                successEvaluation: null, // Not included in current query
                userSentiment: null, // Not included in current query
                reviewCategory: "to_review" as const, // Default value
                endedReason: scheduledCall.ended_reason,
                cost: null, // Not included in current query
                dynamicVariables:
                  (scheduledCall.dynamic_variables as Record<
                    string,
                    unknown
                  >) ?? {},
                metadata:
                  (scheduledCall.metadata as {
                    retry_count?: number;
                    max_retries?: number;
                    timezone?: string;
                    notes?: string;
                  }) ?? {},
                createdAt: c.created_at, // Use case created_at as proxy
                updatedAt: c.created_at, // Use case created_at as proxy
              }
            : null,
          isUrgentCase: scheduledCall?.attention_severity === "critical",
          scheduledEmail: scheduledEmail
            ? {
                id: scheduledEmail.id,
                userId: c.user_id,
                caseId: c.id,
                recipientEmail: scheduledEmail.recipient_email,
                recipientName: null, // Not included in current query
                subject: scheduledEmail.subject,
                htmlContent: scheduledEmail.html_content,
                textContent: null, // Not included in current query
                scheduledFor: scheduledEmail.scheduled_for,
                status: scheduledEmail.status as
                  | "queued"
                  | "sent"
                  | "failed"
                  | "cancelled",
                sentAt: scheduledEmail.sent_at,
                resendEmailId: null, // Not included in current query
                metadata: {},
                createdAt: c.created_at, // Use case created_at as proxy
                updatedAt: c.created_at, // Use case created_at as proxy
              }
            : null,
          timestamp: c.created_at, // Use discharge date (when case was created/synced)
          createdAt: c.created_at,
          updatedAt: c.created_at, // Use created_at as updatedAt for now
          extremeCaseCheck: c.extreme_case_check as
            | {
                isBlocked: boolean;
                reason: string;
                confidence: number;
                checkedAt: string;
                category: string;
              }
            | undefined,
          idexxNotes,
          soapNotes,
          scheduledEmailFor: emailScheduledFor,
          scheduledCallFor: callScheduledFor,
          isTestCall,
          isStarred: c.is_starred ?? false,
          // Attention fields
          attentionTypes: scheduledCall?.attention_types ?? null,
          attentionSeverity: scheduledCall?.attention_severity ?? null,
          attentionFlaggedAt: scheduledCall?.attention_flagged_at ?? null,
          attentionSummary: scheduledCall?.attention_summary ?? null,
          needsAttention: hasActionableAttentionTypes(
            scheduledCall?.attention_types ?? null,
          ),
          // New structured output intelligence fields
          callOutcomeData: scheduledCall?.call_outcome_data ?? null,
          petHealthData: scheduledCall?.pet_health_data ?? null,
          medicationComplianceData:
            scheduledCall?.medication_compliance_data ?? null,
          ownerSentimentData: scheduledCall?.owner_sentiment_data ?? null,
          escalationData: scheduledCall?.escalation_data ?? null,
          followUpData: scheduledCall?.follow_up_data ?? null,
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

      // Apply view mode filter for needs_attention (post-fetch filtering for edge cases)
      // Note: For needs_attention, server-side filtering is primary, this is a safety check
      if (input.viewMode === "needs_attention") {
        // Filter to ensure only cases with attention_types are included
        filteredCases = filteredCases.filter((c) => c.needsAttention);

        // Sort by severity: critical > urgent > routine
        const severityOrder: Record<string, number> = {
          critical: 0,
          urgent: 1,
          routine: 2,
        };
        filteredCases = [...filteredCases].sort((a, b) => {
          const aOrder = severityOrder[a.attentionSeverity ?? ""] ?? 3;
          const bOrder = severityOrder[b.attentionSeverity ?? ""] ?? 3;
          return aOrder - bOrder;
        });
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
