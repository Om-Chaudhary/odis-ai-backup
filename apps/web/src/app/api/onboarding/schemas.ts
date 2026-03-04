import { z } from "zod";

/**
 * PMS (Practice Management System) type constants
 */
export const PMS_TYPES = [
  "idexx_neo",
  "cornerstone",
  "avimark",
  "covetrus_pulse",
  "clientrax",
] as const;

export type PmsType = (typeof PMS_TYPES)[number];

export const PMS_LABELS: Record<PmsType, string> = {
  idexx_neo: "IDEXX Neo",
  cornerstone: "Cornerstone",
  avimark: "AVImark",
  covetrus_pulse: "Covetrus Pulse",
  clientrax: "ClientTrax",
};

/**
 * Phone system type constants
 */
export const PHONE_SYSTEM_TYPES = ["weave", "otto", "mitel", "other"] as const;

export type PhoneSystemType = (typeof PHONE_SYSTEM_TYPES)[number];

export const PHONE_SYSTEM_LABELS: Record<PhoneSystemType, string> = {
  weave: "Weave",
  otto: "OTTO",
  mitel: "Mitel",
  other: "Other",
};

/**
 * Onboarding form validation schema (v2)
 *
 * Supports multiple PMS and phone system types.
 * Credentials are optional (skippable) for all providers.
 */
export const onboardingSchema = z.object({
  // PMS selection
  pmsType: z.enum(PMS_TYPES),

  // IDEXX Neo credentials (only when pmsType = idexx_neo)
  idexxUsername: z.string().max(255).optional().default(""),
  idexxPassword: z.string().max(500).optional().default(""),
  idexxCompanyId: z.string().max(255).optional().default(""),

  // Generic PMS credentials (for non-IDEXX systems)
  pmsUsername: z.string().max(255).optional().default(""),
  pmsPassword: z.string().max(500).optional().default(""),

  // Phone system selection
  phoneSystemType: z.enum(PHONE_SYSTEM_TYPES),

  // Weave credentials (only when phoneSystemType = weave)
  weaveUsername: z.string().max(255).optional().default(""),
  weavePassword: z.string().max(500).optional().default(""),

  // Phone system provider info (for otto, mitel, other)
  phoneSystemProviderName: z.string().max(255).optional().default(""),
  phoneSystemContactInfo: z.string().max(500).optional().default(""),
  phoneSystemDetails: z.string().max(2000).optional().default(""),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

/**
 * Clinic preferences form validation schema
 */
export const clinicPreferencesSchema = z.object({
  clinicEmail: z.string().email().optional().or(z.literal("")),
  afterHoursGreeting: z.string().max(5000).optional().default(""),
  species: z.array(z.string()).optional().default([]),
  speciesOther: z.string().max(255).optional().default(""),
  neverScheduleTypes: z.string().max(2000).optional().default(""),
  emergencySymptoms: z.array(z.string()).optional().default([]),
  emergencySymptomsOther: z.string().max(500).optional().default(""),
  erReferralPreference: z
    .enum(["nearest", "preferred"])
    .optional()
    .default("nearest"),
  preferredErName: z.string().max(255).optional().default(""),
  schedulingInstructions: z.string().max(5000).optional().default(""),
  cancellationHandling: z
    .enum(["cancel_auto", "offer_reschedule", "notify_staff"])
    .optional()
    .default("notify_staff"),
});

export type ClinicPreferencesInput = z.infer<typeof clinicPreferencesSchema>;
