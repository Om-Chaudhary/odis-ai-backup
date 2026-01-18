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
  type: z.enum(["inbound", "case"]),
});

export const getSyncSchedulesSchema = z.object({
  clinicId: z.string().uuid().optional(),
});

export const updateSyncScheduleSchema = z.object({
  clinicId: z.string().uuid(),
  type: z.enum(["inbound", "case"]),
  schedule: z.string(), // Cron expression
  enabled: z.boolean(),
});
