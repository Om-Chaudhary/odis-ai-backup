/**
 * Auto-Scheduler Service
 *
 * Main orchestration service for automated discharge scheduling.
 * Runs daily to schedule emails and calls for eligible cases.
 */

import type { SupabaseClientType } from "@odis-ai/shared/types/supabase";
import type { Json } from "@odis-ai/shared/types";
import type { StructuredDischargeSummary } from "@odis-ai/shared/validators/discharge-summary";
import type {
  AutoSchedulingConfig,
  AutoSchedulingRunResult,
  AutoSchedulerRunOptions,
  CancelItemOptions,
  ClinicRunResult,
  ScheduledConfigSnapshot,
} from "../types";

import { getEnabledClinics, getConfig } from "./config-service";
import {
  checkCaseEligibility,
  checkExistingSchedules,
  getEligibleCases,
  hasActiveAutoScheduledItem,
} from "./eligibility-checker";

const LOG_PREFIX = "[AutoScheduler]";

/**
 * Calculate scheduled time based on config
 */
function calculateScheduledTime(
  caseCreatedAt: string,
  delayDays: number,
  preferredTime: string,
  _clinicTimezone = "America/Los_Angeles",
): Date {
  const caseDate = new Date(caseCreatedAt);
  const targetDate = new Date(caseDate);
  targetDate.setDate(targetDate.getDate() + delayDays);

  // Parse preferred time (HH:MM format)
  const [hours, minutes] = preferredTime.split(":").map(Number);

  // Create target datetime in clinic timezone
  // For now, using a simple approach - in production should use a proper timezone library
  targetDate.setHours(hours ?? 10, minutes ?? 0, 0, 0);

  // If target is in the past, schedule for next day
  const now = new Date();
  if (targetDate <= now) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  return targetDate;
}

/**
 * Get clinic info for scheduling
 */
async function getClinicInfo(
  supabase: SupabaseClientType,
  clinicId: string,
): Promise<{
  name: string;
  phone: string | null;
  timezone: string;
  email: string | null;
} | null> {
  const { data, error } = await supabase
    .from("clinics")
    .select("name, phone, timezone, email")
    .eq("id", clinicId)
    .single();

  if (error || !data) return null;

  return {
    name: data.name,
    phone: data.phone,
    timezone: data.timezone ?? "America/Los_Angeles",
    email: data.email,
  };
}

/**
 * Get case data needed for scheduling
 */
async function getCaseSchedulingData(
  supabase: SupabaseClientType,
  caseId: string,
): Promise<{
  userId: string;
  ownerEmail: string | null;
  ownerPhone: string | null;
} | null> {
  const { data, error } = await supabase
    .from("cases")
    .select(
      `
      user_id,
      entity_extraction
    `,
    )
    .eq("id", caseId)
    .single();

  if (error || !data) return null;

  const entities = data.entity_extraction as {
    patient?: { owner?: { email?: string; phone?: string } };
  } | null;

  return {
    userId: data.user_id ?? "",
    ownerEmail: entities?.patient?.owner?.email ?? null,
    ownerPhone: entities?.patient?.owner?.phone ?? null,
  };
}

/**
 * Schedule email for a case
 */
