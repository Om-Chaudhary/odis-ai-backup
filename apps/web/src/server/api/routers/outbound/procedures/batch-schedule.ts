/**
 * Batch Schedule Procedure
 *
 * Schedules multiple discharge cases at once with parallel generation and staggered timing.
 * Supports two timing modes:
 * - 'scheduled': Uses user's delay settings (email_delay_days, call_delay_days)
 * - 'immediate': Staggers emails/calls with configurable interval between cases
 *
 * Process:
 * 1. Validate all case IDs belong to the user's clinic
 * 2. Generate summaries/entities in parallel for cases that need them
 * 3. Schedule emails/calls with staggered timing in immediate mode
 * 4. Return progress for each case
 */

import { TRPCError } from "@trpc/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getClinicUserIds,
  getClinicByUserId,
  buildClinicScopeFilter,
} from "@odis-ai/domain/clinics";
import { normalizeToE164, normalizeEmail } from "@odis-ai/shared/util/phone";
import { calculateScheduleTime } from "@odis-ai/shared/util/timezone";
import { isBlockedExtremeCase } from "@odis-ai/shared/util/discharge-readiness";
import type { Json, Database } from "@odis-ai/shared/types";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { batchScheduleInput } from "../schemas";

// =============================================================================
// Types
// =============================================================================

interface BatchScheduleResult {
  caseId: string;
  success: boolean;
  error?: string;
  callScheduled?: boolean;
  emailScheduled?: boolean;
  callScheduledFor?: string;
  emailScheduledFor?: string;
  summaryGenerated?: boolean;
}

interface IdexxMetadata {
  pet_name?: string;
  species?: string;
  client_first_name?: string;
  client_last_name?: string;
  owner_name?: string;
  notes?: string;
  consultation_notes?: string;
}

interface UserSettings {
  email_delay_days: number | null;
  call_delay_days: number | null;
  preferred_email_start_time: string | null;
  preferred_call_start_time: string | null;
  test_mode_enabled: boolean | null;
  test_contact_email: string | null;
  test_contact_phone: string | null;
  test_contact_name: string | null;
  first_name: string | null;
  clinic_name: string | null;
  clinic_phone: string | null;
}

interface SchedulingConfig {
  emailDelayDays: number;
  callDelayDays: number;
  preferredEmailTime: string;
  preferredCallTime: string;
  testModeEnabled: boolean;
  testContactEmail: string | null;
  testContactPhone: string | null;
  testContactName: string | null;
  clinicName: string;
  clinicPhone: string;
  agentName: string;
}

interface StaggerState {
  emailOffset: number;
  callOffset: number;
  scheduledEmailIndex: number;
  scheduledCallIndex: number;
}

// =============================================================================
// Dynamic Imports
// =============================================================================

const getCasesService = () =>
  import("@odis-ai/domain/cases").then((m) => m.CasesService);

const getBuildEntitiesFromIdexxMetadata = () =>
  import("@odis-ai/domain/cases").then((m) => m.buildEntitiesFromIdexxMetadata);

const getGenerateStructuredDischargeSummaryWithRetry = () =>
  import("@odis-ai/integrations/ai/generate-structured-discharge").then(
    (m) => m.generateStructuredDischargeSummaryWithRetry,
  );

const getQStash = () => import("@odis-ai/integrations/qstash");

// =============================================================================
// Helper Functions
// =============================================================================

function buildSchedulingConfig(
  userSettings: UserSettings | null,
  clinic: { name?: string | null; phone?: string | null } | null,
): SchedulingConfig {
  return {
    emailDelayDays: userSettings?.email_delay_days ?? 1,
    callDelayDays: userSettings?.call_delay_days ?? 2,
    preferredEmailTime: userSettings?.preferred_email_start_time ?? "10:00",
    preferredCallTime: userSettings?.preferred_call_start_time ?? "16:00",
    testModeEnabled: userSettings?.test_mode_enabled ?? false,
    testContactEmail: userSettings?.test_contact_email ?? null,
    testContactPhone: userSettings?.test_contact_phone ?? null,
    testContactName: userSettings?.test_contact_name ?? null,
    clinicName: clinic?.name ?? userSettings?.clinic_name ?? "Your Clinic",
    clinicPhone: clinic?.phone ?? userSettings?.clinic_phone ?? "",
    agentName: userSettings?.first_name ?? "Sarah",
  };
}

