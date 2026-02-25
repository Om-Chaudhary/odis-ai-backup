/**
 * Auto-Scheduling Types
 *
 * Type definitions for the automated discharge scheduling system.
 */

import type { Database } from "@odis-ai/shared/types";

/* ========================================
   Database Row Types
   ======================================== */

export type AutoSchedulingConfigRow =
  Database["public"]["Tables"]["auto_scheduling_config"]["Row"];
export type AutoSchedulingConfigInsert =
  Database["public"]["Tables"]["auto_scheduling_config"]["Insert"];
export type AutoSchedulingConfigUpdate =
  Database["public"]["Tables"]["auto_scheduling_config"]["Update"];

export type AutoSchedulingRunRow =
  Database["public"]["Tables"]["auto_scheduling_runs"]["Row"];
export type AutoSchedulingRunInsert =
  Database["public"]["Tables"]["auto_scheduling_runs"]["Insert"];
export type AutoSchedulingRunUpdate =
  Database["public"]["Tables"]["auto_scheduling_runs"]["Update"];

export type AutoScheduledItemRow =
  Database["public"]["Tables"]["auto_scheduled_items"]["Row"];
export type AutoScheduledItemInsert =
  Database["public"]["Tables"]["auto_scheduled_items"]["Insert"];
export type AutoScheduledItemUpdate =
  Database["public"]["Tables"]["auto_scheduled_items"]["Update"];

/* ========================================
   Scheduling Criteria Types
   ======================================== */

/**
 * Criteria for excluding cases from auto-scheduling
 */
export interface SchedulingCriteria {
  /** Case types to exclude (e.g., "euthanasia", "deceased") */
  excludeCaseTypes?: string[];
  /** Case statuses to include (defaults to "completed") */
  includeCaseStatuses?: string[];
  /** Minimum case age in hours before scheduling */
  minCaseAgeHours?: number;
  /** Maximum case age in days (default 3) */
  maxCaseAgeDays?: number;
  /** Whether to require contact info */
  requireContactInfo?: boolean;
  /** Whether to require discharge summary */
  requireDischargeSummary?: boolean;
}

/* ========================================
   Config Types
   ======================================== */

/**
 * Auto-scheduling configuration for a clinic
 */
export interface AutoSchedulingConfig {
  id: string;
  clinicId: string;
  isEnabled: boolean;
  autoEmailEnabled: boolean;
  autoCallEnabled: boolean;
  emailDelayDays: number;
  callDelayDays: number;
  preferredEmailTime: string;
  preferredCallTime: string;
  schedulingCriteria: SchedulingCriteria;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for updating config
 */
export interface AutoSchedulingConfigInput {
  isEnabled?: boolean;
  autoEmailEnabled?: boolean;
  autoCallEnabled?: boolean;
  emailDelayDays?: number;
  callDelayDays?: number;
  preferredEmailTime?: string;
  preferredCallTime?: string;
  schedulingCriteria?: SchedulingCriteria;
}

/* ========================================
   Run Types
   ======================================== */

export type RunStatus = "running" | "completed" | "failed" | "partial";

/**
 * Result for a single clinic in a run
 */
export interface ClinicRunResult {
  clinicId: string;
  clinicName: string;
  casesFound: number;
  casesProcessed: number;
  emailsScheduled: number;
  callsScheduled: number;
  errors: RunError[];
  skipped: SkippedCase[];
}

/**
 * Error during a run
 */
export interface RunError {
  caseId?: string;
  message: string;
  code?: string;
  timestamp: string;
}

/**
 * Case that was skipped during processing
 */
export interface SkippedCase {
  caseId: string;
  reason: string;
}

/**
 * Full run result
 */
export interface AutoSchedulingRunResult {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: RunStatus;
  results: ClinicRunResult[];
  totalCasesProcessed: number;
  totalEmailsScheduled: number;
  totalCallsScheduled: number;
  totalErrors: number;
  errorMessage: string | null;
}

/* ========================================
   Scheduled Item Types
   ======================================== */

export type ScheduledItemStatus =
  | "scheduled"
  | "cancelled"
  | "completed"
  | "failed";

/**
 * Snapshot of config used when scheduling
 */
export interface ScheduledConfigSnapshot {
  emailDelayDays: number;
  callDelayDays: number;
  preferredEmailTime: string;
  preferredCallTime: string;
  scheduledEmailAt?: string;
  scheduledCallAt?: string;
}

/**
 * Auto-scheduled item with related data
 */
export interface AutoScheduledItem {
  id: string;
  caseId: string;
  clinicId: string;
  runId: string | null;
  scheduledEmailId: string | null;
  scheduledCallId: string | null;
  status: ScheduledItemStatus;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  scheduledConfig: ScheduledConfigSnapshot;
  createdAt: string;
}

/* ========================================
   Eligibility Types
   ======================================== */

/**
 * Case eligibility check result
 */
export interface EligibilityResult {
  isEligible: boolean;
  reason?: string;
  code?:
    | "EXTREME_CASE"
    | "NO_CONTACT_INFO"
    | "NO_DISCHARGE_SUMMARY"
    | "ALREADY_SCHEDULED"
    | "ALREADY_AUTO_SCHEDULED"
    | "CASE_TOO_OLD"
    | "CASE_TOO_NEW"
    | "INVALID_STATUS"
    | "HAS_EXISTING_CALL"
    | "HAS_EXISTING_EMAIL";
}

/**
 * Case data for eligibility checking
 */
export interface CaseForEligibility {
  id: string;
  clinicId: string | null;
  status: string | null;
  createdAt: string | null;
  autoScheduledAt: string | null;
  schedulingSource: string | null;
  extremeCaseCheck: {
    isExtremeCase?: boolean;
    category?: string;
    reason?: string;
  } | null;
  entityExtraction: {
    patient?: {
      owner?: {
        phone?: string;
        email?: string;
      };
    };
  } | null;
  hasDischargeSummary: boolean;
  /** Case metadata for deep euthanasia/deceased detection (PIMS + IDEXX) */
  metadata: Record<string, unknown> | null;
}

/* ========================================
   Service Options Types
   ======================================== */

/**
 * Options for running auto-scheduler
 */
export interface AutoSchedulerRunOptions {
  /** Force run even if outside normal schedule window */
  force?: boolean;
  /** Only process specific clinic IDs */
  clinicIds?: string[];
  /** Dry run - don't actually schedule, just report what would happen */
  dryRun?: boolean;
}

/**
 * Options for cancelling a scheduled item
 */
export interface CancelItemOptions {
  itemId: string;
  userId: string;
  reason: string;
}
