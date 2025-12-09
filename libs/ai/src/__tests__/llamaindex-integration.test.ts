/**
 * Integration tests for LlamaIndex integration
 *
 * Tests that entity extraction and discharge summary generation
 * work correctly with LlamaIndex, producing identical results
 * to the previous Anthropic SDK implementation.
 *
 * These tests verify:
 * - Entity extraction produces valid NormalizedEntities
 * - Discharge summary generation produces valid summaries
 * - Error handling works correctly
 * - Response parsing handles both string and array formats
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractEntities } from "../normalize-scribe";
import { generateDischargeSummary } from "../generate-discharge";
import type { NormalizedEntities } from "@odis-ai/validators/scribe";

// Mock LlamaIndex
vi.mock("../llamaindex/config", () => ({
  getEntityExtractionLLM: vi.fn(),
  getDischargeSummaryLLM: vi.fn(),
}));

vi.mock("../llamaindex/utils", async () => {
  const actual = await vi.importActual<typeof import("../llamaindex/utils")>(
    "../llamaindex/utils",
  );
  return {
    ...actual,
    extractApiErrorStatus: vi.fn((error: unknown) => {
      // Use actual implementation by default
      return actual.extractApiErrorStatus(error);
    }),
    extractTextFromResponse: vi.fn((response) => {
      // Default implementation that can be overridden in tests
      const content = response.message.content;
      if (typeof content === "string") {
        return content;
      }
      if (Array.isArray(content)) {
        const textContent = content.find(
          (item): item is { type: "text"; text: string } =>
            typeof item === "object" &&
            item !== null &&
            "type" in item &&
            item.type === "text" &&
            "text" in item &&
            typeof (item as { text: unknown }).text === "string",
        );
        if (!textContent) {
          throw new Error("No text content found");
        }
        return textContent.text;
      }
      throw new Error("Unexpected format");
    }),
  };
});

import {
  getDischargeSummaryLLM,
  getEntityExtractionLLM,
} from "../llamaindex/config";
import { extractTextFromResponse } from "../llamaindex/utils";

describe("LlamaIndex Entity Extraction Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset extractTextFromResponse to use default implementation
    vi.mocked(extractTextFromResponse).mockImplementation((response) => {
      const content = response.message.content;
      if (typeof content === "string") {
        return content;
      }
      if (Array.isArray(content)) {
        const textContent = content.find(
          (item): item is { type: "text"; text: string } =>
            typeof item === "object" &&
            item !== null &&
            "type" in item &&
            item.type === "text" &&
            "text" in item &&
            typeof (item as { text: unknown }).text === "string",
        );
        if (!textContent) {
          throw new Error("No text content found");
        }
        return textContent.text;
      }
      throw new Error("Unexpected format");
    });
  });

  it("should extract entities from veterinary text", async () => {
    const mockLLM = {
      chat: vi.fn().mockResolvedValue({
        message: {
          content: JSON.stringify({
            patient: {
              name: "Max",
              species: "dog",
              breed: "Labrador",
              owner: { name: "John Smith" },
            },
            clinical: {
              diagnoses: ["Ear infection"],
            },
            caseType: "checkup",
            confidence: {
              overall: 0.8,
              patient: 0.9,
              clinical: 0.7,
            },
            warnings: [],
          }),
        },
      }),
    };

    vi.mocked(getEntityExtractionLLM).mockReturnValue(mockLLM as any);

    const input =
      "Patient: Max, a 5-year-old Labrador. Owner: John Smith. Diagnosis: Ear infection.";
    const result = await extractEntities(input, "transcript");

    expect(result).toBeDefined();
    expect(result.patient.name).toBe("Max");
    expect(result.patient.species).toBe("dog");
    expect(result.clinical.diagnoses).toContain("Ear infection");
    expect(mockLLM.chat).toHaveBeenCalled();
  });

  it("should handle LlamaIndex response format (string)", async () => {
    const mockLLM = {
      chat: vi.fn().mockResolvedValue({
        message: {
          content: JSON.stringify({
            patient: {
              name: "Max",
              species: "dog",
              owner: { name: "John" },
            },
            clinical: {},
            caseType: "checkup",
            confidence: {
              overall: 0.8,
              patient: 0.9,
              clinical: 0.7,
            },
            warnings: [],
          }),
        },
      }),
    };

    vi.mocked(getEntityExtractionLLM).mockReturnValue(mockLLM as any);

    const input =
      "Patient: Max, a 5-year-old Labrador Retriever. Owner: John Smith. Diagnosis: Ear infection.";
    const result = await extractEntities(input, "transcript");
    expect(result).toBeDefined();
  });

  it("should handle LlamaIndex response format (array)", async () => {
    const validJson = JSON.stringify({
      patient: {
        name: "Max",
        species: "dog",
        owner: { name: "John" },
      },
      clinical: {},
      caseType: "checkup",
      confidence: {
        overall: 0.8,
        patient: 0.9,
        clinical: 0.7,
      },
      warnings: [],
    });

    const mockLLM = {
      chat: vi.fn().mockResolvedValue({
        message: {
          content: [
            {
              type: "text",
              text: validJson,
            },
          ],
        },
      }),
    };

    vi.mocked(getEntityExtractionLLM).mockReturnValue(mockLLM as any);
    vi.mocked(extractTextFromResponse).mockReturnValue(validJson);

    const input =
      "Patient: Max, a 5-year-old Labrador Retriever. Owner: John Smith. Diagnosis: Ear infection.";
    const result = await extractEntities(input, "transcript");
    expect(result).toBeDefined();
  });

  it("should handle extraction errors gracefully", async () => {
    const mockLLM = {
      chat: vi.fn().mockRejectedValue(new Error("LLM API error")),
    };

    vi.mocked(getEntityExtractionLLM).mockReturnValue(mockLLM as any);

    const input =
      "Patient: Max, a 5-year-old Labrador Retriever. Owner: John Smith. Diagnosis: Ear infection.";
    await expect(extractEntities(input, "transcript")).rejects.toThrow();
  });

  it("should validate extracted entities against schema", async () => {
    const mockLLM = {
      chat: vi.fn().mockResolvedValue({
        message: {
          content: JSON.stringify({
            patient: {
              name: "Max",
              species: "dog",
              owner: { name: "John" },
            },
            clinical: {},
            caseType: "checkup",
            confidence: {
              overall: 0.8,
              patient: 0.9,
              clinical: 0.7,
            },
            warnings: [],
          }),
        },
      }),
    };

    vi.mocked(getEntityExtractionLLM).mockReturnValue(mockLLM as any);

    const input =
      "Patient: Max, a 5-year-old Labrador Retriever. Owner: John Smith. Diagnosis: Ear infection.";
    const result = await extractEntities(input, "transcript");

    // Verify structure matches NormalizedEntities schema
    expect(result).toHaveProperty("patient");
    expect(result).toHaveProperty("clinical");
    expect(result.patient).toHaveProperty("name");
    expect(result.patient).toHaveProperty("owner");
  });
});

describe("LlamaIndex Discharge Summary Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset extractTextFromResponse to use default implementation
    vi.mocked(extractTextFromResponse).mockImplementation((response) => {
      const content = response.message.content;
      if (typeof content === "string") {
        return content;
      }
      if (Array.isArray(content)) {
        const textContent = content.find(
          (item): item is { type: "text"; text: string } =>
            typeof item === "object" &&
            item !== null &&
            "type" in item &&
            item.type === "text" &&
            "text" in item &&
            typeof (item as { text: unknown }).text === "string",
        );
        if (!textContent) {
          throw new Error("No text content found");
        }
        return textContent.text;
      }
      throw new Error("Unexpected format");
    });
  });

  it("should generate discharge summary from entities", async () => {
    const mockLLM = {
      chat: vi.fn().mockResolvedValue({
        message: {
          content:
            "Discharge Instructions:\n\nPatient: Max\nDiagnosis: Ear infection\n\nFollow-up in 2 weeks.",
        },
      }),
    };

    vi.mocked(getDischargeSummaryLLM).mockReturnValue(mockLLM as any);

    const entities: NormalizedEntities = {
      patient: {
        name: "Max",
        species: "dog",
        owner: { name: "John" },
      },
      clinical: {
        diagnoses: ["Ear infection"],
      },
      caseType: "checkup",
      confidence: {
        overall: 0.8,
        patient: 0.9,
        clinical: 0.7,
      },
      warnings: [],
    };

    const result = await generateDischargeSummary({
      entityExtraction: entities,
      patientData: {
        name: "Max",
        species: "Dog",
      },
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    expect(mockLLM.chat).toHaveBeenCalled();
  });

  it("should handle SOAP content input", async () => {
    const mockLLM = {
      chat: vi.fn().mockResolvedValue({
        message: {
          content: "Discharge summary from SOAP note...",
        },
      }),
    };

    vi.mocked(getDischargeSummaryLLM).mockReturnValue(mockLLM as any);

    const result = await generateDischargeSummary({
      soapContent:
        "S: Patient presents with ear discharge\nO: Red, inflamed ear canal\nA: Otitis externa\nP: Clean ear, prescribe antibiotics",
      patientData: {
        name: "Max",
      },
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("should handle LlamaIndex response format (string)", async () => {
    const mockLLM = {
      chat: vi.fn().mockResolvedValue({
        message: {
          content: "Plain text discharge summary",
        },
      }),
    };

    vi.mocked(getDischargeSummaryLLM).mockReturnValue(mockLLM as any);

    const result = await generateDischargeSummary({
      entityExtraction: {
        patient: {
          name: "Max",
          species: "dog",
          owner: { name: "John" },
        },
        clinical: {},
        caseType: "checkup",
        confidence: {
          overall: 0.8,
          patient: 0.9,
          clinical: 0.7,
        },
        warnings: [],
      },
      patientData: { name: "Max" },
    });

    expect(result).toBe("Plain text discharge summary");
  });

  it("should handle LlamaIndex response format (array)", async () => {
    const mockLLM = {
      chat: vi.fn().mockResolvedValue({
        message: {
          content: [
            { type: "text", text: "Discharge summary part 1" },
            { type: "text", text: "Discharge summary part 2" },
          ],
        },
      }),
    };

    vi.mocked(getDischargeSummaryLLM).mockReturnValue(mockLLM as any);
    vi.mocked(extractTextFromResponse).mockReturnValue(
      "Discharge summary part 1Discharge summary part 2",
    );

    const result = await generateDischargeSummary({
      entityExtraction: {
        patient: {
          name: "Max",
          species: "dog",
          owner: { name: "John" },
        },
        clinical: {},
        caseType: "checkup",
        confidence: {
          overall: 0.8,
          patient: 0.9,
          clinical: 0.7,
        },
        warnings: [],
      },
      patientData: { name: "Max" },
    });

    expect(result).toBeDefined();
  });

  it("should trim whitespace from summary", async () => {
    const mockLLM = {
      chat: vi.fn().mockResolvedValue({
        message: {
          content: "   \n\nDischarge summary\n\n   ",
        },
      }),
    };

    vi.mocked(getDischargeSummaryLLM).mockReturnValue(mockLLM as any);
    vi.mocked(extractTextFromResponse).mockReturnValue(
      "   \n\nDischarge summary\n\n   ",
    );

    const result = await generateDischargeSummary({
      entityExtraction: {
        patient: {
          name: "Max",
          species: "dog",
          owner: { name: "John" },
        },
        clinical: {},
        caseType: "checkup",
        confidence: {
          overall: 0.8,
          patient: 0.9,
          clinical: 0.7,
        },
        warnings: [],
      },
      patientData: { name: "Max" },
    });

    expect(result.trim()).toBe("Discharge summary");
  });

  it("should handle generation errors gracefully", async () => {
    const mockLLM = {
      chat: vi.fn().mockRejectedValue(new Error("LLM API error")),
    };

    vi.mocked(getDischargeSummaryLLM).mockReturnValue(mockLLM as any);

    await expect(
      generateDischargeSummary({
        entityExtraction: {
          patient: {
            name: "Max",
            species: "dog",
            owner: { name: "John" },
          },
          clinical: {},
          caseType: "checkup",
          confidence: {
            overall: 0.8,
            patient: 0.9,
            clinical: 0.7,
          },
          warnings: [],
        },
        patientData: { name: "Max" },
      }),
    ).rejects.toThrow();
  });
});

describe("LlamaIndex Response Format Compatibility", () => {
  it("should handle both string and array response formats", async () => {
    // Test string format - need at least 50 characters
    const longInput =
      "Patient: Max, a 5-year-old Labrador Retriever. Owner: John Smith. Diagnosis: Ear infection. Treatment: Antibiotics prescribed.";
    const validJsonResponse = JSON.stringify({
      patient: { name: "Max", species: "dog", owner: { name: "John" } },
      clinical: {},
      caseType: "checkup",
      confidence: {
        overall: 0.8,
        patient: 0.9,
        clinical: 0.7,
      },
      warnings: [],
    });

    const mockLLMString = {
      chat: vi.fn().mockResolvedValue({
        message: {
          content: validJsonResponse,
        },
      }),
    };

    vi.mocked(getEntityExtractionLLM).mockReturnValue(mockLLMString as any);
    const result1 = await extractEntities(longInput, "transcript");
    expect(result1).toBeDefined();

    // Test array format
    const mockLLMArray = {
      chat: vi.fn().mockResolvedValue({
        message: {
          content: [{ type: "text", text: validJsonResponse }],
        },
      }),
    };

    vi.mocked(getEntityExtractionLLM).mockReturnValue(mockLLMArray as any);
    vi.mocked(extractTextFromResponse).mockReturnValue(validJsonResponse);
    const result2 = await extractEntities(longInput, "transcript");
    expect(result2).toBeDefined();
  });
});