function getIdexxMetadata(
  metadata: Record<string, unknown> | null,
): IdexxMetadata | null {
  if (!metadata) return null;
  const idexx = metadata.idexx as IdexxMetadata | undefined;
  return idexx ?? null;
}

function extractSoapContent(
  soapNotes: Array<{
    client_instructions?: string | null;
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
  }> | null,
  idexxMetadata: IdexxMetadata | null,
): string | null {
  // Try SOAP notes first
  if (soapNotes && soapNotes.length > 0) {
    const latestNote = soapNotes[0];
    if (latestNote?.client_instructions) {
      return latestNote.client_instructions;
    }
    if (latestNote) {
      const sections: string[] = [];
      if (latestNote.subjective)
        sections.push(`Subjective:\n${latestNote.subjective}`);
      if (latestNote.objective)
        sections.push(`Objective:\n${latestNote.objective}`);
      if (latestNote.assessment)
        sections.push(`Assessment:\n${latestNote.assessment}`);
      if (latestNote.plan) sections.push(`Plan:\n${latestNote.plan}`);
      if (sections.length > 0) return sections.join("\n\n");
    }
  }

  // Fall back to IDEXX notes
  if (idexxMetadata?.consultation_notes) {
    return idexxMetadata.consultation_notes
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (idexxMetadata?.notes) {
    return idexxMetadata.notes;
  }

  return null;
}

interface NormalizedContacts {
  phone: string | null;
  email: string | null;
  name: string | null;
}

function normalizeContacts(
  patient: {
    owner_phone?: string | null;
    owner_email?: string | null;
    owner_name?: string | null;
  } | null,
  config: SchedulingConfig,
): NormalizedContacts {
  let phone = normalizeToE164(patient?.owner_phone);
  let email = normalizeEmail(patient?.owner_email);
  let name = patient?.owner_name ?? null;

  if (config.testModeEnabled) {
    if (config.testContactPhone) {
      const normalizedTestPhone = normalizeToE164(config.testContactPhone);
      if (normalizedTestPhone) phone = normalizedTestPhone;
    }
    if (config.testContactEmail) {
      const normalizedTestEmail = normalizeEmail(config.testContactEmail);
      if (normalizedTestEmail) email = normalizedTestEmail;
    }
    if (config.testContactName) {
      name = config.testContactName;
    }
  }

  return { phone, email, name };
}

// Stagger constants
const SCHEDULED_MODE_EMAIL_STAGGER_MS = 3000; // 3 seconds to avoid Resend rate limits
const SCHEDULED_MODE_CALL_STAGGER_MS = 2 * 60 * 1000; // 2 minutes to avoid VAPI concurrency limit

interface ScheduleTimes {
  emailScheduledFor: Date | null;
  callScheduledFor: Date | null;
}

interface LatestScheduledTimes {
  latestCallTime: Date | null;
  latestEmailTime: Date | null;
}

async function getLatestScheduledTimes(
  supabase: SupabaseClient<Database>,
  clinicUserIds: string[],
  clinicId: string | null,
): Promise<LatestScheduledTimes> {
  const clinicFilter = buildClinicScopeFilter(clinicId, clinicUserIds);

  // Get latest queued call
  const { data: latestCall } = await supabase
    .from("scheduled_discharge_calls")
    .select("scheduled_for")
    .eq("status", "queued")
    .or(clinicFilter)
    .order("scheduled_for", { ascending: false })
    .limit(1)
    .single();

  // Get latest queued email
  const { data: latestEmail } = await supabase
    .from("scheduled_discharge_emails")
    .select("scheduled_for")
    .eq("status", "queued")
    .or(clinicFilter)
    .order("scheduled_for", { ascending: false })
    .limit(1)
    .single();

  return {
    latestCallTime: latestCall?.scheduled_for
      ? new Date(latestCall.scheduled_for)
      : null,
    latestEmailTime: latestEmail?.scheduled_for
      ? new Date(latestEmail.scheduled_for)
      : null,
  };
}

const VAPI_MAX_CONCURRENT_CALLS = 7;

/**
 * Finds a safe start time for scheduling calls that won't exceed VAPI's concurrent call limit.
 * Analyzes existing queued calls and finds a window where adding new calls won't cause overlaps
 * that exceed the concurrency limit.
 */
async function findSafeCallStartTime(
  supabase: SupabaseClient<Database>,
  clinicFilter: string,
  proposedStartTime: Date,
  callsToSchedule: number,
): Promise<Date> {
  // Get all queued calls for this clinic
  const { data: queuedCalls } = await supabase
    .from("scheduled_discharge_calls")
    .select("scheduled_for")
    .eq("status", "queued")
    .or(clinicFilter)
    .gte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true });

  if (!queuedCalls?.length) {
    return proposedStartTime;
  }

  // Find a window where adding our calls won't exceed the limit
  const existingTimes = queuedCalls
    .filter((c) => c.scheduled_for != null)
    .map((c) => new Date(c.scheduled_for!).getTime());
  let candidateStart = Math.max(
    proposedStartTime.getTime(),
    Date.now() + 60000,
  );

  while (true) {
    const windowEnd =
      candidateStart + callsToSchedule * SCHEDULED_MODE_CALL_STAGGER_MS;

    // Count existing calls that overlap with our proposed window
    const overlappingCalls = existingTimes.filter(
      (t) =>
        t >= candidateStart - SCHEDULED_MODE_CALL_STAGGER_MS &&
        t <= windowEnd + SCHEDULED_MODE_CALL_STAGGER_MS,
    ).length;

    if (overlappingCalls + callsToSchedule <= VAPI_MAX_CONCURRENT_CALLS) {
      break;
    }

    // Move to after the next existing call
    const nextCall = existingTimes.find((t) => t > candidateStart);
    if (nextCall) {
      candidateStart = nextCall + SCHEDULED_MODE_CALL_STAGGER_MS;
    } else {
      break;
    }
  }

  return new Date(candidateStart);
}