async function scheduleEmail(
  supabase: SupabaseClientType,
  caseId: string,
  userId: string,
  scheduledFor: Date,
  config: AutoSchedulingConfig,
  dryRun: boolean,
): Promise<string | null> {
  if (dryRun) {
    console.log(`${LOG_PREFIX} [DRY RUN] Would schedule email for case ${caseId} at ${scheduledFor.toISOString()}`);
    return "dry-run-email-id";
  }

  // Get case data for email generation
  // eslint-disable-next-line @nx/enforce-module-boundaries -- Dynamic import avoids build-time circular dependency
  const { getCaseWithEntities } = await import("@odis-ai/domain/cases/lib/case-crud");
  const caseInfo = await getCaseWithEntities(supabase, caseId);
  if (!caseInfo) {
    throw new Error("Case not found for email scheduling");
  }

  const ownerEmail = caseInfo.entities?.patient?.owner?.email;
  if (!ownerEmail) {
    throw new Error("No owner email for case");
  }

  // Get clinic branding
  const { data: clinic } = await supabase
    .from("clinics")
    .select("name, phone, email, primary_color, logo_url, email_header_text, email_footer_text")
    .eq("id", config.clinicId)
    .single();

  // Generate email content
  // eslint-disable-next-line @nx/enforce-module-boundaries -- Dynamic import avoids build-time circular dependency
  const { generateDischargeEmailContent } = await import("@odis-ai/domain/discharge");
  const { createClinicBranding } = await import("@odis-ai/shared/types/clinic-branding");

  const branding = createClinicBranding({
    clinicName: clinic?.name ?? "Your Clinic",
    clinicPhone: clinic?.phone ?? undefined,
    clinicEmail: clinic?.email ?? undefined,
    primaryColor: clinic?.primary_color ?? undefined,
    logoUrl: clinic?.logo_url ?? undefined,
    emailHeaderText: clinic?.email_header_text ?? undefined,
    emailFooterText: clinic?.email_footer_text ?? undefined,
  });

  // Get discharge summary
  const { data: dischargeSummary } = await supabase
    .from("discharge_summaries")
    .select("content, structured_content")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const emailContent = await generateDischargeEmailContent(
    dischargeSummary?.content ?? "",
    caseInfo.entities?.patient?.name ?? "your pet",
    caseInfo.entities?.patient?.species ?? undefined,
    caseInfo.entities?.patient?.breed ?? undefined,
    branding,
    dischargeSummary?.structured_content as StructuredDischargeSummary | null,
    caseInfo.case.created_at ?? null,
  );

  // Create scheduled email record
  const { data: scheduledEmail, error } = await supabase
    .from("scheduled_discharge_emails")
    .insert({
      user_id: userId,
      case_id: caseId,
      recipient_email: ownerEmail,
      recipient_name: caseInfo.entities?.patient?.owner?.name ?? null,
      subject: emailContent.subject,
      html_content: emailContent.html,
      text_content: emailContent.text,
      scheduled_for: scheduledFor.toISOString(),
      status: "queued",
      metadata: { auto_scheduled: true } as Json,
    })
    .select()
    .single();

  if (error || !scheduledEmail) {
    throw new Error(`Failed to create scheduled email: ${error?.message}`);
  }

  // Schedule with QStash
  const { scheduleEmailExecution } = await import("@odis-ai/integrations/qstash/client");
  const qstashMessageId = await scheduleEmailExecution(scheduledEmail.id, scheduledFor);

  // Update with QStash message ID
  await supabase
    .from("scheduled_discharge_emails")
    .update({ qstash_message_id: qstashMessageId })
    .eq("id", scheduledEmail.id);

  console.log(`${LOG_PREFIX} Scheduled email ${scheduledEmail.id} for case ${caseId} at ${scheduledFor.toISOString()}`);

  return scheduledEmail.id;
}

/**
 * Schedule call for a case
 */
async function scheduleCall(
  supabase: SupabaseClientType,
  caseId: string,
  userId: string,
  scheduledFor: Date,
  config: AutoSchedulingConfig,
  clinicInfo: { name: string; phone: string | null },
  dryRun: boolean,
): Promise<string | null> {
  if (dryRun) {
    console.log(`${LOG_PREFIX} [DRY RUN] Would schedule call for case ${caseId} at ${scheduledFor.toISOString()}`);
    return "dry-run-call-id";
  }

  // Use existing scheduling infrastructure
  // eslint-disable-next-line @nx/enforce-module-boundaries -- Dynamic import avoids build-time circular dependency
  const { scheduleDischargeCall } = await import("@odis-ai/domain/cases/lib/call-scheduling");

  const scheduledCall = await scheduleDischargeCall(supabase, userId, caseId, {
    scheduledAt: scheduledFor,
    clinicName: clinicInfo.name,
    clinicPhone: clinicInfo.phone ?? "",
    emergencyPhone: clinicInfo.phone ?? "",
  });

  console.log(`${LOG_PREFIX} Scheduled call ${scheduledCall.id} for case ${caseId} at ${scheduledFor.toISOString()}`);

  return scheduledCall.id;
}

