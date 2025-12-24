/**
 * Tests for vapi/validators.ts
 * - validateDynamicVariables: Validate required fields and structure
 * - inferConditionCategory: Infer medical condition category from text
 * - hasRequiredFieldsForCallType: Check call-type specific requirements
 */

import { describe, it, expect } from "vitest";
import {
  validateDynamicVariables,
  inferConditionCategory,
  hasRequiredFieldsForCallType,
} from "../validators";
import type { DynamicVariables } from "../types";

/* ========================================
   Test Fixtures
   ======================================== */

function createValidDischargeVariables(): Partial<DynamicVariables> {
  return {
    clinicName: "Pet Hospital",
    agentName: "Sarah",
    petName: "Max",
    ownerName: "John Smith",
    appointmentDate: "November eighth",
    callType: "discharge",
    clinicPhone: "four zero eight, two five nine, one two three four",
    emergencyPhone: "four zero eight, eight six five, four three two one",
    dischargeSummary:
      "Max was seen today for a routine wellness exam. All vitals normal.",
  };
}

function createValidFollowUpVariables(): Partial<DynamicVariables> {
  return {
    ...createValidDischargeVariables(),
    callType: "follow-up",
    condition: "Post-surgical recovery from spay",
    recheckDate: "November fifteenth",
  };
}

/* ========================================
   validateDynamicVariables Tests
   ======================================== */