function calculateScheduleTimes(
  timingMode: "scheduled" | "immediate",
  canScheduleEmail: boolean,
  canSchedulePhone: boolean,
  staggerState: StaggerState,
  immediateBaseTime: Date,
  staggerMs: number,
  baseEmailTime: Date | null,
  baseCallTime: Date | null,
): ScheduleTimes {
  let emailScheduledFor: Date | null = null;
  let callScheduledFor: Date | null = null;

  if (timingMode === "immediate") {
    if (canScheduleEmail) {
      emailScheduledFor = new Date(
        immediateBaseTime.getTime() + staggerState.emailOffset,
      );
      staggerState.emailOffset += staggerMs;
    }
    if (canSchedulePhone) {
      const baseOffset = canScheduleEmail
        ? staggerState.emailOffset
        : staggerState.callOffset;
      callScheduledFor = new Date(
        immediateBaseTime.getTime() + baseOffset + staggerMs,
      );
      staggerState.callOffset = canScheduleEmail
        ? staggerState.emailOffset
        : staggerState.callOffset + staggerMs;
    }
  } else {
    // Scheduled mode: use the pre-calculated base times that respect global queue
    if (canScheduleEmail && baseEmailTime) {
      emailScheduledFor = new Date(
        baseEmailTime.getTime() +
          staggerState.scheduledEmailIndex * SCHEDULED_MODE_EMAIL_STAGGER_MS,
      );
      staggerState.scheduledEmailIndex++;
    }
    if (canSchedulePhone && baseCallTime) {
      callScheduledFor = new Date(
        baseCallTime.getTime() +
          staggerState.scheduledCallIndex * SCHEDULED_MODE_CALL_STAGGER_MS,
      );
      staggerState.scheduledCallIndex++;
    }
  }

  return { emailScheduledFor, callScheduledFor };
}

