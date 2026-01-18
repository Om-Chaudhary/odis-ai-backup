import { z } from "zod";

export const listClinicsSchema = z.object({
  search: z.string().optional(),
  pimsType: z.enum(["idexx", "neo", "all"]).optional(),
  isActive: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const getClinicByIdSchema = z.object({
  clinicId: z.string().uuid(),
});

export const createClinicSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().default("America/New_York"),
  pimsType: z.enum(["idexx", "neo"]).default("idexx"),
  businessHours: z
    .record(
      z.object({
        open: z.string(),
        close: z.string(),
        enabled: z.boolean(),
      }),
    )
    .optional(),
});

export const updateClinicSchema = z.object({
  clinicId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  businessHours: z
    .record(
      z.object({
        open: z.string(),
        close: z.string(),
        enabled: z.boolean(),
      }),
    )
    .optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  logoUrl: z.string().url().optional(),
});

export const toggleClinicActiveSchema = z.object({
  clinicId: z.string().uuid(),
  isActive: z.boolean(),
});

export const getClinicUsersSchema = z.object({
  clinicId: z.string().uuid(),
});

export const getClinicStatsSchema = z.object({
  clinicId: z.string().uuid(),
  days: z.number().min(1).max(90).default(7),
});
