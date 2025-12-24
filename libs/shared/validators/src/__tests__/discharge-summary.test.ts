/**
 * Tests for Structured Discharge Summary Validation Schemas
 */

import { describe, it, expect } from "vitest";
import {
  MedicationSchema,
  HomeCareInstructionsSchema,
  FollowUpSchema,
  DischargeCaseTypeSchema,
  StructuredDischargeSummarySchema,
  validateStructuredSummary,
  structuredToPlainText,
  createEmptyStructuredSummary,
} from "../discharge-summary";

describe("MedicationSchema", () => {
  describe("valid inputs", () => {
    it("accepts medication with only name (minimal)", () => {
      const result = MedicationSchema.safeParse({
        name: "Carprofen",
      });
      expect(result.success).toBe(true);
    });

    it("accepts complete medication data", () => {
      const validMed = {
        name: "Apoquel",
        dosage: "16mg",
        frequency: "twice daily",
        duration: "14 days",
        totalQuantity: "28 tablets total",
        purpose: "for itching and allergies",
        instructions: "Give with food",
      };
      const result = MedicationSchema.safeParse(validMed);
      expect(result.success).toBe(true);
    });

    it("accepts partial medication data", () => {
      const result = MedicationSchema.safeParse({
        name: "Cephalexin",
        dosage: "500mg",
        frequency: "twice daily",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects missing name", () => {
      const result = MedicationSchema.safeParse({
        dosage: "16mg",
        frequency: "twice daily",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const result = MedicationSchema.safeParse({
        name: "",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("HomeCareInstructionsSchema", () => {
  describe("valid inputs", () => {
    it("accepts empty object (all fields optional)", () => {
      const result = HomeCareInstructionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts complete home care instructions", () => {
      const validInstructions = {
        activity: "Restrict activity for 7 days",
        diet: "Soft food for 3 days",
        monitoring: ["Watch incision site", "Monitor appetite"],
        woundCare: "Clean incision daily with saline",
      };
      const result = HomeCareInstructionsSchema.safeParse(validInstructions);
      expect(result.success).toBe(true);
    });

    it("accepts partial instructions", () => {
      const result = HomeCareInstructionsSchema.safeParse({
        activity: "Rest for 3 days",
        monitoring: ["Watch for vomiting"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty monitoring array", () => {
      const result = HomeCareInstructionsSchema.safeParse({
        monitoring: [],
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("FollowUpSchema", () => {
  describe("valid inputs", () => {
    it("accepts required follow-up with all fields", () => {
      const result = FollowUpSchema.safeParse({
        required: true,
        date: "in 2 weeks",
        reason: "Recheck incision",
      });
      expect(result.success).toBe(true);
    });

    it("accepts no follow-up required", () => {
      const result = FollowUpSchema.safeParse({
        required: false,
      });
      expect(result.success).toBe(true);
    });

    it("accepts required without date and reason", () => {
      const result = FollowUpSchema.safeParse({
        required: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects missing required field", () => {
      const result = FollowUpSchema.safeParse({
        date: "in 2 weeks",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-boolean required", () => {
      const result = FollowUpSchema.safeParse({
        required: "yes",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("DischargeCaseTypeSchema", () => {
  it("accepts all valid case types", () => {
    const validTypes = [
      "surgery",
      "dental",
      "vaccination",
      "dermatology",
      "wellness",
      "emergency",
      "gastrointestinal",
      "orthopedic",
      "other",
    ];
    validTypes.forEach((type) => {
      const result = DischargeCaseTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });
  });

  it("rejects invalid case type", () => {
    const result = DischargeCaseTypeSchema.safeParse("invalid");
    expect(result.success).toBe(false);
  });
});

describe("StructuredDischargeSummarySchema", () => {
  describe("valid inputs", () => {
    it("accepts minimal valid summary (only patient name)", () => {
      const result = StructuredDischargeSummarySchema.safeParse({
        patientName: "Max",
      });
      expect(result.success).toBe(true);
    });

    it("accepts complete discharge summary", () => {
      const completeSummary = {
        patientName: "Max",
        caseType: "surgery" as const,
        appointmentSummary: "Max came in for routine dental cleaning...",
        visitSummary: "Dental cleaning and tooth extraction",
        diagnosis: "Tooth decay requiring extraction",
        treatmentsToday: ["Dental cleaning", "Tooth extraction", "IV fluids"],
        vaccinationsGiven: ["Rabies", "DHPP"],
        medications: [
          {
            name: "Carprofen",
            dosage: "75mg",
            frequency: "twice daily",
            duration: "7 days",
            purpose: "for pain relief",
          },
        ],
        homeCare: {
          activity: "Rest for 3 days",
          diet: "Soft food for 48 hours",
          monitoring: ["Watch incision", "Monitor eating"],
          woundCare: "Keep incision clean",
        },
        followUp: {
          required: true,
          date: "in 10 days",
          reason: "Recheck incision",
        },
        warningSigns: [
          "Excessive bleeding",
          "Not eating for 24 hours",
          "Fever",
        ],
        notes: "Call if any concerns",
      };
      const result =
        StructuredDischargeSummarySchema.safeParse(completeSummary);
      expect(result.success).toBe(true);
    });

    it("accepts wellness visit without treatments", () => {
      const result = StructuredDischargeSummarySchema.safeParse({
        patientName: "Buddy",
        caseType: "wellness",
        appointmentSummary: "Buddy came in for annual wellness check...",
        vaccinationsGiven: ["Rabies", "DHPP"],
        followUp: {
          required: true,
          date: "in 1 year",
          reason: "Annual checkup",
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty arrays for optional array fields", () => {
      const result = StructuredDischargeSummarySchema.safeParse({
        patientName: "Max",
        treatmentsToday: [],
        vaccinationsGiven: [],
        medications: [],
        warningSigns: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects missing patient name", () => {
      const result = StructuredDischargeSummarySchema.safeParse({
        caseType: "surgery",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty patient name", () => {
      const result = StructuredDischargeSummarySchema.safeParse({
        patientName: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid case type", () => {
      const result = StructuredDischargeSummarySchema.safeParse({
        patientName: "Max",
        caseType: "invalid_type",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid medication in array", () => {
      const result = StructuredDischargeSummarySchema.safeParse({
        patientName: "Max",
        medications: [
          {
            dosage: "10mg", // Missing required 'name'
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("accepts special characters in patient name", () => {
      const result = StructuredDischargeSummarySchema.safeParse({
        patientName: "Mr. Whiskers O'Malley III",
      });
      expect(result.success).toBe(true);
    });

    it("accepts very long text fields", () => {
      const longText = "A".repeat(10000);
      const result = StructuredDischargeSummarySchema.safeParse({
        patientName: "Max",
        appointmentSummary: longText,
        visitSummary: longText,
        diagnosis: longText,
        notes: longText,
      });
      expect(result.success).toBe(true);
    });

    it("accepts unicode characters", () => {
      const result = StructuredDischargeSummarySchema.safeParse({
        patientName: "雪球",
        diagnosis: "耳朵感染",
      });
      expect(result.success).toBe(true);
    });

    it("accepts many medications", () => {
      const manyMeds = Array.from({ length: 10 }, (_, i) => ({
        name: `Medication ${i + 1}`,
      }));
      const result = StructuredDischargeSummarySchema.safeParse({
        patientName: "Max",
        medications: manyMeds,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("Helper Functions", () => {
  describe("validateStructuredSummary", () => {
    it("returns success for valid summary", () => {
      const validSummary = {
        patientName: "Max",
        caseType: "wellness" as const,
      };
      const result = validateStructuredSummary(validSummary);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.patientName).toBe("Max");
      }
    });

    it("returns error for invalid summary", () => {
      const invalidSummary = {
        caseType: "wellness",
        // Missing patientName
      };
      const result = validateStructuredSummary(invalidSummary);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("structuredToPlainText", () => {
    it("converts complete summary to plain text", () => {
      const summary = {
        patientName: "Max",
        caseType: "surgery" as const,
        appointmentSummary: "Max had dental surgery today.",
        visitSummary: "Dental cleaning and extraction",
        diagnosis: "Tooth decay",
        treatmentsToday: ["Dental cleaning", "Tooth extraction"],
        vaccinationsGiven: ["Rabies"],
        medications: [
          {
            name: "Carprofen",
            dosage: "75mg",
            frequency: "twice daily",
            duration: "7 days",
            instructions: "Give with food",
          },
        ],
        homeCare: {
          activity: "Rest for 3 days",
          diet: "Soft food",
          monitoring: ["Watch incision"],
          woundCare: "Keep clean",
        },
        followUp: {
          required: true,
          date: "in 10 days",
          reason: "Recheck",
        },
        warningSigns: ["Bleeding", "Not eating"],
        notes: "Call with questions",
      };
      const plainText = structuredToPlainText(summary);

      expect(plainText).toContain("MAX");
      expect(plainText).toContain("ABOUT TODAY'S VISIT");
      expect(plainText).toContain("Max had dental surgery today");
      expect(plainText).toContain("DIAGNOSIS");
      expect(plainText).toContain("Tooth decay");
      expect(plainText).toContain("MEDICATIONS");
      expect(plainText).toContain("Carprofen");
      expect(plainText).toContain("HOME CARE");
      expect(plainText).toContain("FOLLOW-UP");
      expect(plainText).toContain("⚠️ CALL US IMMEDIATELY");
      expect(plainText).toContain("Bleeding");
      expect(plainText).toContain("ADDITIONAL NOTES");
    });

    it("handles minimal summary", () => {
      const summary = {
        patientName: "Buddy",
      };
      const plainText = structuredToPlainText(summary);

      expect(plainText).toContain("BUDDY");
      expect(plainText).toContain("If you have any questions");
    });

    it("formats medications correctly", () => {
      const summary = {
        patientName: "Max",
        medications: [
          {
            name: "Apoquel",
            dosage: "16mg",
            frequency: "once daily",
            duration: "30 days",
            instructions: "Give with food",
          },
        ],
      };
      const plainText = structuredToPlainText(summary);

      expect(plainText).toContain("Apoquel");
      expect(plainText).toContain("16mg");
      expect(plainText).toContain("once daily");
      expect(plainText).toContain("30 days");
      expect(plainText).toContain("Give with food");
    });

    it("formats follow-up when required", () => {
      const summary = {
        patientName: "Max",
        followUp: {
          required: true,
          date: "in 2 weeks",
          reason: "recheck wound",
        },
      };
      const plainText = structuredToPlainText(summary);

      expect(plainText).toContain("FOLLOW-UP");
      expect(plainText).toContain("in 2 weeks");
      expect(plainText).toContain("recheck wound");
    });

    it("formats follow-up when not required", () => {
      const summary = {
        patientName: "Max",
        followUp: {
          required: false,
        },
      };
      const plainText = structuredToPlainText(summary);

      expect(plainText).toContain("No follow-up needed");
    });

    it("includes all sections when present", () => {
      const summary = {
        patientName: "Max",
        appointmentSummary: "Visit summary",
        visitSummary: "Detailed visit",
        diagnosis: "Test diagnosis",
        treatmentsToday: ["Treatment 1"],
        vaccinationsGiven: ["Rabies"],
        medications: [{ name: "Med1" }],
        homeCare: {
          activity: "Rest",
          diet: "Soft food",
          monitoring: ["Watch carefully"],
          woundCare: "Keep clean",
        },
        followUp: { required: true },
        warningSigns: ["Warning 1"],
        notes: "Additional info",
      };
      const plainText = structuredToPlainText(summary);

      expect(plainText).toContain("ABOUT TODAY'S VISIT");
      expect(plainText).toContain("VISIT SUMMARY");
      expect(plainText).toContain("DIAGNOSIS");
      expect(plainText).toContain("WHAT WE DID TODAY");
      expect(plainText).toContain("VACCINATIONS");
      expect(plainText).toContain("MEDICATIONS");
      expect(plainText).toContain("HOME CARE");
      expect(plainText).toContain("FOLLOW-UP");
      expect(plainText).toContain("⚠️ CALL US IMMEDIATELY");
      expect(plainText).toContain("ADDITIONAL NOTES");
    });
  });

  describe("createEmptyStructuredSummary", () => {
    it("creates empty summary with patient name", () => {
      const summary = createEmptyStructuredSummary("Buddy");

      expect(summary.patientName).toBe("Buddy");
      expect(summary.caseType).toBeUndefined();
      expect(summary.treatmentsToday).toEqual([]);
      expect(summary.medications).toEqual([]);
      expect(summary.followUp).toEqual({ required: false });
      expect(summary.warningSigns).toEqual([]);
    });

    it("creates valid summary according to schema", () => {
      const summary = createEmptyStructuredSummary("Test");
      const result = StructuredDischargeSummarySchema.safeParse(summary);

      expect(result.success).toBe(true);
    });

    it("handles special characters in name", () => {
      const summary = createEmptyStructuredSummary("Mr. Whiskers O'Malley");

      expect(summary.patientName).toBe("Mr. Whiskers O'Malley");
      expect(StructuredDischargeSummarySchema.safeParse(summary).success).toBe(
        true,
      );
    });
  });
});
