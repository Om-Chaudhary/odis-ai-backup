import { z } from "zod";

export const getActiveSyncsSchema = z.object({
  clinicId: z.string().uuid().optional(),
});

export const getSyncHistorySchema = z.object({
  clinicId: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const triggerSyncSchema = z.object({
  clinicId: z.string().uuid(),
  type: z.enum(["cases", "enrich", "reconciliation"]),
});

export const triggerFullSyncSchema = z.object({
  clinicId: z.string().uuid(),
  lookbackDays: z.number().int().min(1).max(60).default(14),
  forwardDays: z.number().int().min(1).max(60).default(14),
});

export const triggerScheduleSlotsSchema = z.object({
  clinicId: z.string().uuid(),
  /** Start date for slot generation (default: today) */
  startDate: z.string().optional(),
  /** Number of days ahead to generate (default: 30) */
  daysAhead: z.number().int().min(1).max(90).default(30),
  /** Slot duration in minutes (default: 15) */
  slotDurationMinutes: z.number().int().min(5).max(60).default(15),
  /** Default capacity per slot (default: 2) */
  defaultCapacity: z.number().int().min(1).max(10).default(2),
});

export const triggerAppointmentSyncSchema = z.object({
  clinicId: z.string().uuid(),
  /** Start date for appointment sync (default: today) */
  startDate: z.string().optional(),
  /** Number of days ahead to sync (default: 7) */
  daysAhead: z.number().int().min(1).max(30).default(7),
});

export const getSyncSchedulesSchema = z.object({
  clinicId: z.string().uuid().optional(),
});

export const getClinicSyncConfigSchema = z.object({
  clinicId: z.string().uuid(),
});

export const getIdexxCredentialStatusSchema = z.object({
  clinicId: z.string().uuid(),
});

export const cancelSyncSchema = z.object({
  syncId: z.string().uuid(),
});

// Individual sync schedule item
export const syncScheduleItemSchema = z.object({
  type: z.enum(["cases", "enrich", "reconciliation"]),
  cron: z.string().min(9).max(100), // Cron expression (e.g., "0 9 * * *")
  enabled: z.boolean(),
});

export const updateSyncScheduleSchema = z.object({
  clinicId: z.string().uuid(),
  schedules: z.array(syncScheduleItemSchema),
});

// Types for client usage
export type SyncScheduleItem = z.infer<typeof syncScheduleItemSchema>;
export type TriggerSyncType = z.infer<typeof triggerSyncSchema>["type"];
export type TriggerFullSyncInput = z.infer<typeof triggerFullSyncSchema>;
export type TriggerScheduleSlotsInput = z.infer<
  typeof triggerScheduleSlotsSchema
>;
export type TriggerAppointmentSyncInput = z.infer<
  typeof triggerAppointmentSyncSchema
>;
