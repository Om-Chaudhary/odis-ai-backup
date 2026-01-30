import { z } from "zod";

/**
 * Onboarding form validation schema
 *
 * Validates credentials for IDEXX Neo and Weave integrations
 * collected during the user onboarding flow.
 */
export const onboardingSchema = z.object({
  idexxUsername: z
    .string()
    .min(1, "IDEXX username is required")
    .max(255, "IDEXX username must be less than 255 characters"),
  idexxPassword: z
    .string()
    .min(1, "IDEXX password is required")
    .max(500, "IDEXX password must be less than 500 characters"),
  idexxCompanyId: z
    .string()
    .min(1, "IDEXX company ID is required")
    .max(255, "IDEXX company ID must be less than 255 characters"),
  weaveUsername: z
    .string()
    .min(1, "Weave username is required")
    .max(255, "Weave username must be less than 255 characters"),
  weavePassword: z
    .string()
    .min(1, "Weave password is required")
    .max(500, "Weave password must be less than 500 characters"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
