/**
 * Tests for vapi/utils.ts
 * - extractFirstName: Extract first word from pet name
 * - camelToSnake: Convert camelCase to snake_case
 * - convertKeysToSnakeCase: Convert object keys recursively
 * - normalizeVariablesToSnakeCase: Normalize mixed format variables
 */

import { describe, it, expect } from "vitest";
import {
  extractFirstName,
  camelToSnake,
  convertKeysToSnakeCase,
  normalizeVariablesToSnakeCase,
} from "../utils";

describe("extractFirstName", () => {
  describe("standard names", () => {
    it("extracts first word from multi-word name", () => {
      expect(extractFirstName("Max Smith")).toBe("Max");
    });

    it("returns single name as-is", () => {
      expect(extractFirstName("Buddy")).toBe("Buddy");
    });

    it("extracts first word from three-word name", () => {
      expect(extractFirstName("Sir Barksalot III")).toBe("Sir");
    });
  });

  describe("edge cases", () => {
    it("returns empty string for empty input", () => {
      expect(extractFirstName("")).toBe("");
    });

    it("returns empty string for null", () => {
      expect(extractFirstName(null)).toBe("");
    });

    it("returns empty string for undefined", () => {
      expect(extractFirstName(undefined)).toBe("");
    });

    it("handles leading whitespace", () => {
      expect(extractFirstName("  Max Smith")).toBe("Max");
    });

    it("handles trailing whitespace", () => {
      expect(extractFirstName("Max Smith  ")).toBe("Max");
    });

    it("handles multiple spaces between words", () => {
      expect(extractFirstName("Max    Smith")).toBe("Max");
    });

    it("handles tabs and newlines", () => {
      expect(extractFirstName("Max\tSmith")).toBe("Max");
    });
  });
});

describe("camelToSnake", () => {
  describe("standard conversions", () => {
    it("converts simple camelCase", () => {
      expect(camelToSnake("petName")).toBe("pet_name");
    });

    it("converts clinicName", () => {
      expect(camelToSnake("clinicName")).toBe("clinic_name");
    });

    it("converts appointmentDate", () => {
      expect(camelToSnake("appointmentDate")).toBe("appointment_date");
    });

    it("converts multiple uppercase letters", () => {
      expect(camelToSnake("ownerPhoneNumber")).toBe("owner_phone_number");
    });
  });

  describe("edge cases", () => {
    it("returns empty string for empty input", () => {
      expect(camelToSnake("")).toBe("");
    });

    it("returns single lowercase word as-is", () => {
      expect(camelToSnake("name")).toBe("name");
    });

    it("handles starting uppercase", () => {
      expect(camelToSnake("PetName")).toBe("_pet_name");
    });

    it("handles consecutive uppercase", () => {
      expect(camelToSnake("petID")).toBe("pet_i_d");
    });
  });
});