function createErrorResult(caseId: string, error: string): BatchScheduleResult {
  return { caseId, success: false, error };
}

// =============================================================================
// Router
// =============================================================================

export const batchScheduleRouter = createTRPCRouter({
  batchSchedule: protectedProcedure
    .input(batchScheduleInput)
    .mutation(async ({ ctx, input }) => {
      const userId: string = ctx.user.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID is required",
        });
      }

      const results: BatchScheduleResult[] = [];

      // Fetch user settings and clinic info
      const { data: userSettings } = await ctx.supabase
        .from("users")
        .select(
          "email_delay_days, call_delay_days, preferred_email_start_time, preferred_call_start_time, test_mode_enabled, test_contact_email, test_contact_phone, test_contact_name, first_name, clinic_name, clinic_phone",
        )
        .eq("id", userId)
        .single();

      const clinic = await getClinicByUserId(userId, ctx.supabase);
      const config = buildSchedulingConfig(userSettings, clinic);

      // Validate cases belong to clinic
      const clinicUserIds = await getClinicUserIds(userId, ctx.supabase);
      const { data: validCases, error: caseCheckError } = await ctx.supabase
        .from("cases")
        .select("id")
        .in("id", input.caseIds)
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds));

      if (caseCheckError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate cases",
        });
      }

      const validCaseIds = new Set(validCases?.map((c) => c.id) ?? []);

      // Mark invalid cases as errors
      for (const caseId of input.caseIds) {
        if (!validCaseIds.has(caseId)) {
          results.push(
            createErrorResult(caseId, "Case not found or not accessible"),
          );
        }
      }

      const caseIdsToProcess = input.caseIds.filter((id) =>
        validCaseIds.has(id),
      );

      if (caseIdsToProcess.length === 0) {
        return {
          results,
          totalProcessed: 0,
          totalSuccess: 0,
          totalFailed: results.length,
        };
      }

      // Fetch all case data in parallel
      const CasesService = await getCasesService();
      const caseInfoResults = await Promise.allSettled(
        caseIdsToProcess.map((caseId) =>
          CasesService.getCaseWithEntities(ctx.supabase, caseId),
        ),
      );

      // Initialize timing state
      const now = new Date();
      const staggerMs = input.staggerIntervalSeconds * 1000;

      // Query existing queue to respect global staggering
      const { latestCallTime, latestEmailTime } = await getLatestScheduledTimes(
        ctx.supabase,
        clinicUserIds,
        clinic?.id ?? null,
      );

      // For scheduled mode: calculate base times and adjust if existing items are later
      let baseEmailTime: Date | null = null;
      let baseCallTime: Date | null = null;

      if (input.timingMode === "scheduled") {
        baseEmailTime = calculateScheduleTime(
          now,
          config.emailDelayDays,
          config.preferredEmailTime,
        );
        baseCallTime = calculateScheduleTime(
          now,
          config.callDelayDays,
          config.preferredCallTime,
        );

        // Start AFTER existing queued items if they're later than the base time
        if (latestEmailTime && latestEmailTime > baseEmailTime) {
          baseEmailTime = new Date(
            latestEmailTime.getTime() + SCHEDULED_MODE_EMAIL_STAGGER_MS,
          );
        }
        if (latestCallTime && latestCallTime > baseCallTime) {
          baseCallTime = new Date(
            latestCallTime.getTime() + SCHEDULED_MODE_CALL_STAGGER_MS,
          );
        }

        // Apply VAPI concurrency safety for calls
        if (input.phoneEnabled && baseCallTime) {
          const clinicFilter = buildClinicScopeFilter(
            clinic?.id,
            clinicUserIds,
          );
          const estimatedCallCount = caseIdsToProcess.length; // Conservative estimate

          baseCallTime = await findSafeCallStartTime(
            ctx.supabase,
            clinicFilter,
            baseCallTime,
            estimatedCallCount,
          );
        }
      }

      // For immediate mode: adjust base time if existing items would overlap
      let immediateBaseTime = input.scheduleBaseTime
        ? new Date(input.scheduleBaseTime)
        : now;

      if (input.timingMode === "immediate") {
        // If latest email/call is after our base time, start after it
        const latestTime =
          latestEmailTime && latestCallTime
            ? new Date(
                Math.max(latestEmailTime.getTime(), latestCallTime.getTime()),
              )
            : (latestEmailTime ?? latestCallTime);

        if (latestTime && latestTime > immediateBaseTime) {
          immediateBaseTime = new Date(latestTime.getTime() + staggerMs);
        }
      }

      const staggerState: StaggerState = {
        emailOffset: 0,
        callOffset: 0,
        scheduledEmailIndex: 0,
        scheduledCallIndex: 0,
      };

      console.log("[BatchSchedule] Starting batch scheduling", {
        totalCases: caseIdsToProcess.length,
        timingMode: input.timingMode,
        phoneEnabled: input.phoneEnabled,
        emailEnabled: input.emailEnabled,
        testModeEnabled: config.testModeEnabled,
        staggerIntervalSeconds: input.staggerIntervalSeconds,
        immediateBaseTime: immediateBaseTime.toISOString(),
        latestCallTime: latestCallTime?.toISOString() ?? null,
        latestEmailTime: latestEmailTime?.toISOString() ?? null,
        adjustedBaseEmailTime: baseEmailTime?.toISOString() ?? null,
        adjustedBaseCallTime: baseCallTime?.toISOString() ?? null,
      });

      // Process each case
      for (let i = 0; i < caseIdsToProcess.length; i++) {
        const caseId = caseIdsToProcess[i]!;
        const caseInfoResult = caseInfoResults[i];

        // Handle fetch failures
        if (!caseInfoResult || caseInfoResult.status === "rejected") {
          const errorMessage =
            caseInfoResult?.status === "rejected"
              ? (caseInfoResult.reason as Error).message
              : "Failed to fetch case data";
          results.push(createErrorResult(caseId, errorMessage));
          continue;
        }

        const caseInfo = caseInfoResult.value;
        if (!caseInfo) {
          results.push(createErrorResult(caseId, "Case not found"));
          continue;
        }

        try {
          const result = await processSingleCase({
            caseId,
            caseInfo,
            userId,
            config,
            clinic,
            input,
            staggerState,
            immediateBaseTime,
            staggerMs,
            now,
            ctx,
            CasesService,
            baseEmailTime,
            baseCallTime,
          });
          results.push(result);
        } catch (error) {
          results.push(
            createErrorResult(
              caseId,
              error instanceof Error ? error.message : "Unknown error occurred",
            ),
          );
        }
      }

      const totalSuccess = results.filter((r) => r.success).length;
      const totalFailed = results.filter((r) => !r.success).length;

      console.log("[BatchSchedule] Completed batch scheduling", {
        totalProcessed: results.length,
        totalSuccess,
        totalFailed,
      });

      return {
        results,
        totalProcessed: results.length,
        totalSuccess,
        totalFailed,
      };
    }),
});

