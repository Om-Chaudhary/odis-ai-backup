/**
 * Zod Validation Schemas for Sync Routes
 *
 * Request validation for outbound (cases, enrich, full) and inbound (schedule) sync operations.
 *
 * Endpoint naming convention:
 * - /api/sync/outbound/*  - For Outbound Dashboard (Discharge Calls)
 * - /api/sync/inbound/*   - For Inbound Dashboard (VAPI Scheduling)
 * - /api/sync/reconcile   - Shared cleanup utility
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
 * Outbound cases sync request schema
 * Pulls appointments from PIMS and creates cases in Supabase
 * Used by: /api/sync/outbound/cases
 */
export const outboundCasesSchema = z
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
      message:
        "Cannot mix flat format (startDate/endDate) with nested format (dateRange)",
    },
  );

export type OutboundCasesRequest = z.infer<typeof outboundCasesSchema>;

/**
 * Outbound enrich sync request schema
 * Adds consultation data (SOAP notes, discharge summaries) and runs AI pipeline
 * Used by: /api/sync/outbound/enrich
 */
export const outboundEnrichSchema = z
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

export type OutboundEnrichRequest = z.infer<typeof outboundEnrichSchema>;

/**
 * Reconciliation request schema
 * Reconciles local cases with PIMS source of truth
 */
export const reconciliationSchema = z.object({
  lookbackDays: z.number().int().min(1).max(180).optional().default(7),
});

export type ReconciliationRequest = z.infer<typeof reconciliationSchema>;

/**
 * Outbound full sync request schema
 * Runs complete outbound workflow: cases + enrich + reconciliation
 * Used by: /api/sync/outbound/full
 */
export const outboundFullSchema = z
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

export type OutboundFullRequest = z.infer<typeof outboundFullSchema>;

/**
 * Inbound schedule sync request schema
 * Generates VAPI availability slots based on clinic business hours
 * Used by: /api/sync/inbound/schedule
 */
export const inboundScheduleSchema = z.object({
  /** Start date for slot generation (default: today) */
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
    .optional(),
  /** End date for slot generation (default: 30 days from start) */
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
    .optional(),
  /** Number of days ahead to generate (alternative to endDate, default: 30) */
  daysAhead: z.number().int().min(1).max(90).optional().default(30),
  /** Slot duration in minutes (default: 15) */
  slotDurationMinutes: z.number().int().min(5).max(60).optional().default(15),
  /** Default capacity per slot (default: 2) */
  defaultCapacity: z.number().int().min(1).max(10).optional().default(2),
});

export type InboundScheduleRequest = z.infer<typeof inboundScheduleSchema>;

/**
 * Inbound appointments sync request schema
 * Syncs appointments from IDEXX Neo to schedule_appointments table
 * and updates schedule_slots.booked_count for accurate availability
 * Used by: /api/sync/inbound/appointments
 */
export const inboundAppointmentSchema = z.object({
  /** Start date for appointment sync (default: today) */
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
    .optional(),
  /** End date for appointment sync (default: daysAhead from start) */
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
    .optional(),
  /** Number of days ahead to sync (default: 7) */
  daysAhead: z.number().int().min(1).max(30).optional().default(7),
});

export type InboundAppointmentRequest = z.infer<
  typeof inboundAppointmentSchema
>;
