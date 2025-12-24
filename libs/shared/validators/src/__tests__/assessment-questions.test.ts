/**
 * Tests for AI-Generated Assessment Questions Validation Schemas
 */

import { describe, it, expect } from "vitest";
import {
  AssessmentQuestionSchema,
  GeneratedCallIntelligenceSchema,
  GenerateCallIntelligenceInputSchema,
} from "../assessment-questions";

describe("AssessmentQuestionSchema", () => {
  describe("valid inputs", () => {
    it("accepts valid question with all fields", () => {
      const validQuestion = {
        question: "How is {{petName}} doing with the medication?",
        context: "Post-surgery pain management",
        expectedPositiveResponse: ["doing well", "no pain", "eating normally"],
        concerningResponses: ["vomiting", "not eating", "lethargic"],
        followUpIfConcerning: "Can you describe the symptoms in more detail?",
        priority: 1 as const,
      };
      const result = AssessmentQuestionSchema.safeParse(validQuestion);
      expect(result.success).toBe(true);
    });

    it("accepts minimal valid question", () => {
      const result = AssessmentQuestionSchema.safeParse({
        question: "Is your pet eating normally?",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe(2); // Default priority
      }
    });

    it("defaults priority to 2 when not provided", () => {
      const result = AssessmentQuestionSchema.safeParse({
        question: "How is your pet feeling today?",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe(2);
      }
    });

    it("accepts all valid priority values (1-5)", () => {
      const priorities = [1, 2, 3, 4, 5] as const;
      priorities.forEach((priority) => {
        const result = AssessmentQuestionSchema.safeParse({
          question: "How is your pet doing?",
          priority,
        });
        expect(result.success).toBe(true);
      });
    });

    it("accepts question with placeholder", () => {
      const result = AssessmentQuestionSchema.safeParse({
        question: "Is {{petName}} drinking water regularly?",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects question shorter than 10 characters", () => {
      const result = AssessmentQuestionSchema.safeParse({
        question: "How pet?",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain("too short");
      }
    });

    it("rejects missing question field", () => {
      const result = AssessmentQuestionSchema.safeParse({
        context: "Some context",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid priority values", () => {
      const result = AssessmentQuestionSchema.safeParse({
        question: "How is your pet?",
        priority: 6,
      });
      expect(result.success).toBe(false);
    });

    it("rejects priority value 0", () => {
      const result = AssessmentQuestionSchema.safeParse({
        question: "How is your pet?",
        priority: 0,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("GeneratedCallIntelligenceSchema", () => {
  describe("valid inputs", () => {
    it("accepts complete valid call intelligence", () => {
      const validIntelligence = {
        caseContextSummary:
          "3-year-old Lab with bilateral ear infection, prescribed Otomax",
        assessmentQuestions: [
          {
            question: "How is {{petName}} responding to the ear medication?",
            priority: 1 as const,
          },
          {
            question: "Is {{petName}} still shaking their head?",
            priority: 2 as const,
          },
        ],
        warningSignsToMonitor: [
          "Excessive head shaking",
          "Loss of balance",
          "Discharge from ears",
        ],
        normalExpectations: [
          "Reduced scratching within 2-3 days",
          "Improvement in ear redness",
        ],
        emergencyCriteria: [
          "Difficulty walking or balance problems",
          "Severe head tilt",
        ],
        shouldAskClinicalQuestions: true,
        callApproach: "standard-assessment" as const,
        confidence: 0.92,
      };
      const result =
        GeneratedCallIntelligenceSchema.safeParse(validIntelligence);
      expect(result.success).toBe(true);
    });

    it("accepts minimal assessment questions (1)", () => {
      const result = GeneratedCallIntelligenceSchema.safeParse({
        caseContextSummary: "Routine wellness check",
        assessmentQuestions: [
          {
            question: "How is your pet doing overall?",
          },
        ],
        warningSignsToMonitor: [],
        normalExpectations: [],
        emergencyCriteria: [],
        shouldAskClinicalQuestions: false,
        callApproach: "brief-checkin",
        confidence: 0.8,
      });
      expect(result.success).toBe(true);
    });

    it("accepts all valid callApproach values", () => {
      const approaches = [
        "brief-checkin",
        "standard-assessment",
        "detailed-monitoring",
      ] as const;
      approaches.forEach((approach) => {
        const result = GeneratedCallIntelligenceSchema.safeParse({
          caseContextSummary: "Test case",
          assessmentQuestions: [{ question: "How is your pet?" }],
          warningSignsToMonitor: [],
          normalExpectations: [],
          emergencyCriteria: [],
          shouldAskClinicalQuestions: true,
          callApproach: approach,
          confidence: 0.9,
        });
        expect(result.success).toBe(true);
      });
    });

    it("accepts confidence at boundary values", () => {
      const result1 = GeneratedCallIntelligenceSchema.safeParse({
        caseContextSummary: "Test",
        assessmentQuestions: [{ question: "How is your pet?" }],
        warningSignsToMonitor: [],
        normalExpectations: [],
        emergencyCriteria: [],
        shouldAskClinicalQuestions: true,
        callApproach: "brief-checkin",
        confidence: 0,
      });
      const result2 = GeneratedCallIntelligenceSchema.safeParse({
        caseContextSummary: "Test",
        assessmentQuestions: [{ question: "How is your pet?" }],
        warningSignsToMonitor: [],
        normalExpectations: [],
        emergencyCriteria: [],
        shouldAskClinicalQuestions: true,
        callApproach: "brief-checkin",
        confidence: 1,
      });
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty assessment questions array", () => {
      const result = GeneratedCallIntelligenceSchema.safeParse({
        caseContextSummary: "Test case",
        assessmentQuestions: [],
        warningSignsToMonitor: [],
        normalExpectations: [],
        emergencyCriteria: [],
        shouldAskClinicalQuestions: true,
        callApproach: "standard-assessment",
        confidence: 0.9,
      });
      expect(result.success).toBe(false);
    });

    it("rejects more than 5 assessment questions", () => {
      const result = GeneratedCallIntelligenceSchema.safeParse({
        caseContextSummary: "Test case",
        assessmentQuestions: [
          { question: "Question 1?" },
          { question: "Question 2?" },
          { question: "Question 3?" },
          { question: "Question 4?" },
          { question: "Question 5?" },
          { question: "Question 6?" },
        ],
        warningSignsToMonitor: [],
        normalExpectations: [],
        emergencyCriteria: [],
        shouldAskClinicalQuestions: true,
        callApproach: "detailed-monitoring",
        confidence: 0.9,
      });
      expect(result.success).toBe(false);
    });

    it("rejects more than 5 warning signs", () => {
      const result = GeneratedCallIntelligenceSchema.safeParse({
        caseContextSummary: "Test case",
        assessmentQuestions: [{ question: "How is your pet?" }],
        warningSignsToMonitor: [
          "Sign 1",
          "Sign 2",
          "Sign 3",
          "Sign 4",
          "Sign 5",
          "Sign 6",
        ],
        normalExpectations: [],
        emergencyCriteria: [],
        shouldAskClinicalQuestions: true,
        callApproach: "standard-assessment",
        confidence: 0.9,
      });
      expect(result.success).toBe(false);
    });

    it("rejects more than 4 normal expectations", () => {
      const result = GeneratedCallIntelligenceSchema.safeParse({
        caseContextSummary: "Test case",
        assessmentQuestions: [{ question: "How is your pet?" }],
        warningSignsToMonitor: [],
        normalExpectations: [
          "Expectation 1",
          "Expectation 2",
          "Expectation 3",
          "Expectation 4",
          "Expectation 5",
        ],
        emergencyCriteria: [],
        shouldAskClinicalQuestions: true,
        callApproach: "standard-assessment",
        confidence: 0.9,
      });
      expect(result.success).toBe(false);
    });

    it("rejects more than 4 emergency criteria", () => {
      const result = GeneratedCallIntelligenceSchema.safeParse({
        caseContextSummary: "Test case",
        assessmentQuestions: [{ question: "How is your pet?" }],
        warningSignsToMonitor: [],
        normalExpectations: [],
        emergencyCriteria: [
          "Criteria 1",
          "Criteria 2",
          "Criteria 3",
          "Criteria 4",
          "Criteria 5",
        ],
        shouldAskClinicalQuestions: true,
        callApproach: "standard-assessment",
        confidence: 0.9,
      });
      expect(result.success).toBe(false);
    });

    it("rejects confidence > 1", () => {
      const result = GeneratedCallIntelligenceSchema.safeParse({
        caseContextSummary: "Test case",
        assessmentQuestions: [{ question: "How is your pet?" }],
        warningSignsToMonitor: [],
        normalExpectations: [],
        emergencyCriteria: [],
        shouldAskClinicalQuestions: true,
        callApproach: "standard-assessment",
        confidence: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects confidence < 0", () => {
      const result = GeneratedCallIntelligenceSchema.safeParse({
        caseContextSummary: "Test case",
        assessmentQuestions: [{ question: "How is your pet?" }],
        warningSignsToMonitor: [],
        normalExpectations: [],
        emergencyCriteria: [],
        shouldAskClinicalQuestions: true,
        callApproach: "standard-assessment",
        confidence: -0.1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid callApproach", () => {
      const result = GeneratedCallIntelligenceSchema.safeParse({
        caseContextSummary: "Test case",
        assessmentQuestions: [{ question: "How is your pet?" }],
        warningSignsToMonitor: [],
        normalExpectations: [],
        emergencyCriteria: [],
        shouldAskClinicalQuestions: true,
        callApproach: "invalid-approach",
        confidence: 0.9,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      const result = GeneratedCallIntelligenceSchema.safeParse({
        caseContextSummary: "Test case",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("GenerateCallIntelligenceInputSchema", () => {
  describe("valid inputs", () => {
    it("accepts complete input data", () => {
      const validInput = {
        petName: "Max",
        species: "dog",
        breed: "Labrador",
        age: "3 years",
        diagnosis: "Ear infection",
        diagnoses: ["Bilateral otitis externa", "Allergies"],
        medications: [
          {
            name: "Otomax",
            dosage: "2 drops",
            frequency: "twice daily",
            duration: "10 days",
          },
        ],
        procedures: ["Ear cleaning", "Otoscopic exam"],
        treatments: ["Anti-inflammatory injection"],
        visitReason: "Follow-up for ear infection",
        chiefComplaint: "Shaking head and scratching ears",
        presentingSymptoms: ["Head shaking", "Scratching", "Odor"],
        soapContent: "Subjective: Owner reports...",
        followUpInstructions: "Continue medication for full 10 days",
        conditionCategory: "Dermatology",
      };
      const result = GenerateCallIntelligenceInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("accepts minimal input (only petName)", () => {
      const result = GenerateCallIntelligenceInputSchema.safeParse({
        petName: "Buddy",
      });
      expect(result.success).toBe(true);
    });

    it("accepts medications without all fields", () => {
      const result = GenerateCallIntelligenceInputSchema.safeParse({
        petName: "Max",
        medications: [
          {
            name: "Carprofen",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty arrays", () => {
      const result = GenerateCallIntelligenceInputSchema.safeParse({
        petName: "Max",
        diagnoses: [],
        medications: [],
        procedures: [],
        treatments: [],
        presentingSymptoms: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects missing petName", () => {
      const result = GenerateCallIntelligenceInputSchema.safeParse({
        species: "dog",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty petName", () => {
      const result = GenerateCallIntelligenceInputSchema.safeParse({
        petName: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects medication without name", () => {
      const result = GenerateCallIntelligenceInputSchema.safeParse({
        petName: "Max",
        medications: [
          {
            dosage: "10mg",
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid data types", () => {
      const result = GenerateCallIntelligenceInputSchema.safeParse({
        petName: "Max",
        diagnoses: "not an array",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles special characters in petName", () => {
      const result = GenerateCallIntelligenceInputSchema.safeParse({
        petName: "Mr. Whiskers O'Malley",
      });
      expect(result.success).toBe(true);
    });

    it("handles very long text fields", () => {
      const longText = "A".repeat(10000);
      const result = GenerateCallIntelligenceInputSchema.safeParse({
        petName: "Max",
        soapContent: longText,
        followUpInstructions: longText,
      });
      expect(result.success).toBe(true);
    });

    it("handles unicode characters", () => {
      const result = GenerateCallIntelligenceInputSchema.safeParse({
        petName: "雪球",
        species: "猫",
      });
      expect(result.success).toBe(true);
    });
  });
});
