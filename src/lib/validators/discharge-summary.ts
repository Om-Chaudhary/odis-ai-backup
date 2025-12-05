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
  // REQUIRED: Medication name (e.g., "Apoquel", "Cephalexin", "Medicated Shampoo")
  name: z.string().min(1).describe("Medication name - REQUIRED"),

  // OPTIONAL: Amount per dose - only include if explicitly stated
  // Examples: "16mg", "500mg", "1 tablet", "5ml"
  dosage: z
    .string()
    .optional()
    .describe("Amount per dose (e.g., '16mg', '1 tablet') - only if stated"),

  // OPTIONAL: How often to give - only include if explicitly stated
  // Examples: "once daily", "twice daily", "every 3 days", "every 8 hours"
  frequency: z
    .string()
    .optional()
    .describe("How often (e.g., 'once daily', 'twice daily') - only if stated"),

  // OPTIONAL: How long to give - only include if explicitly stated
  // Examples: "14 days", "10 days", "3 weeks", "until finished"
  duration: z
    .string()
    .optional()
    .describe("How long (e.g., '14 days', '3 weeks') - only if stated"),

  // OPTIONAL: Short action phrase for special instructions - only if there's a specific instruction
  // Examples: "Give with food", "Complete full course", "Leave on 10 min"
  // DO NOT include generic instructions or clinic-administered notes
  instructions: z
    .string()
    .optional()
    .describe(
      "Short instruction phrase (e.g., 'Give with food') - only if stated",
    ),
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
   Case Type Schema
   ======================================== */

export const DischargeCaseTypeSchema = z.enum([
  "surgery",
  "dental",
  "vaccination",
  "dermatology",
  "wellness",
  "emergency",
  "gastrointestinal",
  "orthopedic",
  "other",
]);

export type DischargeCaseType = z.infer<typeof DischargeCaseTypeSchema>;

/* ========================================
   Main Structured Discharge Summary Schema
   ======================================== */

export const StructuredDischargeSummarySchema = z.object({
  // Patient identification (brief)
  patientName: z.string().describe("Pet's name"),

  // Case type for curated warning fallback (optional - AI will classify)
  caseType: DischargeCaseTypeSchema.optional().describe(
    "Type of visit for appropriate warning signs",
  ),

  // Visit summary (optional - may be skipped in email display)
  visitSummary: z
    .string()
    .optional()
    .describe("Brief summary of why pet was seen and what was done"),

  // Diagnosis (simple terms)
  diagnosis: z.string().optional().describe("What's wrong in simple terms"),

  // Treatments performed today (brief list)
  treatmentsToday: z
    .array(z.string())
    .optional()
    .describe("What was done during the visit - procedures, exams, etc."),

  // Vaccinations administered (separate from take-home medications)
  vaccinationsGiven: z
    .array(z.string())
    .optional()
    .describe("Vaccinations given during the visit (e.g., 'Rabies', 'DHPP')"),

  // Medications to give at home (NOT clinic-administered)
  medications: z
    .array(MedicationSchema)
    .optional()
    .describe("Take-home medications only - not vaccines or clinic treatments"),

  // Home care instructions
  homeCare: HomeCareInstructionsSchema.optional().describe(
    "What to do at home - only if explicitly stated in notes",
  ),

  // Follow-up information
  followUp: FollowUpSchema.optional().describe("Next steps and follow-up"),

  // Warning signs - extracted from notes if present
  warningSigns: z
    .array(z.string())
    .optional()
    .describe("Warning signs explicitly mentioned in notes - do not invent"),

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

  // Visit Summary (optional)
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

  // Vaccinations Given
  if (summary.vaccinationsGiven && summary.vaccinationsGiven.length > 0) {
    sections.push("VACCINATIONS");
    summary.vaccinationsGiven.forEach((vaccine) => {
      sections.push(`• ${vaccine}`);
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
      if (summary.followUp.reason) {
        followUpLine += ` for ${summary.followUp.reason}`;
      }
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
    caseType: undefined,
    visitSummary: undefined,
    diagnosis: undefined,
    treatmentsToday: [],
    vaccinationsGiven: [],
    medications: [],
    homeCare: undefined,
    followUp: { required: false },
    warningSigns: [],
    notes: undefined,
  };
}
