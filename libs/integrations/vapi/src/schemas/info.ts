/**
 * Information-related Tool Schemas
 *
 * Schemas for clinic information queries.
 */

import { z } from "zod";

/* ========================================
   Enums
   ======================================== */

/**
 * Clinic info category
 */
export const ClinicInfoCategoryEnum = z.enum([
  "hours",
  "location",
  "services",
  "payment",
  "new_patients",
  "all",
]);
export type ClinicInfoCategory = z.infer<typeof ClinicInfoCategoryEnum>;

/* ========================================
   Get Clinic Info
   ======================================== */

/**
 * Schema: get_clinic_info
 *
 * Get detailed clinic information by category.
 * Used by Info Agent to provide clinic information.
 */
export const GetClinicInfoSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),

  // Info category
  category: ClinicInfoCategoryEnum,
});

export type GetClinicInfoInput = z.infer<typeof GetClinicInfoSchema>;
