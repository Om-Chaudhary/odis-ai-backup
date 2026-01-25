/**
 * Auto-Scheduling Router Schemas
 */

import { z } from "zod";

/**
 * Scheduling criteria schema
 */
export const schedulingCriteriaSchema = z.object({
  excludeCaseTypes: z.array(z.string()).optional(),
  includeCaseStatuses: z.array(z.string()).optional(),
  minCaseAgeHours: z.number().min(0).max(168).optional(),
  maxCaseAgeDays: z.number().min(1).max(14).optional(),
  requireContactInfo: z.boolean().optional(),
  requireDischargeSummary: z.boolean().optional(),
});

/**
 * Get config schema
 */
export const getConfigSchema = z.object({
  clinicId: z.string().uuid(),
});

/**
 * Update config schema
 */
export const updateConfigSchema = z.object({
  clinicId: z.string().uuid(),
  isEnabled: z.boolean().optional(),
  autoEmailEnabled: z.boolean().optional(),
  autoCallEnabled: z.boolean().optional(),
  emailDelayDays: z.number().min(0).max(14).optional(),
  callDelayDays: z.number().min(0).max(14).optional(),
  preferredEmailTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")
    .optional(),
  preferredCallTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")
    .optional(),
  schedulingCriteria: schedulingCriteriaSchema.optional(),
});

/**
 * Toggle enabled schema
 */
export const toggleEnabledSchema = z.object({
  clinicId: z.string().uuid(),
  enabled: z.boolean(),
});

/**
 * Get recent runs schema
 */
export const getRecentRunsSchema = z.object({
  limit: z.number().min(1).max(50).default(10),
});

/**
 * Get run details schema
 */
export const getRunDetailsSchema = z.object({
  runId: z.string().uuid(),
});

/**
 * Get scheduled items schema
 */
export const getScheduledItemsSchema = z.object({
  clinicId: z.string().uuid(),
  status: z.enum(["scheduled", "cancelled", "completed", "failed"]).optional(),
  limit: z.number().min(1).max(100).default(50),
});

/**
 * Cancel item schema
 */
export const cancelItemSchema = z.object({
  itemId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

/**
 * Trigger for clinic schema
 */
export const triggerForClinicSchema = z.object({
  clinicId: z.string().uuid(),
  dryRun: z.boolean().default(false),
});

/**
 * Get eligible cases preview schema
 */
export const getEligibleCasesPreviewSchema = z.object({
  clinicId: z.string().uuid(),
  limit: z.number().min(1).max(50).default(20),
});
