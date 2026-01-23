/**
 * Get Discharge Case by ID
 *
 * Returns a single discharge case by ID with all related data.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { deriveDeliveryStatus } from "@odis-ai/shared/util";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const getCaseByIdInput = z.object({
  id: z.string().uuid(),
});

interface PatientData {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;
}

// Types for structured output data
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
  duration_seconds: number | null;
  ended_reason: string | null;
  transcript: string | null;
  cleaned_transcript: string | null;
  summary: string | null;
  recording_url: string | null;
  attention_types: string[] | null;
  attention_severity: string | null;
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
}

interface CaseRow {
  id: string;
  type: string | null;
  status: string | null;
  created_at: string;
  scheduled_at: string | null;
  patients: PatientData[];
  scheduled_discharge_calls: ScheduledCallData[];
  scheduled_discharge_emails: ScheduledEmailData[];
}

export const getCaseByIdRouter = createTRPCRouter({
  getCaseById: protectedProcedure
    .input(getCaseByIdInput)
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;

      const { data, error } = await supabase
        .from("cases")
        .select(
          `
          id,
          type,
          status,
          created_at,
          scheduled_at,
          patients!inner (
            id,
            name,
            species,
            breed,
            owner_name,
            owner_phone,
            owner_email
          ),
          scheduled_discharge_calls (
            id,
            status,
            scheduled_for,
            duration_seconds,
            ended_reason,
            transcript,
            cleaned_transcript,
            summary,
            recording_url,
            attention_types,
            attention_severity,
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
            sent_at
          )
        `,
        )
        .eq("id", input.id)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
        });
      }

      const caseData = data as unknown as CaseRow;
      const patient = caseData.patients[0];
      const call = caseData.scheduled_discharge_calls?.[0] ?? null;
      const email = caseData.scheduled_discharge_emails?.[0] ?? null;

      // Derive statuses
      const callStatus = call?.status ?? null;
      const emailStatus = email?.status ?? null;

      const phoneSent = deriveDeliveryStatus(callStatus, !!patient?.owner_phone);
      const emailSent = deriveDeliveryStatus(emailStatus, !!patient?.owner_email);

      // Derive composite status
      let status = "pending_review";
      if (callStatus === "failed" || emailStatus === "failed") {
        status = "failed";
      } else if (
        (callStatus === "completed" || callStatus === null) &&
        (emailStatus === "sent" || emailStatus === null) &&
        (callStatus === "completed" || emailStatus === "sent")
      ) {
        status = "completed";
      } else if (callStatus === "ringing" || callStatus === "in_progress") {
        status = "in_progress";
      } else if (callStatus === "queued" || emailStatus === "queued") {
        status = "scheduled";
      }

      return {
        caseId: caseData.id,
        status,
        caseType: caseData.type,
        timestamp: caseData.created_at,
        phoneSent,
        emailSent,
        scheduledTime: call?.scheduled_for ?? email?.scheduled_for ?? null,
        patient: {
          name: patient?.name ?? "Unknown",
          ownerName: patient?.owner_name ?? "Unknown",
          phone: patient?.owner_phone ?? null,
          email: patient?.owner_email ?? null,
        },
        scheduledCall: call
          ? {
              id: call.id,
              durationSeconds: call.duration_seconds,
              transcript: call.transcript,
              cleanedTranscript: call.cleaned_transcript,
              recordingUrl: call.recording_url,
              summary: call.summary,
              endedReason: call.ended_reason,
            }
          : null,
        needsAttention: !!(
          call?.attention_types && call.attention_types.length > 0
        ),
        attentionTypes: call?.attention_types ?? [],
        attentionSeverity: call?.attention_severity ?? null,
        attentionSummary: call?.attention_summary ?? null,
        sentimentScore: null,
        appointment: {
          type: caseData.type ?? "Checkup",
          endedAt: caseData.created_at,
        },
        // New structured output intelligence fields
        callOutcomeData: call?.call_outcome_data ?? null,
        petHealthData: call?.pet_health_data ?? null,
        medicationComplianceData: call?.medication_compliance_data ?? null,
        ownerSentimentData: call?.owner_sentiment_data ?? null,
        escalationData: call?.escalation_data ?? null,
        followUpData: call?.follow_up_data ?? null,
      };
    }),
});
