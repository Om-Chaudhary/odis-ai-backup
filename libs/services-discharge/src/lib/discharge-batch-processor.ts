/**
 * Discharge Batch Processor Service
 *
 * Handles batch processing of discharge emails and calls for multiple cases.
 * Processes cases in chunks for performance and supports cancellation.
 */

// Note: DischargeOrchestrator is dynamically imported to avoid bundling
// @react-email/components during Next.js static page generation.
import type { SupabaseClientType } from "@odis-ai/types/supabase";
import type { User } from "@supabase/supabase-js";
import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

/**
 * Dynamically import the DischargeOrchestrator to avoid bundling
 * @react-email/components during Next.js static page generation.
 * Also dynamically imports CasesService to avoid circular dependency.
 */
async function getDischargeOrchestrator() {
  const { DischargeOrchestrator } = await import("./discharge-orchestrator");
  // Dynamic import to avoid circular dependency between services-discharge and services-cases
  // eslint-disable-next-line @nx/enforce-module-boundaries
  const { CasesService } = await import("@odis-ai/services-cases");
  return { DischargeOrchestrator, CasesService };
}

export interface BatchProcessingOptions {
  batchId: string;
  emailScheduleTime: Date;
  callScheduleTime: Date;
  chunkSize?: number; // Process cases in chunks (default: 10)
}

export interface BatchProcessingResult {
  success: boolean;
  processedCount: number;
  successCount: number;
  failedCount: number;
  errors: Array<{
    caseId: string;
    patientName: string;
    error: string;
  }>;
}

export interface EligibleCase {
  id: string;
  patient_id: string;
  patient_name: string;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  has_discharge_summary: boolean;
  has_scheduled_email: boolean;
  has_scheduled_call: boolean;
}

export class DischargeBatchProcessor {
  private cancelled = false;
  private chunkSize = 10;

  constructor(
    private supabase: SupabaseClientType,
    private user: User,
  ) {}

  /**
   * Get eligible cases for batch discharge processing
   */
  async getEligibleCases(userId: string): Promise<EligibleCase[]> {
    // Query cases with discharge summaries and contact info
    const { data: cases, error } = await this.supabase
      .from("cases")
      .select(
        `
        id,
        patients!inner (
          id,
          name,
          owner_name,
          owner_email,
          owner_phone
        ),
        discharge_summaries!inner (
          id
        ),
        scheduled_discharge_emails (
          id,
          status
        ),
        scheduled_discharge_calls (
          id,
          status
        )
      `,
      )
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error || !cases) {
      console.error("[BatchProcessor] Error fetching cases:", error);
      return [];
    }

    // Filter for eligible cases
    const eligibleCases: EligibleCase[] = [];

    for (const caseData of cases) {
      // Extract patient data (handle array format from Supabase)
      const patient = Array.isArray(caseData.patients)
        ? caseData.patients[0]
        : caseData.patients;

      if (!patient) continue;

      // Check if has discharge summary
      const hasDischargeSummary = Array.isArray(caseData.discharge_summaries)
        ? caseData.discharge_summaries.length > 0
        : !!caseData.discharge_summaries;

      if (!hasDischargeSummary) continue;

      // Check if has valid contact info
      const hasEmail = !!patient.owner_email;
      const hasPhone = !!patient.owner_phone;

      if (!hasEmail && !hasPhone) continue;

      // Check if already scheduled
      const hasScheduledEmail = Array.isArray(
        caseData.scheduled_discharge_emails,
      )
        ? caseData.scheduled_discharge_emails.some(
            (e: { status: string }) =>
              e.status === "queued" || e.status === "sent",
          )
        : false;

      const hasScheduledCall = Array.isArray(caseData.scheduled_discharge_calls)
        ? caseData.scheduled_discharge_calls.some((c: { status: string }) =>
            ["queued", "ringing", "in_progress", "completed"].includes(
              c.status,
            ),
          )
        : false;

      // Only include if not already scheduled
      if (!hasScheduledEmail && !hasScheduledCall) {
        eligibleCases.push({
          id: caseData.id,
          patient_id: patient.id,
          patient_name: patient.name ?? "Unknown Patient",
          owner_name: patient.owner_name,
          owner_email: patient.owner_email,
          owner_phone: patient.owner_phone,
          has_discharge_summary: true,
          has_scheduled_email: false,
          has_scheduled_call: false,
        });
      }
    }