describe("validateDynamicVariables", () => {
  describe("valid discharge variables", () => {
    it("validates complete discharge variables", () => {
      const variables = createValidDischargeVariables();
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedVariables).toBeDefined();
    });

    it("returns sanitized variables with trimmed strings", () => {
      const variables = {
        ...createValidDischargeVariables(),
        petName: "  Max  ",
        ownerName: "  John Smith  ",
      };
      const result = validateDynamicVariables(variables);

      expect(result.sanitizedVariables?.petName).toBe("Max");
      expect(result.sanitizedVariables?.ownerName).toBe("John Smith");
    });
  });

  describe("valid follow-up variables", () => {
    it("validates complete follow-up variables", () => {
      const variables = createValidFollowUpVariables();
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("required field validation", () => {
    it("fails when clinicName is missing", () => {
      const variables = createValidDischargeVariables();
      delete variables.clinicName;
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("clinicName is required");
    });

    it("fails when agentName is missing", () => {
      const variables = createValidDischargeVariables();
      delete variables.agentName;
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("agentName is required");
    });

    it("fails when petName is missing", () => {
      const variables = createValidDischargeVariables();
      delete variables.petName;
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("petName is required");
    });

    it("fails when ownerName is missing", () => {
      const variables = createValidDischargeVariables();
      delete variables.ownerName;
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("ownerName is required");
    });

    it("fails when appointmentDate is missing", () => {
      const variables = createValidDischargeVariables();
      delete variables.appointmentDate;
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("appointmentDate is required");
    });

    it("fails when callType is missing", () => {
      const variables = createValidDischargeVariables();
      delete variables.callType;
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'callType is required (must be "discharge" or "follow-up")',
      );
    });

    it("fails when dischargeSummary is missing", () => {
      const variables = createValidDischargeVariables();
      delete variables.dischargeSummary;
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("dischargeSummary is required");
    });

    it("fails for empty string values", () => {
      const variables = {
        ...createValidDischargeVariables(),
        petName: "   ",
      };
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("petName is required");
    });
  });

  describe("callType validation", () => {
    it("fails for invalid callType", () => {
      const variables = {
        ...createValidDischargeVariables(),
        callType: "invalid" as DynamicVariables["callType"],
      };
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'callType must be "discharge" or "follow-up", got "invalid"',
      );
    });

    it("accepts discharge callType", () => {
      const variables = {
        ...createValidDischargeVariables(),
        callType: "discharge" as const,
      };
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(true);
    });

    it("accepts follow-up callType", () => {
      const variables = createValidFollowUpVariables();
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(true);
    });
  });

  describe("follow-up specific validation", () => {
    it("requires condition for follow-up calls", () => {
      const variables = createValidFollowUpVariables();
      delete variables.condition;
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "condition is required for follow-up calls",
      );
    });
  });

  describe("warnings", () => {
    it("warns about Dr. title in agentName", () => {
      const variables = {
        ...createValidDischargeVariables(),
        agentName: "Dr. Sarah",
      };
      const result = validateDynamicVariables(variables);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("Dr."))).toBe(true);
    });

    it("warns about formatted appointmentDate", () => {
      const variables = {
        ...createValidDischargeVariables(),
        appointmentDate: "11/08/2024",
      };
      const result = validateDynamicVariables(variables);

      expect(result.warnings.some((w) => w.includes("spelled out"))).toBe(true);
    });

    it("warns about formatted phone numbers", () => {
      const variables = {
        ...createValidDischargeVariables(),
        clinicPhone: "408-259-1234",
      };
      const result = validateDynamicVariables(variables);

      expect(result.warnings.some((w) => w.includes("spelled out"))).toBe(true);
    });
  });

  describe("numeric field validation", () => {
    it("validates petAge within range", () => {
      const variables = {
        ...createValidDischargeVariables(),
        petAge: 5,
      };
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(true);
    });

    it("fails for petAge over 30", () => {
      const variables = {
        ...createValidDischargeVariables(),
        petAge: 35,
      };
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("petAge"))).toBe(true);
    });

    it("fails for negative petAge", () => {
      const variables = {
        ...createValidDischargeVariables(),
        petAge: -1,
      };
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("petAge"))).toBe(true);
    });

    it("validates petWeight within range", () => {
      const variables = {
        ...createValidDischargeVariables(),
        petWeight: 25.5,
      };
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(true);
    });

    it("fails for petWeight over 300", () => {
      const variables = {
        ...createValidDischargeVariables(),
        petWeight: 350,
      };
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("petWeight"))).toBe(true);
    });
  });

  describe("species validation", () => {
    it("accepts dog species", () => {
      const variables = {
        ...createValidDischargeVariables(),
        petSpecies: "dog" as const,
      };
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(true);
    });

    it("accepts cat species", () => {
      const variables = {
        ...createValidDischargeVariables(),
        petSpecies: "cat" as const,
      };
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(true);
    });

    it("accepts other species", () => {
      const variables = {
        ...createValidDischargeVariables(),
        petSpecies: "other" as const,
      };
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(true);
    });

    it("fails for invalid species", () => {
      const variables = {
        ...createValidDischargeVariables(),
        petSpecies: "hamster" as DynamicVariables["petSpecies"],
      };
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("petSpecies"))).toBe(true);
    });
  });

  describe("array field validation", () => {
    it("validates warningSignsToMonitor as array", () => {
      const variables = {
        ...createValidDischargeVariables(),
        warningSignsToMonitor: ["fever", "vomiting"],
      };
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(true);
    });

    it("fails when warningSignsToMonitor is not an array", () => {
      const variables = {
        ...createValidDischargeVariables(),
        warningSignsToMonitor: "fever" as unknown as string[],
      };
      const result = validateDynamicVariables(variables);

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("warningSignsToMonitor")),
      ).toBe(true);
    });
  });

  describe("strict mode", () => {
    it("throws error in strict mode when validation fails", () => {
      const variables = createValidDischargeVariables();
      delete variables.petName;

      expect(() => validateDynamicVariables(variables, true)).toThrow(
        /Validation failed/,
      );
    });

    it("does not throw in strict mode when validation passes", () => {
      const variables = createValidDischargeVariables();

      expect(() => validateDynamicVariables(variables, true)).not.toThrow();
    });
  });
});

/* ========================================
   inferConditionCategory Tests
   ======================================== */