// =============================================================================
// Single Case Processing
// =============================================================================

type CaseInfo = NonNullable<
  Awaited<
    ReturnType<
      Awaited<ReturnType<typeof getCasesService>>["getCaseWithEntities"]
    >
  >
>;

interface ProcessCaseParams {
  caseId: string;
  caseInfo: CaseInfo;
  userId: string;
  config: SchedulingConfig;
  clinic: Awaited<ReturnType<typeof getClinicByUserId>>;
  input: {
    phoneEnabled: boolean;
    emailEnabled: boolean;
    timingMode: "scheduled" | "immediate";
  };
  staggerState: StaggerState;
  immediateBaseTime: Date;
  staggerMs: number;
  now: Date;
  ctx: { supabase: Parameters<typeof getClinicByUserId>[1] };
  CasesService: Awaited<ReturnType<typeof getCasesService>>;
  baseEmailTime: Date | null;
  baseCallTime: Date | null;
}

async function processSingleCase({
  caseId,
  caseInfo,
  userId,
  config,
  clinic,
  input,
  staggerState,
  immediateBaseTime,
  staggerMs,
  ctx,
  CasesService,
  baseEmailTime,
  baseCallTime,
}: ProcessCaseParams): Promise<BatchScheduleResult> {
  // Check for blocked extreme cases
  const caseMetadata = caseInfo.case.metadata as Record<string, unknown> | null;
  const idexxMetadata = getIdexxMetadata(caseMetadata);
  const pimsConsultNotes = (caseMetadata?.pimsConsultation as Record<string, unknown>)
    ?.notes as string | undefined;
  const blockedCheck = isBlockedExtremeCase({
    caseType: caseInfo.entities?.caseType,
    dischargeSummary: caseInfo.dischargeSummaries?.[0]?.content,
    consultationNotes: idexxMetadata?.consultation_notes ?? pimsConsultNotes ?? undefined,
    metadata: caseMetadata,
  });

  if (blockedCheck.blocked) {
    console.warn("[BatchSchedule] Blocked extreme case", {
      caseId,
      reason: blockedCheck.reason,
    });
    return createErrorResult(
      caseId,
      "Discharge calls cannot be scheduled for euthanasia or deceased cases",
    );
  }

  const patient = Array.isArray(caseInfo.patient)
    ? (caseInfo.patient[0] ?? null)
    : (caseInfo.patient ?? null);

  const contacts = normalizeContacts(patient, config);
  const canSchedulePhone = input.phoneEnabled && !!contacts.phone;
  const canScheduleEmail = input.emailEnabled && !!contacts.email;

  if (!canSchedulePhone && !canScheduleEmail) {
    return createErrorResult(caseId, "No valid contact information available");
  }

  // Generate or retrieve discharge summary
  const summaryResult = await ensureDischargeSummary({
    caseInfo,
    caseId,
    userId,
    patient: patient ?? null,
    idexxMetadata,
    ctx,
  });

  if (!summaryResult.success) {
    return createErrorResult(caseId, summaryResult.error!);
  }

  const { summaryContent, summaryId, wasGenerated } = summaryResult;

  // Calculate schedule times
  const scheduleTimes = calculateScheduleTimes(
    input.timingMode,
    canScheduleEmail,
    canSchedulePhone,
    staggerState,
    immediateBaseTime,
    staggerMs,
    baseEmailTime,
    baseCallTime,
  );

  const result: BatchScheduleResult = {
    caseId,
    success: true,
    summaryGenerated: wasGenerated,
  };

  // Schedule email
  if (canScheduleEmail && scheduleTimes.emailScheduledFor) {
    const emailResult = await scheduleEmail({
      caseId,
      userId,
      summaryId: summaryId!,
      summaryContent: summaryContent!,
      patient: patient ?? null,
      contacts,
      clinic,
      config,
      scheduledFor: scheduleTimes.emailScheduledFor,
      staggerIndex:
        input.timingMode === "scheduled"
          ? staggerState.scheduledEmailIndex - 1
          : undefined,
      ctx,
    });

    if (emailResult.success) {
      result.emailScheduled = true;
      result.emailScheduledFor = emailResult.scheduledFor;
    }
  }

  // Schedule call
  if (canSchedulePhone && scheduleTimes.callScheduledFor) {
    const callResult = await scheduleCall({
      caseId,
      userId,
      caseInfo,
      summaryContent: summaryContent!,
      patient: patient ?? null,
      idexxMetadata,
      config,
      scheduledFor: scheduleTimes.callScheduledFor,
      staggerIndex:
        input.timingMode === "scheduled"
          ? staggerState.scheduledCallIndex - 1
          : undefined,
      ctx,
      CasesService,
    });

    if (callResult.success) {
      result.callScheduled = true;
      result.callScheduledFor = callResult.scheduledFor;
    }
  }

  // Verify at least one delivery was scheduled
  if (!result.emailScheduled && !result.callScheduled) {
    return createErrorResult(caseId, "Failed to schedule any delivery methods");
  }

  return result;
}

