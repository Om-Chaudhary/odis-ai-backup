/**
 * Tests for AI Veterinary Scribe Validation Schemas
 */

import { describe, it, expect } from "vitest";
import {
  NormalizeRequestSchema,
  ExtractedPatientSchema,
  ClinicalDetailsSchema,
  CaseTypeSchema,
  NormalizedEntitiesSchema,
  NormalizeResponseSchema,
  parseWeightToKg,
  parseAgeToDOB,
  sanitizePhoneNumber,
} from "../scribe";

describe("NormalizeRequestSchema", () => {
  describe("valid inputs", () => {
    it("accepts valid normalization request with minimal fields", () => {
      const validRequest = {
        input:
          "This is a clinical note about a dog visit. The dog came in for a checkup and seemed healthy overall.",
      };
      const result = NormalizeRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("accepts valid request with all optional fields", () => {
      const validRequest = {
        input:
          "This is a clinical note about a dog visit. The dog came in for a checkup and seemed healthy overall.",
        caseId: "123e4567-e89b-12d3-a456-426614174000",
        inputType: "transcript" as const,
        metadata: { source: "mobile_app" },
      };
      const result = NormalizeRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.inputType).toBe("transcript");
      }
    });

    it("defaults inputType to 'other' when not provided", () => {
      const validRequest = {
        input:
          "This is a clinical note about a dog visit. The dog came in for a checkup and seemed healthy overall.",
      };
      const result = NormalizeRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.inputType).toBe("other");
      }
    });

    it("accepts all valid inputType values", () => {
      const types = [
        "transcript",
        "soap_note",
        "visit_notes",
        "discharge_summary",
        "other",
      ];
      types.forEach((type) => {
        const result = NormalizeRequestSchema.safeParse({
          input:
            "This is a clinical note about a dog visit. The dog came in for a checkup.",
          inputType: type,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("invalid inputs", () => {
    it("rejects input shorter than 50 characters", () => {
      const result = NormalizeRequestSchema.safeParse({
        input: "Short note",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain("minimum 50");
      }
    });

    it("rejects invalid UUID for caseId", () => {
      const result = NormalizeRequestSchema.safeParse({
        input:
          "This is a clinical note about a dog visit. The dog came in for a checkup and seemed healthy overall.",
        caseId: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid inputType", () => {
      const result = NormalizeRequestSchema.safeParse({
        input:
          "This is a clinical note about a dog visit. The dog came in for a checkup and seemed healthy overall.",
        inputType: "invalid_type",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing input field", () => {
      const result = NormalizeRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});

describe("ExtractedPatientSchema", () => {
  describe("valid inputs", () => {
    it("accepts valid patient data with all fields", () => {
      const validPatient = {
        name: "Max",
        species: "dog" as const,
        breed: "Labrador",
        age: "3 years",
        sex: "male" as const,
        weight: "25 kg",
        owner: {
          name: "John Doe",
          phone: "+1234567890",
          email: "john@example.com",
        },
      };
      const result = ExtractedPatientSchema.safeParse(validPatient);
      expect(result.success).toBe(true);
    });

    it("accepts empty string for name", () => {
      const result = ExtractedPatientSchema.safeParse({
        name: "",
        species: "cat",
        owner: { name: "" },
      });
      expect(result.success).toBe(true);
    });

    it("accepts all valid species values", () => {
      const species = ["dog", "cat", "bird", "rabbit", "other", "unknown"];
      species.forEach((sp) => {
        const result = ExtractedPatientSchema.safeParse({
          name: "Pet",
          species: sp,
          owner: { name: "Owner" },
        });
        expect(result.success).toBe(true);
      });
    });

    it("accepts all valid sex values", () => {
      const sexes = ["male", "female", "unknown"];
      sexes.forEach((sex) => {
        const result = ExtractedPatientSchema.safeParse({
          name: "Pet",
          species: "dog",
          sex,
          owner: { name: "Owner" },
        });
        expect(result.success).toBe(true);
      });
    });

    it("accepts empty string and 'unknown' for email", () => {
      const result1 = ExtractedPatientSchema.safeParse({
        name: "Pet",
        species: "dog",
        owner: { name: "Owner", email: "" },
      });
      const result2 = ExtractedPatientSchema.safeParse({
        name: "Pet",
        species: "dog",
        owner: { name: "Owner", email: "unknown" },
      });
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects invalid species", () => {
      const result = ExtractedPatientSchema.safeParse({
        name: "Pet",
        species: "fish",
        owner: { name: "Owner" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email format", () => {
      const result = ExtractedPatientSchema.safeParse({
        name: "Pet",
        species: "dog",
        owner: { name: "Owner", email: "not-an-email" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      const result = ExtractedPatientSchema.safeParse({
        name: "Pet",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("ClinicalDetailsSchema", () => {
  describe("valid inputs", () => {
    it("accepts empty object (all fields optional)", () => {
      const result = ClinicalDetailsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts complete clinical data", () => {
      const validData = {
        chiefComplaint: "Ear infection",
        visitReason: "Follow-up",
        presentingSymptoms: ["scratching", "head shaking"],
        vitalSigns: {
          temperature: "101.5 F",
          heartRate: "120 bpm",
          respiratoryRate: "24 rpm",
          weight: "25 kg",
        },
        physicalExamFindings: ["Red inflamed ears", "Normal heart sounds"],
        diagnoses: ["Bilateral otitis externa"],
        differentialDiagnoses: ["Allergies", "Mites"],
        medications: [
          {
            name: "Otomax",
            dosage: "2 drops",
            frequency: "twice daily",
            duration: "10 days",
            route: "topical",
          },
        ],
        vaccinations: [
          {
            name: "Rabies",
            manufacturer: "Merial",
            lotNumber: "ABC123",
          },
        ],
        treatments: ["Ear cleaning"],
        procedures: ["Otoscopic exam"],
        followUpInstructions: "Return in 2 weeks",
        followUpDate: "2024-02-15",
        recheckRequired: true,
        labResults: ["CBC normal"],
        imagingResults: ["X-ray clear"],
        clinicalNotes: "Good prognosis",
        prognosis: "Excellent",
      };
      const result = ClinicalDetailsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("accepts partial data", () => {
      const result = ClinicalDetailsSchema.safeParse({
        chiefComplaint: "Limping",
        diagnoses: ["Sprain"],
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("CaseTypeSchema", () => {
  it("accepts all valid case types", () => {
    const types = [
      "checkup",
      "emergency",
      "surgery",
      "follow_up",
      "dental",
      "vaccination",
      "diagnostic",
      "consultation",
      "exam",
      "euthanasia",
      "other",
      "unknown",
    ];
    types.forEach((type) => {
      const result = CaseTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });
  });

  it("rejects invalid case type", () => {
    const result = CaseTypeSchema.safeParse("invalid_type");
    expect(result.success).toBe(false);
  });
});

describe("NormalizedEntitiesSchema", () => {
  describe("valid inputs", () => {
    it("accepts valid normalized entities", () => {
      const validEntities = {
        patient: {
          name: "Max",
          species: "dog" as const,
          owner: { name: "John Doe" },
        },
        clinical: {},
        caseType: "checkup" as const,
        confidence: {
          overall: 0.95,
          patient: 0.98,
          clinical: 0.92,
        },
      };
      const result = NormalizedEntitiesSchema.safeParse(validEntities);
      expect(result.success).toBe(true);
    });

    it("accepts with optional fields", () => {
      const validEntities = {
        patient: {
          name: "Max",
          species: "dog" as const,
          owner: { name: "John" },
        },
        clinical: {},
        caseType: "surgery" as const,
        confidence: {
          overall: 0.9,
          patient: 0.95,
          clinical: 0.85,
        },
        warnings: ["Low confidence on clinical data"],
        extractedAt: "2024-01-01T10:00:00Z",
        originalInput: "Original text here",
        inputType: "transcript",
      };
      const result = NormalizedEntitiesSchema.safeParse(validEntities);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects confidence values outside 0-1 range", () => {
      const result = NormalizedEntitiesSchema.safeParse({
        patient: {
          name: "Max",
          species: "dog",
          owner: { name: "John" },
        },
        clinical: {},
        caseType: "checkup",
        confidence: {
          overall: 1.5,
          patient: 0.9,
          clinical: 0.8,
        },
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative confidence values", () => {
      const result = NormalizedEntitiesSchema.safeParse({
        patient: {
          name: "Max",
          species: "dog",
          owner: { name: "John" },
        },
        clinical: {},
        caseType: "checkup",
        confidence: {
          overall: 0.9,
          patient: -0.1,
          clinical: 0.8,
        },
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("NormalizeResponseSchema", () => {
  it("accepts valid response", () => {
    const validResponse = {
      success: true as const,
      data: {
        case: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          type: "checkup" as const,
          status: "active",
          metadata: {},
          created_at: "2024-01-01T10:00:00Z",
        },
        patient: {
          id: "123e4567-e89b-12d3-a456-426614174001",
          name: "Max",
          species: "dog",
          owner_name: "John Doe",
        },
        entities: {
          patient: {
            name: "Max",
            species: "dog" as const,
            owner: { name: "John Doe" },
          },
          clinical: {},
          caseType: "checkup" as const,
          confidence: {
            overall: 0.95,
            patient: 0.98,
            clinical: 0.92,
          },
        },
      },
    };
    const result = NormalizeResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it("rejects when success is not literal true", () => {
    const result = NormalizeResponseSchema.safeParse({
      success: false,
      data: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("Helper Functions", () => {
  describe("parseWeightToKg", () => {
    it("parses kg values correctly", () => {
      expect(parseWeightToKg("25 kg")).toBe(25);
      expect(parseWeightToKg("25kg")).toBe(25);
      expect(parseWeightToKg("25.5 kg")).toBe(25.5);
    });

    it("converts lbs to kg correctly", () => {
      expect(parseWeightToKg("55 lbs")).toBeCloseTo(24.95, 1);
      expect(parseWeightToKg("55 lb")).toBeCloseTo(24.95, 1);
      expect(parseWeightToKg("55 pounds")).toBeCloseTo(24.95, 1);
      expect(parseWeightToKg("55 pound")).toBeCloseTo(24.95, 1);
    });

    it("handles values without units as kg", () => {
      expect(parseWeightToKg("25")).toBe(25);
    });

    it("returns undefined for invalid input", () => {
      expect(parseWeightToKg(undefined)).toBeUndefined();
      expect(parseWeightToKg("")).toBeUndefined();
      expect(parseWeightToKg("invalid")).toBeUndefined();
      expect(parseWeightToKg("abc kg")).toBeUndefined();
    });

    it("handles decimal values", () => {
      expect(parseWeightToKg("12.5 kg")).toBe(12.5);
      expect(parseWeightToKg("27.6 lbs")).toBeCloseTo(12.52, 1);
    });
  });

  describe("parseAgeToDOB", () => {
    it("parses year values correctly", () => {
      const result = parseAgeToDOB("3 years");
      expect(result).toBeDefined();
      if (result) {
        const date = new Date(result);
        const now = new Date();
        const yearsDiff =
          now.getFullYear() -
          date.getFullYear() -
          (now.getMonth() < date.getMonth() ||
          (now.getMonth() === date.getMonth() && now.getDate() < date.getDate())
            ? 1
            : 0);
        expect(yearsDiff).toBe(3);
      }
    });

    it("parses month values correctly", () => {
      const result = parseAgeToDOB("6 months");
      expect(result).toBeDefined();
      if (result) {
        const date = new Date(result);
        const now = new Date();
        const monthsDiff =
          (now.getFullYear() - date.getFullYear()) * 12 +
          (now.getMonth() - date.getMonth());
        expect(monthsDiff).toBeCloseTo(6, 0);
      }
    });

    it("parses combined year and month values", () => {
      const result = parseAgeToDOB("2 years 6 months");
      expect(result).toBeDefined();
      if (result) {
        const date = new Date(result);
        const now = new Date();
        const monthsDiff =
          (now.getFullYear() - date.getFullYear()) * 12 +
          (now.getMonth() - date.getMonth());
        expect(monthsDiff).toBeCloseTo(30, 0);
      }
    });

    it("handles abbreviated formats", () => {
      expect(parseAgeToDOB("3 yr")).toBeDefined();
      expect(parseAgeToDOB("6 mo")).toBeDefined();
    });

    it("returns undefined for invalid input", () => {
      expect(parseAgeToDOB(undefined)).toBeUndefined();
      expect(parseAgeToDOB("")).toBeUndefined();
      expect(parseAgeToDOB("invalid")).toBeUndefined();
      expect(parseAgeToDOB("old")).toBeUndefined();
    });

    it("returns ISO date string", () => {
      const result = parseAgeToDOB("1 year");
      expect(result).toBeDefined();
      if (result) {
        expect(() => new Date(result)).not.toThrow();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    });
  });

  describe("sanitizePhoneNumber", () => {
    it("formats 10-digit numbers to E.164", () => {
      expect(sanitizePhoneNumber("5551234567")).toBe("+15551234567");
      expect(sanitizePhoneNumber("555-123-4567")).toBe("+15551234567");
      expect(sanitizePhoneNumber("(555) 123-4567")).toBe("+15551234567");
    });

    it("formats 11-digit numbers starting with 1", () => {
      expect(sanitizePhoneNumber("15551234567")).toBe("+15551234567");
      expect(sanitizePhoneNumber("1-555-123-4567")).toBe("+15551234567");
    });

    it("returns original for non-standard formats", () => {
      expect(sanitizePhoneNumber("+15551234567")).toBe("+15551234567");
      expect(sanitizePhoneNumber("123")).toBe("123");
      expect(sanitizePhoneNumber("+44123456789")).toBe("+44123456789");
    });

    it("returns undefined for undefined input", () => {
      expect(sanitizePhoneNumber(undefined)).toBeUndefined();
    });

    it("handles various formatting characters", () => {
      expect(sanitizePhoneNumber("555 123 4567")).toBe("+15551234567");
      expect(sanitizePhoneNumber("555.123.4567")).toBe("+15551234567");
      expect(sanitizePhoneNumber("555-123-4567")).toBe("+15551234567");
    });
  });
});
