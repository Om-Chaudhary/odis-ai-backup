/**
 * Zod Validation Schemas for Sync Routes
 *
 * Request validation for inbound, cases, reconciliation, and full sync operations.
 */

import { z } from "zod";

/**
 * Date range schema (nested format)
 */
const dateRangeSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
});

/**
 * Inbound sync request schema
 * Syncs appointments from PIMS to database
 */
export const inboundSyncSchema = z
  .object({
    // Flat format (deprecated but supported)
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
      .optional(),
    daysAhead: z.number().int().min(1).max(90).optional().default(7),

    // Nested format (preferred)
    dateRange: dateRangeSchema.optional(),
  })
  .refine(
    (data) => {
      // Either flat format OR nested format, not both
      const hasFlatFormat = data.startDate ?? data.endDate;
      const hasNestedFormat = data.dateRange;
      return !(hasFlatFormat && hasNestedFormat);
    },
    {
      message: "Cannot mix flat format (startDate/endDate) with nested format (dateRange)",
    },
  );

export type InboundSyncRequest = z.infer<typeof inboundSyncSchema>;

/**
 * Case sync request schema
 * Enriches cases with consultation data from PIMS (past appointments only)
 */
export const caseSyncSchema = z
  .object({
    // Flat format
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
      .optional(),
    parallelBatchSize: z.number().int().min(1).max(50).optional(),

    // Nested format
    dateRange: dateRangeSchema.optional(),
  })
  .refine(
    (data) => {
      const hasFlatFormat = data.startDate ?? data.endDate;
      const hasNestedFormat = data.dateRange;
      return !(hasFlatFormat && hasNestedFormat);
    },
    {
      message: "Cannot mix flat format with nested format",
    },
  );

export type CaseSyncRequest = z.infer<typeof caseSyncSchema>;

/**
 * Reconciliation request schema
 * Reconciles local cases with PIMS source of truth
 */
export const reconciliationSchema = z.object({
  lookbackDays: z.number().int().min(1).max(180).optional().default(7),
});

export type ReconciliationRequest = z.infer<typeof reconciliationSchema>;

/**
 * Full sync request schema
 * Runs complete sync pipeline: inbound + cases + reconciliation
 */
export const fullSyncSchema = z
  .object({
    // Flat format
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
      .optional(),
    daysAhead: z.number().int().min(1).max(90).optional().default(7),
    lookbackDays: z.number().int().min(1).max(180).optional().default(7),

    // Nested format
    dateRange: dateRangeSchema.optional(),
  })
  .refine(
    (data) => {
      const hasFlatFormat = data.startDate ?? data.endDate;
      const hasNestedFormat = data.dateRange;
      return !(hasFlatFormat && hasNestedFormat);
    },
    {
      message: "Cannot mix flat format with nested format",
    },
  );

export type FullSyncRequest = z.infer<typeof fullSyncSchema>;
