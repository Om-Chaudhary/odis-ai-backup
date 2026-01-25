/**
 * Eligibility Checker
 *
 * Determines if a case is eligible for auto-scheduling based on various criteria.
 */

import type { SupabaseClientType } from "@odis-ai/shared/types/supabase";
import type {
  CaseForEligibility,
  EligibilityResult,
  SchedulingCriteria,
} from "../types";

const DEFAULT_MAX_CASE_AGE_DAYS = 3;
const DEFAULT_EXCLUDED_CASE_TYPES = ["euthanasia", "deceased", "death"];

/**
 * Check if a case is an extreme case (euthanasia, deceased, etc.)
 */
function isExtremeCase(caseData: CaseForEligibility): boolean {
  const extremeCheck = caseData.extremeCaseCheck;
  if (!extremeCheck) return false;

  if (extremeCheck.isExtremeCase) return true;

  const category = extremeCheck.category?.toLowerCase();
  return DEFAULT_EXCLUDED_CASE_TYPES.some(
    (type) => category?.includes(type) ?? false,
  );
}

/**
 * Check if case has valid contact info (phone or email)
 */
function hasValidContactInfo(caseData: CaseForEligibility): boolean {
  const patient = caseData.entityExtraction?.patient;
  const owner = patient?.owner;

  const hasPhone = !!owner?.phone && owner.phone.length >= 10;
  const hasEmail = !!owner?.email && owner.email.includes("@");

  return hasPhone || hasEmail;
}

/**
 * Check if case is within the age window for scheduling
 */
function isWithinAgeWindow(
  caseData: CaseForEligibility,
  criteria: SchedulingCriteria,
): { valid: boolean; reason?: string } {
  if (!caseData.createdAt) {
    return { valid: false, reason: "Case has no creation date" };
  }

  const caseAge = Date.now() - new Date(caseData.createdAt).getTime();
  const caseAgeHours = caseAge / (1000 * 60 * 60);
  const caseAgeDays = caseAgeHours / 24;

  const maxAgeDays = criteria.maxCaseAgeDays ?? DEFAULT_MAX_CASE_AGE_DAYS;
  if (caseAgeDays > maxAgeDays) {
    return {
      valid: false,
      reason: `Case is ${caseAgeDays.toFixed(1)} days old (max: ${maxAgeDays})`,
    };
  }

  const minAgeHours = criteria.minCaseAgeHours ?? 0;
  if (caseAgeHours < minAgeHours) {
    return {
      valid: false,
      reason: `Case is ${caseAgeHours.toFixed(1)} hours old (min: ${minAgeHours})`,
    };
  }

  return { valid: true };
}

/**
 * Check eligibility for a single case
 */
export function checkCaseEligibility(
  caseData: CaseForEligibility,
  criteria: SchedulingCriteria,
): EligibilityResult {
  // Check if already auto-scheduled
  if (caseData.autoScheduledAt) {
    return {
      isEligible: false,
      reason: "Case already auto-scheduled",
      code: "ALREADY_AUTO_SCHEDULED",
    };
  }

  // Check scheduling source
  if (caseData.schedulingSource === "manual") {
    return {
      isEligible: false,
      reason: "Case manually scheduled",
      code: "ALREADY_SCHEDULED",
    };
  }

  // Check case status
  const validStatuses = criteria.includeCaseStatuses ?? ["completed"];
  if (!caseData.status || !validStatuses.includes(caseData.status)) {
    return {
      isEligible: false,
      reason: `Case status '${caseData.status}' not in allowed statuses`,
      code: "INVALID_STATUS",
    };
  }

  // Check extreme case
  if (isExtremeCase(caseData)) {
    return {
      isEligible: false,
      reason: "Case is an extreme case (euthanasia/deceased)",
      code: "EXTREME_CASE",
    };
  }

  // Check contact info
  if (criteria.requireContactInfo !== false && !hasValidContactInfo(caseData)) {
    return {
      isEligible: false,
      reason: "Case has no valid contact info (phone/email)",
      code: "NO_CONTACT_INFO",
    };
  }

  // Check discharge summary
  if (criteria.requireDischargeSummary !== false && !caseData.hasDischargeSummary) {
    return {
      isEligible: false,
      reason: "Case has no discharge summary",
      code: "NO_DISCHARGE_SUMMARY",
    };
  }

  // Check age window
  const ageCheck = isWithinAgeWindow(caseData, criteria);
  if (!ageCheck.valid) {
    return {
      isEligible: false,
      reason: ageCheck.reason,
      code: "CASE_TOO_OLD",
    };
  }

  return { isEligible: true };
}

/**
 * Check if case has existing scheduled calls or emails
 */
export async function checkExistingSchedules(
  supabase: SupabaseClientType,
  caseId: string,
): Promise<{ hasCall: boolean; hasEmail: boolean }> {
  // Check for existing scheduled calls
  const { data: existingCalls } = await supabase
    .from("scheduled_discharge_calls")
    .select("id, status")
    .eq("case_id", caseId)
    .not("status", "in", '("failed","canceled")')
    .limit(1);

  // Check for existing scheduled emails
  const { data: existingEmails } = await supabase
    .from("scheduled_discharge_emails")
    .select("id, status")
    .eq("case_id", caseId)
    .not("status", "in", '("failed","canceled")')
    .limit(1);

  return {
    hasCall: (existingCalls?.length ?? 0) > 0,
    hasEmail: (existingEmails?.length ?? 0) > 0,
  };
}

/**
 * Check if case has an active auto-scheduled item
 */
export async function hasActiveAutoScheduledItem(
  supabase: SupabaseClientType,
  caseId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("auto_scheduled_items")
    .select("id")
    .eq("case_id", caseId)
    .eq("status", "scheduled")
    .limit(1);

  return (data?.length ?? 0) > 0;
}

/**
 * Get eligible cases for a clinic
 */
export async function getEligibleCases(
  supabase: SupabaseClientType,
  clinicId: string,
  criteria: SchedulingCriteria,
): Promise<CaseForEligibility[]> {
  const maxAgeDays = criteria.maxCaseAgeDays ?? DEFAULT_MAX_CASE_AGE_DAYS;
  const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);

  // Query cases that might be eligible
  const { data: cases, error } = await supabase
    .from("cases")
    .select(
      `
      id,
      clinic_id,
      status,
      created_at,
      auto_scheduled_at,
      scheduling_source,
      extreme_case_check,
      entity_extraction,
      discharge_summaries!left(id)
    `,
    )
    .eq("clinic_id", clinicId)
    .in("status", (criteria.includeCaseStatuses ?? ["completed"]) as ("reviewed" | "ongoing" | "completed" | "draft")[])
    .is("auto_scheduled_at", null)
    .is("scheduling_source", null)
    .gte("created_at", cutoffDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[EligibilityChecker] Error fetching cases:", error);
    throw error;
  }

  if (!cases) return [];

  // Transform to CaseForEligibility format
  return cases.map((c) => ({
    id: c.id,
    clinicId: c.clinic_id,
    status: c.status,
    createdAt: c.created_at,
    autoScheduledAt: c.auto_scheduled_at,
    schedulingSource: c.scheduling_source,
    extremeCaseCheck: c.extreme_case_check as CaseForEligibility["extremeCaseCheck"],
    entityExtraction: c.entity_extraction as CaseForEligibility["entityExtraction"],
    hasDischargeSummary: Array.isArray(c.discharge_summaries)
      ? c.discharge_summaries.length > 0
      : !!c.discharge_summaries,
  }));
}
