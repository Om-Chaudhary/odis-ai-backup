/**
 * @odis-ai/domain/auto-scheduling
 *
 * Automated discharge scheduling system.
 *
 * ## Overview
 *
 * This library provides automated scheduling of discharge emails and calls
 * for cases ingested through IDEXX sync. It runs daily (via cron) to:
 *
 * 1. Find eligible cases (completed, with contact info, not extreme cases)
 * 2. Schedule emails (default: 1 day after ingestion)
 * 3. Schedule calls (default: 3 days after ingestion)
 *
 * ## Usage
 *
 * ### Run Auto-Scheduler (Cron)
 * ```typescript
 * import { runForAllClinics } from '@odis-ai/domain/auto-scheduling';
 *
 * // Run for all enabled clinics
 * const result = await runForAllClinics(supabase);
 *
 * // Dry run (no actual scheduling)
 * const dryResult = await runForAllClinics(supabase, { dryRun: true });
 * ```
 *
 * ### Manual Trigger for Single Clinic
 * ```typescript
 * import { runForClinic } from '@odis-ai/domain/auto-scheduling';
 *
 * const result = await runForClinic(supabase, clinicId);
 * ```
 *
 * ### Manage Config
 * ```typescript
 * import { getConfig, updateConfig, toggleEnabled } from '@odis-ai/domain/auto-scheduling';
 *
 * // Get config
 * const config = await getConfig(supabase, clinicId);
 *
 * // Update settings
 * await updateConfig(supabase, clinicId, {
 *   emailDelayDays: 2,
 *   callDelayDays: 4,
 * });
 *
 * // Enable/disable
 * await toggleEnabled(supabase, clinicId, true);
 * ```
 *
 * ### Cancel Auto-Scheduled Item
 * ```typescript
 * import { cancelAutoScheduledItem } from '@odis-ai/domain/auto-scheduling';
 *
 * await cancelAutoScheduledItem(supabase, {
 *   itemId: 'item-uuid',
 *   userId: 'user-uuid',
 *   reason: 'Client requested cancellation',
 * });
 * ```
 */

// Main scheduler functions
export {
  runForAllClinics,
  runForClinic,
  cancelAutoScheduledItem,
  getRecentRuns,
  getScheduledItems,
  updateAutoScheduledItemStatus,
} from "./lib/auto-scheduler";

// Config service
export {
  getConfig,
  getOrCreateConfig,
  updateConfig,
  toggleEnabled,
  getEnabledClinics,
  getAllConfigs,
} from "./lib/config-service";

// Eligibility checker
export {
  checkCaseEligibility,
  checkExistingSchedules,
  hasActiveAutoScheduledItem,
  getEligibleCases,
} from "./lib/eligibility-checker";

// Types
export type {
  AutoSchedulingConfig,
  AutoSchedulingConfigInput,
  AutoSchedulingRunResult,
  AutoSchedulerRunOptions,
  CancelItemOptions,
  ClinicRunResult,
  RunError,
  SkippedCase,
  ScheduledConfigSnapshot,
  AutoScheduledItem,
  ScheduledItemStatus,
  EligibilityResult,
  CaseForEligibility,
  SchedulingCriteria,
} from "./types";