// =============================================================================
// Summary Generation
// =============================================================================

interface SummaryResult {
  success: boolean;
  error?: string;
  summaryContent?: string;
  summaryId?: string;
  wasGenerated?: boolean;
}

interface EnsureSummaryParams {
  caseInfo: CaseInfo;
  caseId: string;
  userId: string;
  patient: {
    name?: string | null;
    species?: string | null;
    breed?: string | null;
    owner_name?: string | null;
  } | null;
  idexxMetadata: IdexxMetadata | null;
  ctx: ProcessCaseParams["ctx"];
}

async function ensureDischargeSummary({
  caseInfo,
  caseId,
  userId,
  patient,
  idexxMetadata,
  ctx,
}: EnsureSummaryParams): Promise<SummaryResult> {
  const existingSummary = caseInfo.dischargeSummaries?.[0];

  if (existingSummary) {
    return {
      success: true,
      summaryContent: existingSummary.content,
      summaryId: existingSummary.id,
      wasGenerated: false,
    };
  }

  // Need to generate summary
  const soapContent = extractSoapContent(caseInfo.soapNotes, idexxMetadata);
  const entities = caseInfo.entities;

  if (!soapContent && !entities) {
    return {
      success: false,
      error:
        "No clinical notes or entity data available for summary generation",
    };
  }

  const generateStructuredDischargeSummaryWithRetry =
    await getGenerateStructuredDischargeSummaryWithRetry();

  const { structured, plainText } =
    await generateStructuredDischargeSummaryWithRetry({
      soapContent,
      entityExtraction: entities,
      patientData: {
        name: patient?.name ?? entities?.patient?.name ?? undefined,
        species: patient?.species ?? entities?.patient?.species ?? undefined,
        breed: patient?.breed ?? entities?.patient?.breed ?? undefined,
        owner_name:
          patient?.owner_name ?? entities?.patient?.owner?.name ?? undefined,
      },
    });

  const { data: newSummary, error: summaryError } = await ctx.supabase
    .from("discharge_summaries")
    .insert({
      case_id: caseId,
      user_id: userId,
      content: plainText,
      structured_content: structured as unknown as Json,
    })
    .select("id, content")
    .single();

  if (summaryError || !newSummary) {
    return {
      success: false,
      error: "Failed to save generated discharge summary",
    };
  }

  return {
    success: true,
    summaryContent: newSummary.content,
    summaryId: newSummary.id,
    wasGenerated: true,
  };
}

