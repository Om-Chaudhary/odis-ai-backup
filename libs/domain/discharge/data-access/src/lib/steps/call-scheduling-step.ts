/**
 * Call Scheduling Step
 *
 * Handles call scheduling for discharge workflows via VAPI.
 */

import type { StepResult } from "@odis-ai/shared/types/orchestration";
import { getClinicByUserId } from "@odis-ai/domain/clinics/utils";

import type { StepContext } from "./types";
import { CallExecutor } from "../call-executor";
import { getCaseIdFromResults } from "../discharge-helpers";

interface CallScheduleOptions {
  scheduledFor?: Date;
  phoneNumber?: string;
}

/**
 * Execute call scheduling step
 */
export async function executeCallScheduling(
  ctx: StepContext,
  startTime: number,
): Promise<StepResult> {
  const stepConfig = ctx.plan.getStepConfig("scheduleCall");
  if (!stepConfig?.enabled) {
    return { step: "scheduleCall", status: "skipped", duration: 0 };
  }

  const caseId = getCaseIdFromResults(ctx.results, ctx.request.input);
  if (!caseId) {
    throw new Error("Case ID required for call scheduling");
  }

  const options =
    typeof stepConfig.options === "object" && stepConfig.options !== null
      ? (stepConfig.options as CallScheduleOptions)
      : {};

  const summaryResult = ctx.results.get("generateSummary");
  const summaryContent =
    summaryResult?.data && typeof summaryResult.data === "object"
      ? (summaryResult.data as { content?: string }).content
      : undefined;

  const { data: userSettings } = await ctx.supabase
    .from("users")
    .select(
      "clinic_name, clinic_phone, first_name, test_mode_enabled, test_contact_phone",
    )
    .eq("id", ctx.user.id)
    .single();

  const clinic = await getClinicByUserId(ctx.user.id, ctx.supabase);
  const clinicName = clinic?.name ?? userSettings?.clinic_name ?? "Your Clinic";
  const clinicPhone = clinic?.phone ?? userSettings?.clinic_phone ?? "";
  const agentName = userSettings?.first_name ?? "Sarah";

  const testModeEnabled = userSettings?.test_mode_enabled ?? false;
  if (testModeEnabled && !userSettings?.test_contact_phone) {
    throw new Error(
      "Test mode is enabled but test contact phone is not configured",
    );
  }

  const serverNow = new Date();
  let scheduledAt: Date | undefined;

  if (options.scheduledFor) {
    if (options.scheduledFor <= serverNow) {
      throw new Error(`Scheduled time must be in the future`);
    }
    scheduledAt = options.scheduledFor;
  }

  const scheduledCall = await ctx.casesService.scheduleDischargeCall(
    ctx.supabase,
    ctx.user.id,
    caseId,
    {
      scheduledAt,
      summaryContent,
      clinicName,
      clinicPhone,
      emergencyPhone: clinicPhone,
      agentName,
    },
    CallExecutor,
  );

  return {
    step: "scheduleCall",
    status: "completed",
    duration: Date.now() - startTime,
    data: {
      callId: scheduledCall.id,
      scheduledFor: scheduledCall.scheduled_for,
    },
  };
}