    return eligibleCases;
  }

  /**
   * Process a batch of discharge cases
   */
  async processBatch(
    cases: EligibleCase[],
    options: BatchProcessingOptions,
  ): Promise<BatchProcessingResult> {
    this.cancelled = false;
    this.chunkSize = options.chunkSize ?? 10;

    const errors: Array<{
      caseId: string;
      patientName: string;
      error: string;
    }> = [];
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    // Update batch status to processing
    await this.updateBatchStatus(options.batchId, "processing");

    // Process cases in chunks
    for (let i = 0; i < cases.length; i += this.chunkSize) {
      if (this.cancelled) {
        console.log("[BatchProcessor] Processing cancelled");
        break;
      }

      const chunk = cases.slice(i, i + this.chunkSize);
      const chunkResults = await Promise.allSettled(
        chunk.map((caseData, chunkIndex) => {
          const globalIndex = i + chunkIndex;

          // Calculate staggered times
          // Emails: 20 seconds per case
          // Calls: 2 minutes per case
          const emailStagger = globalIndex * 20 * 1000; // 20 seconds in ms
          const callStagger = globalIndex * 2 * 60 * 1000; // 2 minutes in ms

          const staggeredEmailTime = new Date(
            options.emailScheduleTime.getTime() + emailStagger,
          );
          const staggeredCallTime = new Date(
            options.callScheduleTime.getTime() + callStagger,
          );

          console.log(
            `[BatchProcessor] Staggering case ${globalIndex + 1}/${cases.length}`,
            {
              caseId: caseData.id,
              patientName: caseData.patient_name,
              emailStagger: `+${globalIndex * 20}s`,
              callStagger: `+${globalIndex * 2}min`,
              staggeredEmailTime: staggeredEmailTime.toISOString(),
              staggeredCallTime: staggeredCallTime.toISOString(),
            },
          );

          return this.processSingleCase(
            caseData,
            options,
            staggeredEmailTime,
            staggeredCallTime,
          );
        }),
      );

      // Process chunk results
      for (let j = 0; j < chunkResults.length; j++) {
        const result = chunkResults[j];
        const caseData = chunk[j];
        if (!result || !caseData) continue;

        processedCount++;

        if (result.status === "fulfilled" && result.value.success) {
          successCount++;
          await this.updateBatchItemStatus(
            options.batchId,
            caseData.id,
            "success",
            result.value.emailId ?? null,
            result.value.callId ?? null,
          );
        } else {
          failedCount++;
          const errorMessage =
            result.status === "rejected"
              ? ((result.reason as Error)?.message ?? String(result.reason))
              : ((result.status === "fulfilled" ? result.value?.error : null) ??
                "Unknown error");

          errors.push({
            caseId: caseData.id,
            patientName: caseData.patient_name,
            error: errorMessage,
          });

          await this.updateBatchItemStatus(
            options.batchId,
            caseData.id,
            "failed",
            null,
            null,
            errorMessage,
          );
        }

        // Update batch progress
        await this.updateBatchProgress(
          options.batchId,
          processedCount,
          successCount,
          failedCount,
        );
      }
    }

    // Update final batch status
    const finalStatus = this.cancelled
      ? "cancelled"
      : failedCount > 0
        ? "partial_success"
        : "completed";

    await this.updateBatchStatus(options.batchId, finalStatus, errors);

    return {
      success: failedCount === 0 && !this.cancelled,
      processedCount,
      successCount,
      failedCount,
      errors,
    };
  }

  /**
   * Process a single case for discharge
   */
  private async processSingleCase(
    caseData: EligibleCase,
    options: BatchProcessingOptions,
    staggeredEmailTime: Date,
    staggeredCallTime: Date,
  ): Promise<{
    success: boolean;
    error?: string;
    emailId?: string;
    callId?: string;
  }> {
    try {
      // Dynamic import to avoid bundling @react-email/components during static generation
      const { DischargeOrchestrator, CasesService } =
        await getDischargeOrchestrator();
      const orchestrator = new DischargeOrchestrator(
        this.supabase,
        this.user,
        CasesService,
      );

      // Build orchestration request
      const orchestrationSteps: Record<string, unknown> = {
        generateSummary: false, // Already has summary
        prepareEmail: false,
        scheduleEmail: false,
        scheduleCall: false,
      };

      // Schedule email if has email address
      if (caseData.owner_email) {
        orchestrationSteps.prepareEmail = true;
        orchestrationSteps.scheduleEmail = {
          recipientEmail: caseData.owner_email,
          recipientName: caseData.owner_name ?? "Pet Owner",
          scheduledFor: staggeredEmailTime,
        };
      }

      // Schedule call if has phone number
      if (caseData.owner_phone) {
        orchestrationSteps.scheduleCall = {
          phoneNumber: caseData.owner_phone,
          scheduledFor: staggeredCallTime,
        };
      }

      // Execute orchestration
      const result = await orchestrator.orchestrate({
        input: {
          existingCase: {
            caseId: caseData.id,
          },
        },
        steps: orchestrationSteps,
        options: {
          parallel: true,
          stopOnError: false,
          dryRun: false,
        },
      });

      if (result.success) {
        return {
          success: true,
          emailId: result.data.emailSchedule?.emailId,
          callId: result.data.call?.callId,
        };
      } else {
        const errorMessage =
          result.metadata.errors?.map((e) => e.error).join("; ") ??
          "Orchestration failed";

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error(
        `[BatchProcessor] Error processing case ${caseData.id}:`,
        error,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Cancel the current batch processing
   */
  cancelProcessing(): void {
    this.cancelled = true;
  }

  /**
   * Update batch status in database
   */
  private async updateBatchStatus(
    batchId: string,
    status: string,
    errors?: Array<{ caseId: string; patientName: string; error: string }>,
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "processing") {
      updateData.started_at = new Date().toISOString();
    } else if (status === "completed" || status === "partial_success") {
      updateData.completed_at = new Date().toISOString();
    } else if (status === "cancelled") {
      updateData.cancelled_at = new Date().toISOString();
    }

    if (errors && errors.length > 0) {
      updateData.error_summary = errors;
    }

    await this.supabase
      .from("discharge_batches")
      .update(updateData)
      .eq("id", batchId);
  }

  /**
   * Update batch progress counters
   */
  private async updateBatchProgress(
    batchId: string,
    processedCount: number,
    successCount: number,
    failedCount: number,
  ): Promise<void> {
    await this.supabase
      .from("discharge_batches")
      .update({
        processed_cases: processedCount,
        successful_cases: successCount,
        failed_cases: failedCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", batchId);
  }

  /**
   * Update individual batch item status
   */
  private async updateBatchItemStatus(
    batchId: string,
    caseId: string,
    status: string,
    emailId: string | null,
    callId: string | null,
    errorMessage?: string,
  ): Promise<void> {
    // First, find the batch item
    const { data: item } = await this.supabase
      .from("discharge_batch_items")
      .select("id")
      .eq("batch_id", batchId)
      .eq("case_id", caseId)
      .single();

    if (item) {
      await this.supabase
        .from("discharge_batch_items")
        .update({
          status,
          email_scheduled: !!emailId,
          call_scheduled: !!callId,
          email_id: emailId,
          call_id: callId,
          error_message: errorMessage,
          processed_at: new Date().toISOString(),
        })
        .eq("id", item.id);
    }
  }

  /**
   * Create a new batch with items
   */
  static async createBatch(
    supabase: SupabaseClientType,
    userId: string,
    cases: EligibleCase[],
    emailScheduleTime: Date,
    callScheduleTime: Date,
  ): Promise<string> {
    // Create batch record
    const { data: batch, error: batchError } = await supabase
      .from("discharge_batches")
      .insert({
        user_id: userId,
        status: "pending",
        total_cases: cases.length,
        email_schedule_time: emailScheduleTime.toISOString(),
        call_schedule_time: callScheduleTime.toISOString(),
      })
      .select("id")
      .single();

    if (batchError || !batch) {
      throw new Error(`Failed to create batch: ${batchError?.message}`);
    }

    // Create batch items
    const batchItems = cases.map((caseData) => ({
      batch_id: batch.id,
      case_id: caseData.id,
      patient_id: caseData.patient_id,
      status: "pending",
    }));

    const { error: itemsError } = await supabase
      .from("discharge_batch_items")
      .insert(batchItems);

    if (itemsError) {
      // Rollback batch creation
      await supabase.from("discharge_batches").delete().eq("id", batch.id);
      throw new Error(`Failed to create batch items: ${itemsError.message}`);
    }

    return batch.id;
  }

  /**
   * Calculate schedule times based on user preferences in Pacific timezone.
   *
   * Schedule:
   * - Email: Next day (Day 1) at specified time (default: 10 AM Pacific)
   * - Call: 2 days after the email (Day 3) at specified time (default: 4 PM Pacific)
   *
   * Times are stored as UTC in the database, so we convert from Pacific to UTC.
   */
  static calculateScheduleTimes(
    emailTimeString: string, // Format: "HH:mm" (e.g., "10:00", "14:30") in Pacific time
    callTimeString?: string, // Format: "HH:mm" (e.g., "16:00") in Pacific time - defaults to 16:00 (4 PM)
    timezone = "America/Los_Angeles",
  ): { emailScheduleTime: Date; callScheduleTime: Date } {
    const now = new Date();

    // Parse hour and minute from the email time string
    const [emailHours, emailMinutes] = emailTimeString.split(":").map(Number);

    // Email: Next day at specified time (Day 1)
    const emailTargetDate = addDays(now, 1);
    const emailYear = emailTargetDate.getFullYear();
    const emailMonth = String(emailTargetDate.getMonth() + 1).padStart(2, "0");
    const emailDay = String(emailTargetDate.getDate()).padStart(2, "0");
    const emailHour = String(emailHours ?? 10).padStart(2, "0");
    const emailMinute = String(emailMinutes ?? 0).padStart(2, "0");

    // Create local time string and convert to UTC
    const emailLocalString = `${emailYear}-${emailMonth}-${emailDay}T${emailHour}:${emailMinute}:00`;
    const emailScheduleTime = fromZonedTime(emailLocalString, timezone);

    // Parse call time or use default (4 PM for 4-7 PM evening window)
    const callTime = callTimeString ?? "16:00";
    const [callHours, callMinutes] = callTime.split(":").map(Number);

    // Call: 2 days after the email (Day 3) = 3 days from now at specified time
    const callTargetDate = addDays(now, 3);
    const callYear = callTargetDate.getFullYear();
    const callMonth = String(callTargetDate.getMonth() + 1).padStart(2, "0");
    const callDay = String(callTargetDate.getDate()).padStart(2, "0");
    const callHour = String(callHours ?? 16).padStart(2, "0");
    const callMinute = String(callMinutes ?? 0).padStart(2, "0");

    // Create local time string and convert to UTC
    const callLocalString = `${callYear}-${callMonth}-${callDay}T${callHour}:${callMinute}:00`;
    const callScheduleTime = fromZonedTime(callLocalString, timezone);

    console.log("[DischargeBatchProcessor] Schedule times calculated", {
      emailLocalString,
      callLocalString,
      timezone,
      emailScheduleTimeUTC: emailScheduleTime.toISOString(),
      callScheduleTimeUTC: callScheduleTime.toISOString(),
    });

    return {
      emailScheduleTime,
      callScheduleTime,
    };
  }
}