// =============================================================================
// Email Scheduling
// =============================================================================

interface ScheduleEmailParams {
  caseId: string;
  userId: string;
  summaryId: string;
  summaryContent: string;
  patient: {
    name?: string | null;
    species?: string | null;
    breed?: string | null;
  } | null;
  contacts: NormalizedContacts;
  clinic: Awaited<ReturnType<typeof getClinicByUserId>>;
  config: SchedulingConfig;
  scheduledFor: Date;
  staggerIndex?: number;
  ctx: ProcessCaseParams["ctx"];
}

interface ScheduleResult {
  success: boolean;
  scheduledFor?: string;
}

async function scheduleEmail({
  caseId,
  userId,
  summaryId,
  summaryContent,
  patient,
  contacts,
  clinic,
  config,
  scheduledFor,
  staggerIndex,
  ctx,
}: ScheduleEmailParams): Promise<ScheduleResult> {
  const { data: dischargeSummaryData } = await ctx.supabase
    .from("discharge_summaries")
    .select("content, structured_content")
    .eq("id", summaryId)
    .single();

  const { createClinicBranding } =
    await import("@odis-ai/shared/types/clinic-branding");
  const branding = createClinicBranding({
    clinicName: clinic?.name ?? config.clinicName ?? undefined,
    clinicPhone: clinic?.phone ?? config.clinicPhone ?? undefined,
    clinicEmail: clinic?.email ?? undefined,
    primaryColor: clinic?.primary_color ?? undefined,
    logoUrl: clinic?.logo_url ?? undefined,
    emailHeaderText: clinic?.email_header_text ?? undefined,
    emailFooterText: clinic?.email_footer_text ?? undefined,
  });

  const { generateDischargeEmailContent } =
    await import("@odis-ai/domain/discharge");
  const emailContent = await generateDischargeEmailContent(
    summaryContent,
    patient?.name ?? "your pet",
    patient?.species ?? undefined,
    patient?.breed ?? undefined,
    branding,
    dischargeSummaryData?.structured_content as never,
    null,
  );

  const { data: emailData, error: emailError } = await ctx.supabase
    .from("scheduled_discharge_emails")
    .insert({
      user_id: userId,
      case_id: caseId,
      recipient_email: contacts.email!,
      recipient_name: contacts.name,
      subject: emailContent.subject,
      html_content: emailContent.html,
      text_content: emailContent.text,
      scheduled_for: scheduledFor.toISOString(),
      status: "queued",
    })
    .select("id")
    .single();

  if (emailError || !emailData) {
    return { success: false };
  }

  try {
    const { scheduleEmailExecution } = await getQStash();
    const qstashMessageId = await scheduleEmailExecution(
      emailData.id,
      scheduledFor,
    );

    await ctx.supabase
      .from("scheduled_discharge_emails")
      .update({ qstash_message_id: qstashMessageId })
      .eq("id", emailData.id);

    console.log("[BatchSchedule] Email scheduled", {
      caseId,
      emailId: emailData.id,
      scheduledFor: scheduledFor.toISOString(),
      staggerIndex,
    });

    return { success: true, scheduledFor: scheduledFor.toISOString() };
  } catch (qstashError) {
    // Rollback email record
    await ctx.supabase
      .from("scheduled_discharge_emails")
      .delete()
      .eq("id", emailData.id);

    console.error("[BatchSchedule] Failed to schedule email via QStash:", {
      caseId,
      error:
        qstashError instanceof Error
          ? qstashError.message
          : String(qstashError),
    });

    return { success: false };
  }
}