/**
 * Process a single case
 */
async function processCase(
  supabase: SupabaseClientType,
  caseId: string,
  config: AutoSchedulingConfig,
  runId: string,
  clinicInfo: { name: string; phone: string | null; timezone: string },
  dryRun: boolean,
): Promise<{
  emailScheduled: boolean;
  callScheduled: boolean;
  emailId: string | null;
  callId: string | null;
  error: string | null;
}> {
  const result = {
    emailScheduled: false,
    callScheduled: false,
    emailId: null as string | null,
    callId: null as string | null,
    error: null as string | null,
  };

  try {
    // Get case scheduling data
    const caseData = await getCaseSchedulingData(supabase, caseId);
    if (!caseData) {
      result.error = "Failed to fetch case data";
      return result;
    }

    // Check for existing schedules
    const existing = await checkExistingSchedules(supabase, caseId);

    // Get case created_at for scheduling calculations
    const { data: caseRow } = await supabase
      .from("cases")
      .select("created_at")
      .eq("id", caseId)
      .single();

    if (!caseRow?.created_at) {
      result.error = "Case has no creation date";
      return result;
    }

    // Schedule email if enabled and no existing email
    if (config.autoEmailEnabled && !existing.hasEmail && caseData.ownerEmail) {
      const emailScheduledFor = calculateScheduledTime(
        caseRow.created_at,
        config.emailDelayDays,
        config.preferredEmailTime,
        clinicInfo.timezone,
      );

      result.emailId = await scheduleEmail(
        supabase,
        caseId,
        caseData.userId,
        emailScheduledFor,
        config,
        dryRun,
      );
      result.emailScheduled = !!result.emailId;
    }

    // Schedule call if enabled and no existing call
    if (config.autoCallEnabled && !existing.hasCall && caseData.ownerPhone) {
      const callScheduledFor = calculateScheduledTime(
        caseRow.created_at,
        config.callDelayDays,
        config.preferredCallTime,
        clinicInfo.timezone,
      );

      result.callId = await scheduleCall(
        supabase,
        caseId,
        caseData.userId,
        callScheduledFor,
        config,
        clinicInfo,
        dryRun,
      );
      result.callScheduled = !!result.callId;
    }

    // Create auto_scheduled_items record (if not dry run)
    if (!dryRun && (result.emailScheduled || result.callScheduled)) {
      const configSnapshot: ScheduledConfigSnapshot = {
        emailDelayDays: config.emailDelayDays,
        callDelayDays: config.callDelayDays,
        preferredEmailTime: config.preferredEmailTime,
        preferredCallTime: config.preferredCallTime,
      };

      await supabase.from("auto_scheduled_items").insert({
        case_id: caseId,
        clinic_id: config.clinicId,
        run_id: runId,
        scheduled_email_id: result.emailId,
        scheduled_call_id: result.callId,
        status: "scheduled",
        scheduled_config: configSnapshot as unknown as Json,
      });

      // Mark case as auto-scheduled
      await supabase
        .from("cases")
        .update({
          auto_scheduled_at: new Date().toISOString(),
          scheduling_source: "auto",
        })
        .eq("id", caseId);
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error";
    console.error(`${LOG_PREFIX} Error processing case ${caseId}:`, error);
  }

  return result;
}

/**
 * Process all cases for a clinic
 */
async function processClinic(
  supabase: SupabaseClientType,
  config: AutoSchedulingConfig,
  runId: string,
  dryRun: boolean,
): Promise<ClinicRunResult> {
  const clinicInfo = await getClinicInfo(supabase, config.clinicId);
  if (!clinicInfo) {
    return {
      clinicId: config.clinicId,
      clinicName: "Unknown",
      casesFound: 0,
      casesProcessed: 0,
      emailsScheduled: 0,
      callsScheduled: 0,
      errors: [{ message: "Clinic not found", timestamp: new Date().toISOString() }],
      skipped: [],
    };
  }

  const result: ClinicRunResult = {
    clinicId: config.clinicId,
    clinicName: clinicInfo.name,
    casesFound: 0,
    casesProcessed: 0,
    emailsScheduled: 0,
    callsScheduled: 0,
    errors: [],
    skipped: [],
  };

  try {
    // Get eligible cases
    const cases = await getEligibleCases(supabase, config.clinicId, config.schedulingCriteria);
    result.casesFound = cases.length;

    console.log(`${LOG_PREFIX} Found ${cases.length} potential cases for clinic ${clinicInfo.name}`);

    for (const caseData of cases) {
      // Check eligibility
      const eligibility = checkCaseEligibility(caseData, config.schedulingCriteria);
      if (!eligibility.isEligible) {
        result.skipped.push({
          caseId: caseData.id,
          reason: eligibility.reason ?? "Unknown reason",
        });
        continue;
      }

      // Check for existing auto-scheduled item
      if (await hasActiveAutoScheduledItem(supabase, caseData.id)) {
        result.skipped.push({
          caseId: caseData.id,
          reason: "Already has active auto-scheduled item",
        });
        continue;
      }

      // Process the case
      const processResult = await processCase(
        supabase,
        caseData.id,
        config,
        runId,
        clinicInfo,
        dryRun,
      );

      if (processResult.error) {
        result.errors.push({
          caseId: caseData.id,
          message: processResult.error,
          timestamp: new Date().toISOString(),
        });
      } else {
        result.casesProcessed++;
        if (processResult.emailScheduled) result.emailsScheduled++;
        if (processResult.callScheduled) result.callsScheduled++;
      }
    }
  } catch (error) {
    result.errors.push({
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`${LOG_PREFIX} Clinic ${clinicInfo.name} results:`, {
    casesFound: result.casesFound,
    casesProcessed: result.casesProcessed,
    emailsScheduled: result.emailsScheduled,
    callsScheduled: result.callsScheduled,
    errorsCount: result.errors.length,
    skippedCount: result.skipped.length,
  });

  return result;
}

/**
 * Run auto-scheduling for all enabled clinics
 */
export async function runForAllClinics(
  supabase: SupabaseClientType,
  options: AutoSchedulerRunOptions = {},
): Promise<AutoSchedulingRunResult> {
  const startedAt = new Date().toISOString();
  const dryRun = options.dryRun ?? false;

  console.log(`${LOG_PREFIX} Starting auto-scheduling run`, {
    dryRun,
    force: options.force,
    clinicIds: options.clinicIds,
  });

  // Create run record (unless dry run)
  let runId = "dry-run";
  if (!dryRun) {
    const { data: runRecord, error } = await supabase
      .from("auto_scheduling_runs")
      .insert({
        started_at: startedAt,
        status: "running",
        results: [] as Json,
      })
      .select()
      .single();

    if (error || !runRecord) {
      throw new Error(`Failed to create run record: ${error?.message}`);
    }
    runId = runRecord.id;
  }

  const results: ClinicRunResult[] = [];
  let totalCasesProcessed = 0;
  let totalEmailsScheduled = 0;
  let totalCallsScheduled = 0;
  let totalErrors = 0;

  try {
    // Get clinics to process
    let configs: AutoSchedulingConfig[];

    if (options.clinicIds?.length) {
      // Get specific clinics
      configs = [];
      for (const clinicId of options.clinicIds) {
        const config = await getConfig(supabase, clinicId);
        if (config) configs.push(config);
      }
    } else {
      // Get all enabled clinics
      configs = await getEnabledClinics(supabase);
    }

    console.log(`${LOG_PREFIX} Processing ${configs.length} clinics`);

    // Process each clinic
    for (const config of configs) {
      const clinicResult = await processClinic(supabase, config, runId, dryRun);
      results.push(clinicResult);

      totalCasesProcessed += clinicResult.casesProcessed;
      totalEmailsScheduled += clinicResult.emailsScheduled;
      totalCallsScheduled += clinicResult.callsScheduled;
      totalErrors += clinicResult.errors.length;
    }

    // Update run record
    if (!dryRun) {
      const status = totalErrors > 0 && totalCasesProcessed > 0 ? "partial" : totalErrors > 0 ? "failed" : "completed";

      await supabase
        .from("auto_scheduling_runs")
        .update({
          completed_at: new Date().toISOString(),
          status,
          results: results as unknown as Json,
          total_cases_processed: totalCasesProcessed,
          total_emails_scheduled: totalEmailsScheduled,
          total_calls_scheduled: totalCallsScheduled,
          total_errors: totalErrors,
        })
        .eq("id", runId);
    }

    console.log(`${LOG_PREFIX} Run completed`, {
      runId,
      totalCasesProcessed,
      totalEmailsScheduled,
      totalCallsScheduled,
      totalErrors,
    });

    return {
      id: runId,
      startedAt,
      completedAt: new Date().toISOString(),
      status: totalErrors > 0 && totalCasesProcessed > 0 ? "partial" : totalErrors > 0 ? "failed" : "completed",
      results,
      totalCasesProcessed,
      totalEmailsScheduled,
      totalCallsScheduled,
      totalErrors,
      errorMessage: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update run record with failure
    if (!dryRun) {
      await supabase
        .from("auto_scheduling_runs")
        .update({
          completed_at: new Date().toISOString(),
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", runId);
    }

    console.error(`${LOG_PREFIX} Run failed:`, error);

    return {
      id: runId,
      startedAt,
      completedAt: new Date().toISOString(),
      status: "failed",
      results,
      totalCasesProcessed,
      totalEmailsScheduled,
      totalCallsScheduled,
      totalErrors: totalErrors + 1,
      errorMessage,
    };
  }
}

/**
 * Run auto-scheduling for a single clinic
 */
export async function runForClinic(
  supabase: SupabaseClientType,
  clinicId: string,
  options: Omit<AutoSchedulerRunOptions, "clinicIds"> = {},
): Promise<AutoSchedulingRunResult> {
  return runForAllClinics(supabase, { ...options, clinicIds: [clinicId] });
}

/**
 * Cancel an auto-scheduled item
 */
export async function cancelAutoScheduledItem(
  supabase: SupabaseClientType,
  options: CancelItemOptions,
): Promise<void> {
  const { itemId, userId, reason } = options;

  // Get the item
  const { data: item, error } = await supabase
    .from("auto_scheduled_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (error || !item) {
    throw new Error("Auto-scheduled item not found");
  }

  if (item.status !== "scheduled") {
    throw new Error(`Cannot cancel item with status '${item.status}'`);
  }

  // Cancel the scheduled email if exists
  if (item.scheduled_email_id) {
    await supabase
      .from("scheduled_discharge_emails")
      .update({ status: "canceled" })
      .eq("id", item.scheduled_email_id);
  }

  // Cancel the scheduled call if exists
  if (item.scheduled_call_id) {
    await supabase
      .from("scheduled_discharge_calls")
      .update({ status: "canceled" })
      .eq("id", item.scheduled_call_id);
  }

  // Update the auto_scheduled_items record
  await supabase
    .from("auto_scheduled_items")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
      cancellation_reason: reason,
    })
    .eq("id", itemId);

  // Remove auto_scheduled_at from case
  await supabase
    .from("cases")
    .update({
      auto_scheduled_at: null,
      scheduling_source: null,
    })
    .eq("id", item.case_id);

  console.log(`${LOG_PREFIX} Cancelled auto-scheduled item ${itemId} for case ${item.case_id}`);
}

/**
 * Get recent runs
 */
export async function getRecentRuns(
  supabase: SupabaseClientType,
  limit = 10,
): Promise<AutoSchedulingRunResult[]> {
  const { data, error } = await supabase
    .from("auto_scheduling_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`${LOG_PREFIX} Error fetching recent runs:`, error);
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status as AutoSchedulingRunResult["status"],
    results: (row.results as unknown as ClinicRunResult[]) ?? [],
    totalCasesProcessed: row.total_cases_processed ?? 0,
    totalEmailsScheduled: row.total_emails_scheduled ?? 0,
    totalCallsScheduled: row.total_calls_scheduled ?? 0,
    totalErrors: row.total_errors ?? 0,
    errorMessage: row.error_message,
  }));
}

/**
 * Get scheduled items for a clinic
 */
export async function getScheduledItems(
  supabase: SupabaseClientType,
  clinicId: string,
  status?: string,
) {
  let query = supabase
    .from("auto_scheduled_items")
    .select(
      `
      *,
      cases (id, entity_extraction, created_at)
    `,
    )
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`${LOG_PREFIX} Error fetching scheduled items:`, error);
    throw error;
  }

  return data ?? [];
}