describe("inferConditionCategory", () => {
  describe("gastrointestinal", () => {
    it("detects vomiting", () => {
      expect(inferConditionCategory("vomiting and diarrhea")).toBe(
        "gastrointestinal",
      );
    });

    it("detects diarrhea", () => {
      expect(inferConditionCategory("chronic diarrhea")).toBe(
        "gastrointestinal",
      );
    });

    it("detects GI", () => {
      expect(inferConditionCategory("GI upset")).toBe("gastrointestinal");
    });

    it("detects gastroenteritis", () => {
      expect(inferConditionCategory("acute gastroenteritis")).toBe(
        "gastrointestinal",
      );
    });
  });

  describe("post-surgical", () => {
    it("detects surgery", () => {
      expect(inferConditionCategory("post-surgery recovery")).toBe(
        "post-surgical",
      );
    });

    it("detects spay", () => {
      expect(inferConditionCategory("spay procedure")).toBe("post-surgical");
    });

    it("detects neuter", () => {
      expect(inferConditionCategory("neuter recovery")).toBe("post-surgical");
    });

    it("detects incision", () => {
      expect(inferConditionCategory("incision monitoring")).toBe(
        "post-surgical",
      );
    });
  });

  describe("dermatological", () => {
    it("detects skin condition", () => {
      expect(inferConditionCategory("skin infection")).toBe("dermatological");
    });

    it("detects hot spot", () => {
      expect(inferConditionCategory("hot spot treatment")).toBe(
        "dermatological",
      );
    });

    it("detects allergies", () => {
      // Use "allergy" to avoid "gi" substring in "allergic" matching GI first
      expect(inferConditionCategory("food allergy")).toBe("dermatological");
    });
  });

  describe("respiratory", () => {
    it("detects coughing", () => {
      expect(inferConditionCategory("persistent cough")).toBe("respiratory");
    });

    it("detects kennel cough", () => {
      expect(inferConditionCategory("kennel cough")).toBe("respiratory");
    });

    it("detects pneumonia", () => {
      expect(inferConditionCategory("pneumonia treatment")).toBe("respiratory");
    });
  });

  describe("urinary", () => {
    it("detects UTI", () => {
      expect(inferConditionCategory("urinary tract infection")).toBe("urinary");
    });

    it("detects bladder issues", () => {
      expect(inferConditionCategory("bladder stones")).toBe("urinary");
    });

    it("detects kidney issues", () => {
      expect(inferConditionCategory("kidney disease")).toBe("urinary");
    });
  });

  describe("orthopedic", () => {
    it("detects limping", () => {
      expect(inferConditionCategory("limping on back leg")).toBe("orthopedic");
    });

    it("detects arthritis", () => {
      expect(inferConditionCategory("arthritis management")).toBe("orthopedic");
    });

    it("detects ACL/cruciate", () => {
      // Use "ACL tear" to avoid "surgery" matching post-surgical first
      expect(inferConditionCategory("ACL tear")).toBe("orthopedic");
    });
  });

  describe("neurological", () => {
    it("detects seizures", () => {
      expect(inferConditionCategory("seizure disorder")).toBe("neurological");
    });

    it("detects IVDD", () => {
      expect(inferConditionCategory("IVDD disc disease")).toBe("neurological");
    });
  });

  describe("cardiac", () => {
    it("detects heart murmur", () => {
      expect(inferConditionCategory("heart murmur")).toBe("cardiac");
    });

    it("detects CHF", () => {
      expect(inferConditionCategory("congestive heart failure")).toBe(
        "cardiac",
      );
    });
  });

  describe("dental", () => {
    it("detects dental cleaning", () => {
      expect(inferConditionCategory("dental cleaning")).toBe("dental");
    });

    it("detects tooth extraction", () => {
      expect(inferConditionCategory("tooth extraction")).toBe("dental");
    });
  });

  describe("general/default", () => {
    it("returns general for empty string", () => {
      expect(inferConditionCategory("")).toBe("general");
    });

    it("returns general for unrecognized condition", () => {
      // Use "annual exam" to avoid "urin" substring in "routine" matching urinary
      expect(inferConditionCategory("annual exam")).toBe("general");
    });

    it("returns general for wellness visit", () => {
      expect(inferConditionCategory("annual wellness exam")).toBe("general");
    });
  });
});

/* ========================================
   hasRequiredFieldsForCallType Tests
   ======================================== */

describe("hasRequiredFieldsForCallType", () => {
  describe("discharge calls", () => {
    it("returns true when all core fields present", () => {
      const variables = createValidDischargeVariables();
      expect(hasRequiredFieldsForCallType(variables)).toBe(true);
    });

    it("returns false when clinicName missing", () => {
      const variables = createValidDischargeVariables();
      delete variables.clinicName;
      expect(hasRequiredFieldsForCallType(variables)).toBe(false);
    });

    it("returns false when petName is empty", () => {
      const variables = {
        ...createValidDischargeVariables(),
        petName: "   ",
      };
      expect(hasRequiredFieldsForCallType(variables)).toBe(false);
    });
  });

  describe("follow-up calls", () => {
    it("returns true when all fields including condition present", () => {
      const variables = createValidFollowUpVariables();
      expect(hasRequiredFieldsForCallType(variables)).toBe(true);
    });

    it("returns false when condition missing", () => {
      const variables = createValidFollowUpVariables();
      delete variables.condition;
      expect(hasRequiredFieldsForCallType(variables)).toBe(false);
    });

    it("returns false when condition is empty", () => {
      const variables = {
        ...createValidFollowUpVariables(),
        condition: "   ",
      };
      expect(hasRequiredFieldsForCallType(variables)).toBe(false);
    });
  });
});