// =============================================================================
// Call Scheduling
// =============================================================================

interface ScheduleCallParams {
  caseId: string;
  userId: string;
  caseInfo: CaseInfo;
  summaryContent: string;
  patient: { name?: string | null } | null;
  idexxMetadata: IdexxMetadata | null;
  config: SchedulingConfig;
  scheduledFor: Date;
  staggerIndex?: number;
  ctx: ProcessCaseParams["ctx"];
  CasesService: ProcessCaseParams["CasesService"];
}

async function scheduleCall({
  caseId,
  userId,
  caseInfo,
  summaryContent,
  patient,
  idexxMetadata,
  config,
  scheduledFor,
  staggerIndex,
  ctx,
  CasesService,
}: ScheduleCallParams): Promise<ScheduleResult> {
  // Ensure entities exist
  let entities = caseInfo.entities;

  if (!entities && idexxMetadata) {
    const aiEntities = await CasesService.extractEntitiesFromIdexx(
      idexxMetadata as Record<string, unknown>,
    );

    if (aiEntities) {
      entities = aiEntities;
    } else {
      const buildEntitiesFromIdexxMetadata =
        await getBuildEntitiesFromIdexxMetadata();
      entities = buildEntitiesFromIdexxMetadata(idexxMetadata, patient ?? null);
    }

    // Save entities
    await ctx.supabase
      .from("cases")
      .update({ entity_extraction: entities as unknown as Json })
      .eq("id", caseId);
  }

  try {
    const scheduledCall = await CasesService.scheduleDischargeCall(
      ctx.supabase,
      userId,
      caseId,
      {
        scheduledAt: scheduledFor,
        summaryContent,
        clinicName: config.clinicName,
        clinicPhone: config.clinicPhone,
        emergencyPhone: config.clinicPhone,
        agentName: config.agentName,
      },
    );

    console.log("[BatchSchedule] Call scheduled", {
      caseId,
      callId: scheduledCall.id,
      scheduledFor: scheduledCall.scheduled_for,
      staggerIndex,
    });

    return { success: true, scheduledFor: scheduledCall.scheduled_for };
  } catch (scheduleError) {
    console.error("[BatchSchedule] Failed to schedule call:", {
      caseId,
      error:
        scheduleError instanceof Error
          ? scheduleError.message
          : String(scheduleError),
    });

    return { success: false };
  }
}
