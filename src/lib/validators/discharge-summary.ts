/**
 * Structured Discharge Summary Schema
 *
 * Defines the structure for AI-generated discharge summaries.
 * Designed to be:
 * - SHORT and CONCISE
 * - PET-OWNER FRIENDLY (no medical jargon)
 * - ACTIONABLE (focus on what owners need to do)
 */

import { z } from "zod";

/* ========================================
   Medication Schema
   ======================================== */

export const MedicationSchema = z.object({
  name: z.string().describe("Medication name in simple terms"),
  dosage: z
    .string()
    .optional()
    .describe("How much to give (e.g., '1 tablet', '5ml')"),
  frequency: z
    .string()
    .optional()
    .describe("How often (e.g., 'twice daily', 'every 8 hours')"),
  duration: z
    .string()
    .optional()
    .describe("How long (e.g., '7 days', 'until finished')"),
  instructions: z
    .string()
    .optional()
    .describe("Special instructions (e.g., 'give with food')"),
});

export type Medication = z.infer<typeof MedicationSchema>;

/* ========================================
   Home Care Instructions Schema
   ======================================== */

export const HomeCareInstructionsSchema = z.object({
  activity: z
    .string()
    .optional()
    .describe("Activity restrictions (e.g., 'rest for 3 days')"),
  diet: z
    .string()
    .optional()
    .describe("Dietary instructions (e.g., 'soft food only')"),
  monitoring: z
    .array(z.string())
    .optional()
    .describe("What to watch for at home"),
  woundCare: z
    .string()
    .optional()
    .describe("Wound or incision care instructions"),
});

export type HomeCareInstructions = z.infer<typeof HomeCareInstructionsSchema>;

/* ========================================
   Follow-up Schema
   ======================================== */

export const FollowUpSchema = z.object({
  required: z.boolean().describe("Whether a follow-up visit is needed"),
  date: z
    .string()
    .optional()
    .describe("When to come back (e.g., 'in 2 weeks')"),
  reason: z.string().optional().describe("Why follow-up is needed"),
});

export type FollowUp = z.infer<typeof FollowUpSchema>;

/* ========================================
   Main Structured Discharge Summary Schema
   ======================================== */

export const StructuredDischargeSummarySchema = z.object({
  // Patient identification (brief)
  patientName: z.string().describe("Pet's name"),

  // Visit summary (1-2 sentences max)
  visitSummary: z
    .string()
    .describe("Brief summary of why pet was seen and what was done"),

  // Diagnosis (simple terms)
  diagnosis: z.string().optional().describe("What's wrong in simple terms"),

  // Treatments performed today (brief list)
  treatmentsToday: z
    .array(z.string())
    .optional()
    .describe("What was done during the visit"),

  // Medications to give at home
  medications: z
    .array(MedicationSchema)
    .optional()
    .describe("Medications to give at home"),

  // Home care instructions
  homeCare:
    HomeCareInstructionsSchema.optional().describe("What to do at home"),

  // Follow-up information
  followUp: FollowUpSchema.optional().describe("Next steps and follow-up"),

  // Warning signs - CRITICAL section
  warningSigns: z
    .array(z.string())
    .optional()
    .describe("When to call the vet immediately"),

  // Additional notes (optional, keep brief)
  notes: z.string().optional().describe("Any other important information"),
});

export type StructuredDischargeSummary = z.infer<
  typeof StructuredDischargeSummarySchema
>;

/* ========================================
   Helper Functions
   ======================================== */

/**
 * Validate a structured discharge summary
 */
export function validateStructuredSummary(
  data: unknown,
):
  | { success: true; data: StructuredDischargeSummary }
  | { success: false; error: z.ZodError } {
  const result = StructuredDischargeSummarySchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Convert structured summary to plain text for backward compatibility
 */
export function structuredToPlainText(
  summary: StructuredDischargeSummary,
): string {
  const sections: string[] = [];

  // Header
  sections.push(
    `DISCHARGE INSTRUCTIONS FOR ${summary.patientName.toUpperCase()}`,
  );
  sections.push("");

  // Visit Summary
  if (summary.visitSummary) {
    sections.push("VISIT SUMMARY");
    sections.push(summary.visitSummary);
    sections.push("");
  }

  // Diagnosis
  if (summary.diagnosis) {
    sections.push("DIAGNOSIS");
    sections.push(summary.diagnosis);
    sections.push("");
  }

  // Treatments Today
  if (summary.treatmentsToday && summary.treatmentsToday.length > 0) {
    sections.push("WHAT WE DID TODAY");
    summary.treatmentsToday.forEach((treatment) => {
      sections.push(`• ${treatment}`);
    });
    sections.push("");
  }

  // Medications
  if (summary.medications && summary.medications.length > 0) {
    sections.push("MEDICATIONS");
    summary.medications.forEach((med) => {
      let medLine = `• ${med.name}`;
      if (med.dosage) medLine += ` - ${med.dosage}`;
      if (med.frequency) medLine += `, ${med.frequency}`;
      if (med.duration) medLine += ` for ${med.duration}`;
      sections.push(medLine);
      if (med.instructions) {
        sections.push(`  ${med.instructions}`);
      }
    });
    sections.push("");
  }

  // Home Care
  if (summary.homeCare) {
    sections.push("HOME CARE");
    if (summary.homeCare.activity) {
      sections.push(`• Activity: ${summary.homeCare.activity}`);
    }
    if (summary.homeCare.diet) {
      sections.push(`• Diet: ${summary.homeCare.diet}`);
    }
    if (summary.homeCare.woundCare) {
      sections.push(`• Wound Care: ${summary.homeCare.woundCare}`);
    }
    if (summary.homeCare.monitoring && summary.homeCare.monitoring.length > 0) {
      sections.push("• Watch for:");
      summary.homeCare.monitoring.forEach((item) => {
        sections.push(`  - ${item}`);
      });
    }
    sections.push("");
  }

  // Follow-up
  if (summary.followUp) {
    sections.push("FOLLOW-UP");
    if (summary.followUp.required) {
      let followUpLine = "• Please schedule a follow-up";
      if (summary.followUp.date) followUpLine += ` ${summary.followUp.date}`;
      if (summary.followUp.reason)
        followUpLine += ` for ${summary.followUp.reason}`;
      sections.push(followUpLine);
    } else {
      sections.push("• No follow-up needed unless concerns arise");
    }
    sections.push("");
  }

  // Warning Signs - Important!
  if (summary.warningSigns && summary.warningSigns.length > 0) {
    sections.push("⚠️ CALL US IMMEDIATELY IF YOU NOTICE:");
    summary.warningSigns.forEach((sign) => {
      sections.push(`• ${sign}`);
    });
    sections.push("");
  }

  // Additional Notes
  if (summary.notes) {
    sections.push("ADDITIONAL NOTES");
    sections.push(summary.notes);
    sections.push("");
  }

  // Footer
  sections.push("If you have any questions, please contact our clinic.");

  return sections.join("\n");
}

/**
 * Create an empty structured summary with defaults
 */
export function createEmptyStructuredSummary(
  patientName: string,
): StructuredDischargeSummary {
  return {
    patientName,
    visitSummary: "",
    diagnosis: undefined,
    treatmentsToday: [],
    medications: [],
    homeCare: undefined,
    followUp: { required: false },
    warningSigns: [],
    notes: undefined,
  };
}
