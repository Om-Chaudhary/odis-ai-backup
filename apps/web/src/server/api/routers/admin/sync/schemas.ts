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
  type: z.enum(["inbound", "cases", "reconciliation"]),
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

// Individual sync schedule item
export const syncScheduleItemSchema = z.object({
  type: z.enum(["inbound", "cases", "reconciliation"]),
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