describe("convertKeysToSnakeCase", () => {
  describe("simple objects", () => {
    it("converts all keys to snake_case", () => {
      const input = { petName: "Max", ownerName: "John" };
      const result = convertKeysToSnakeCase(input);

      expect(result).toEqual({ pet_name: "Max", owner_name: "John" });
    });

    it("preserves string values", () => {
      const input = { clinicPhone: "555-1234" };
      const result = convertKeysToSnakeCase(input);

      expect(result.clinic_phone).toBe("555-1234");
    });

    it("preserves number values", () => {
      const input = { petAge: 5, petWeight: 25.5 };
      const result = convertKeysToSnakeCase(input);

      expect(result.pet_age).toBe(5);
      expect(result.pet_weight).toBe(25.5);
    });

    it("preserves boolean values", () => {
      const input = { isActive: true, hasAllergies: false };
      const result = convertKeysToSnakeCase(input);

      expect(result.is_active).toBe(true);
      expect(result.has_allergies).toBe(false);
    });
  });

  describe("null/undefined handling", () => {
    it("skips null values", () => {
      const input = { petName: "Max", ownerName: null };
      const result = convertKeysToSnakeCase(input);

      expect(result).toEqual({ pet_name: "Max" });
      expect("owner_name" in result).toBe(false);
    });

    it("skips undefined values", () => {
      const input = { petName: "Max", ownerName: undefined };
      const result = convertKeysToSnakeCase(input);

      expect(result).toEqual({ pet_name: "Max" });
      expect("owner_name" in result).toBe(false);
    });
  });

  describe("nested objects", () => {
    it("recursively converts nested object keys", () => {
      const input = {
        petInfo: {
          petName: "Max",
          petAge: 5,
        },
      };
      const result = convertKeysToSnakeCase(input);

      expect(result).toEqual({
        pet_info: {
          pet_name: "Max",
          pet_age: 5,
        },
      });
    });

    it("handles deeply nested objects", () => {
      const input = {
        level1: {
          level2: {
            fieldName: "value",
          },
        },
      };
      const result = convertKeysToSnakeCase(input);

      expect(result).toEqual({
        level1: {
          level2: {
            field_name: "value",
          },
        },
      });
    });
  });

  describe("arrays", () => {
    it("preserves arrays of primitives", () => {
      const input = { warningSigns: ["fever", "vomiting", "lethargy"] };
      const result = convertKeysToSnakeCase(input);

      expect(result.warning_signs).toEqual(["fever", "vomiting", "lethargy"]);
    });

    it("converts array of objects", () => {
      const input = {
        assessmentQuestions: [
          { questionText: "How is eating?", isRequired: true },
          { questionText: "How is behavior?", isRequired: false },
        ],
      };
      const result = convertKeysToSnakeCase(input);

      expect(result.assessment_questions).toEqual([
        { question_text: "How is eating?", is_required: true },
        { question_text: "How is behavior?", is_required: false },
      ]);
    });
  });

  describe("date handling", () => {
    it("preserves Date objects without conversion", () => {
      const date = new Date("2024-12-01");
      const input = { appointmentDate: date };
      const result = convertKeysToSnakeCase(input);

      expect(result.appointment_date).toBe(date);
    });
  });
});

describe("normalizeVariablesToSnakeCase", () => {
  describe("null/undefined input", () => {
    it("returns empty object for null", () => {
      expect(normalizeVariablesToSnakeCase(null)).toEqual({});
    });

    it("returns empty object for undefined", () => {
      expect(normalizeVariablesToSnakeCase(undefined)).toEqual({});
    });
  });

  describe("camelCase input", () => {
    it("converts camelCase keys", () => {
      const input = { petName: "Max", clinicName: "Pet Hospital" };
      const result = normalizeVariablesToSnakeCase(input);

      expect(result).toEqual({
        pet_name: "Max",
        clinic_name: "Pet Hospital",
      });
    });
  });

  describe("snake_case input", () => {
    it("preserves snake_case keys", () => {
      const input = { pet_name: "Max", clinic_name: "Pet Hospital" };
      const result = normalizeVariablesToSnakeCase(input);

      expect(result).toEqual({
        pet_name: "Max",
        clinic_name: "Pet Hospital",
      });
    });
  });

  describe("mixed format input", () => {
    it("normalizes mixed camelCase and snake_case", () => {
      const input = {
        petName: "Max",
        clinic_name: "Pet Hospital",
        ownerPhone: "555-1234",
        emergency_phone: "555-9999",
      };
      const result = normalizeVariablesToSnakeCase(input);

      expect(result).toEqual({
        pet_name: "Max",
        clinic_name: "Pet Hospital",
        owner_phone: "555-1234",
        emergency_phone: "555-9999",
      });
    });
  });

  describe("nested objects in mixed format", () => {
    it("normalizes nested objects", () => {
      const input = {
        petInfo: {
          petName: "Max",
          pet_age: 5,
        },
      };
      const result = normalizeVariablesToSnakeCase(input);

      expect(result).toEqual({
        pet_info: {
          pet_name: "Max",
          pet_age: 5,
        },
      });
    });
  });
});