/**
 * Update auto-scheduled item status when a scheduled call/email completes or fails
 *
 * This is called by the call/email executors to track the outcome of auto-scheduled items.
 */
export async function updateAutoScheduledItemStatus(
  supabase: SupabaseClientType,
  options: {
    scheduledCallId?: string;
    scheduledEmailId?: string;
    status: "completed" | "failed";
  },
): Promise<boolean> {
  const { scheduledCallId, scheduledEmailId, status } = options;

  if (!scheduledCallId && !scheduledEmailId) {
    console.warn(
      `${LOG_PREFIX} updateAutoScheduledItemStatus called without scheduledCallId or scheduledEmailId`,
    );
    return false;
  }

  // Build the query to find the auto_scheduled_item
  let query = supabase
    .from("auto_scheduled_items")
    .select("id, status")
    .eq("status", "scheduled"); // Only update items that are still scheduled

  if (scheduledCallId) {
    query = query.eq("scheduled_call_id", scheduledCallId);
  } else if (scheduledEmailId) {
    query = query.eq("scheduled_email_id", scheduledEmailId);
  }

  const { data: items, error: findError } = await query.limit(1);

  if (findError) {
    console.error(
      `${LOG_PREFIX} Error finding auto-scheduled item:`,
      findError,
    );
    return false;
  }

  const item = items?.[0];
  if (!item) {
    // No auto-scheduled item found - this is normal for manually scheduled items
    console.log(
      `${LOG_PREFIX} No auto-scheduled item found for`,
      scheduledCallId ? `call ${scheduledCallId}` : `email ${scheduledEmailId}`,
    );
    return false;
  }

  // For calls/emails, we only mark as completed if BOTH succeed (if both exist)
  // For now, we'll update the item status when either completes
  // A more sophisticated approach would check if both call and email are done

  const { error: updateError } = await supabase
    .from("auto_scheduled_items")
    .update({
      status,
      ...(status === "failed" && {
        cancelled_at: new Date().toISOString(),
        cancellation_reason: "Execution failed",
      }),
    })
    .eq("id", item.id);

  if (updateError) {
    console.error(
      `${LOG_PREFIX} Error updating auto-scheduled item status:`,
      updateError,
    );
    return false;
  }

  console.log(
    `${LOG_PREFIX} Updated auto-scheduled item ${item.id} status to ${status}`,
  );
  return true;
}
