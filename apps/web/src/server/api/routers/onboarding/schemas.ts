/**
 * Onboarding Router Schemas
 *
 * Validation schemas for onboarding operations including clinic creation,
 * invitation acceptance, and profile completion.
 */

import { z } from "zod";

/**
 * Business hours for a single day
 */
export const businessHoursDaySchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/, "Must be in HH:MM format"),
  close: z.string().regex(/^\d{2}:\d{2}$/, "Must be in HH:MM format"),
  closed: z.boolean().default(false),
});

/**
 * Business hours for the entire week
 */
export const businessHoursSchema = z
  .object({
    monday: businessHoursDaySchema,
    tuesday: businessHoursDaySchema,
    wednesday: businessHoursDaySchema,
    thursday: businessHoursDaySchema,
    friday: businessHoursDaySchema,
    saturday: businessHoursDaySchema,
    sunday: businessHoursDaySchema,
  })
  .optional();

/**
 * PIMS (Practice Information Management System) types supported
 */
export const pimsTypeSchema = z.enum([
  "idexx_neo",
  "ezyvet",
  "shepherd",
  "provet",
  "other",
  "none",
]);

/**
 * Extended clinic creation schema
 * Used when a user creates a new clinic during onboarding
 */
export const createClinicSchema = z.object({
  name: z
    .string()
    .min(2, "Clinic name must be at least 2 characters")
    .max(100, "Clinic name must be at most 100 characters"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[+]?[\d\s()-]{10,20}$/.test(val),
      "Invalid phone number format",
    ),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  address: z.string().max(500, "Address too long").optional(),
  timezone: z.string().default("America/Los_Angeles"),
  pimsType: pimsTypeSchema.default("none"),
  businessHours: businessHoursSchema,
});

export type CreateClinicInput = z.infer<typeof createClinicSchema>;

/**
 * Profile completion schema
 * Used when user completes their profile as final onboarding step
 */
export const completeProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name too long"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name too long"),
  role: z
    .enum([
      "veterinarian",
      "vet_tech",
      "receptionist",
      "practice_manager",
      "other",
    ])
    .optional(),
  licenseNumber: z.string().max(50).optional(),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

/**
 * Invitation token validation schema
 */
export const validateInvitationTokenSchema = z.object({
  token: z.string().uuid("Invalid invitation token format"),
});

/**
 * Invitation acceptance schema
 */
export const acceptInvitationSchema = z.object({
  token: z.string().uuid("Invalid invitation token format"),
});

/**
 * Onboarding status response type
 */
export interface OnboardingStatus {
  hasClinic: boolean;
  hasProfile: boolean;
  isComplete: boolean;
  clinics: Array<{
    id: string;
    name: string;
    slug: string;
    isPrimary: boolean;
  }>;
  profile: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  pendingInvitation: {
    clinicName: string;
    clinicId: string;
    role: string;
    token: string;
  } | null;
}

/**
 * Invitation validation response type
 */
export interface InvitationInfo {
  valid: boolean;
  clinicId: string | null;
  clinicName: string | null;
  role: string | null;
  email: string | null;
  error?: string;
}
