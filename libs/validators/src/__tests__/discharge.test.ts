/**
 * Tests for Discharge Email Validation Schemas
 */

import { describe, it, expect } from "vitest";
import {
  generateEmailSchema,
  sendEmailSchema,
  generateSummarySchema,
} from "../discharge";

describe("generateEmailSchema", () => {
  describe("valid inputs", () => {
    it("accepts valid case ID", () => {
      const result = generateEmailSchema.safeParse({
        caseId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("accepts case ID with discharge summary ID", () => {
      const result = generateEmailSchema.safeParse({
        caseId: "123e4567-e89b-12d3-a456-426614174000",
        dischargeSummaryId: "123e4567-e89b-12d3-a456-426614174001",
      });
      expect(result.success).toBe(true);
    });

    it("accepts without discharge summary ID (optional)", () => {
      const result = generateEmailSchema.safeParse({
        caseId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dischargeSummaryId).toBeUndefined();
      }
    });
  });

  describe("invalid inputs", () => {
    it("rejects invalid case ID format", () => {
      const result = generateEmailSchema.safeParse({
        caseId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain("Invalid case ID");
      }
    });

    it("rejects invalid discharge summary ID format", () => {
      const result = generateEmailSchema.safeParse({
        caseId: "123e4567-e89b-12d3-a456-426614174000",
        dischargeSummaryId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain(
          "Invalid discharge summary ID",
        );
      }
    });

    it("rejects missing case ID", () => {
      const result = generateEmailSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects empty case ID", () => {
      const result = generateEmailSchema.safeParse({
        caseId: "",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("sendEmailSchema", () => {
  describe("valid inputs", () => {
    it("accepts complete email data", () => {
      const validData = {
        caseId: "123e4567-e89b-12d3-a456-426614174000",
        recipientEmail: "owner@example.com",
        recipientName: "John Doe",
        subject: "Discharge Instructions for Max",
        htmlContent: "<p>Discharge instructions here</p>",
        textContent: "Discharge instructions here",
        scheduledFor: new Date("2024-02-01T10:00:00Z"),
        metadata: { source: "dashboard" },
      };
      const result = sendEmailSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("accepts without optional fields", () => {
      const result = sendEmailSchema.safeParse({
        subject: "Test Subject",
        htmlContent: "<p>Test content</p>",
        scheduledFor: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("coerces date string to Date object", () => {
      const result = sendEmailSchema.safeParse({
        subject: "Test",
        htmlContent: "<p>Test</p>",
        scheduledFor: "2024-02-01T10:00:00Z",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scheduledFor).toBeInstanceOf(Date);
      }
    });

    it("accepts timestamp for scheduledFor", () => {
      const timestamp = Date.now();
      const result = sendEmailSchema.safeParse({
        subject: "Test",
        htmlContent: "<p>Test</p>",
        scheduledFor: timestamp,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects invalid email format", () => {
      const result = sendEmailSchema.safeParse({
        recipientEmail: "not-an-email",
        subject: "Test",
        htmlContent: "<p>Test</p>",
        scheduledFor: new Date(),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain("Invalid email");
      }
    });

    it("rejects empty subject", () => {
      const result = sendEmailSchema.safeParse({
        subject: "",
        htmlContent: "<p>Test</p>",
        scheduledFor: new Date(),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain(
          "Subject is required",
        );
      }
    });

    it("rejects empty HTML content", () => {
      const result = sendEmailSchema.safeParse({
        subject: "Test",
        htmlContent: "",
        scheduledFor: new Date(),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain(
          "HTML content is required",
        );
      }
    });

    it("rejects missing scheduledFor", () => {
      const result = sendEmailSchema.safeParse({
        subject: "Test",
        htmlContent: "<p>Test</p>",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain(
          "Scheduled time is required",
        );
      }
    });

    it("rejects invalid date format", () => {
      const result = sendEmailSchema.safeParse({
        subject: "Test",
        htmlContent: "<p>Test</p>",
        scheduledFor: "not-a-date",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain("Invalid date");
      }
    });

    it("rejects invalid case ID UUID", () => {
      const result = sendEmailSchema.safeParse({
        caseId: "not-a-uuid",
        subject: "Test",
        htmlContent: "<p>Test</p>",
        scheduledFor: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty recipient name when provided", () => {
      const result = sendEmailSchema.safeParse({
        recipientName: "",
        subject: "Test",
        htmlContent: "<p>Test</p>",
        scheduledFor: new Date(),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("accepts very long subject", () => {
      const longSubject = "A".repeat(1000);
      const result = sendEmailSchema.safeParse({
        subject: longSubject,
        htmlContent: "<p>Test</p>",
        scheduledFor: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("accepts very long HTML content", () => {
      const longContent = "<p>" + "A".repeat(100000) + "</p>";
      const result = sendEmailSchema.safeParse({
        subject: "Test",
        htmlContent: longContent,
        scheduledFor: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("accepts complex metadata", () => {
      const result = sendEmailSchema.safeParse({
        subject: "Test",
        htmlContent: "<p>Test</p>",
        scheduledFor: new Date(),
        metadata: {
          nested: {
            deep: {
              value: "test",
            },
          },
          array: [1, 2, 3],
          null: null,
        },
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("generateSummarySchema", () => {
  describe("valid inputs", () => {
    it("accepts minimal valid input", () => {
      const result = generateSummarySchema.safeParse({
        caseId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("accepts with all optional fields", () => {
      const validData = {
        caseId: "123e4567-e89b-12d3-a456-426614174000",
        soapNoteId: "123e4567-e89b-12d3-a456-426614174001",
        templateId: "123e4567-e89b-12d3-a456-426614174002",
        ownerPhone: "+15551234567",
        vapiScheduledFor: new Date("2024-02-01T15:00:00Z"),
        vapiVariables: {
          petName: "Max",
          ownerName: "John",
        },
      };
      const result = generateSummarySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("accepts without VAPI scheduling fields", () => {
      const result = generateSummarySchema.safeParse({
        caseId: "123e4567-e89b-12d3-a456-426614174000",
        soapNoteId: "123e4567-e89b-12d3-a456-426614174001",
      });
      expect(result.success).toBe(true);
    });

    it("coerces date string for vapiScheduledFor", () => {
      const result = generateSummarySchema.safeParse({
        caseId: "123e4567-e89b-12d3-a456-426614174000",
        vapiScheduledFor: "2024-02-01T15:00:00Z",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.vapiScheduledFor).toBeInstanceOf(Date);
      }
    });

    it("accepts various phone number formats", () => {
      const phoneFormats = [
        "+15551234567",
        "5551234567",
        "(555) 123-4567",
        "555-123-4567",
      ];
      phoneFormats.forEach((phone) => {
        const result = generateSummarySchema.safeParse({
          caseId: "123e4567-e89b-12d3-a456-426614174000",
          ownerPhone: phone,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("invalid inputs", () => {
    it("rejects missing case ID", () => {
      const result = generateSummarySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects invalid case ID UUID", () => {
      const result = generateSummarySchema.safeParse({
        caseId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain("Invalid case ID");
      }
    });

    it("rejects invalid SOAP note ID UUID", () => {
      const result = generateSummarySchema.safeParse({
        caseId: "123e4567-e89b-12d3-a456-426614174000",
        soapNoteId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain(
          "Invalid SOAP note ID",
        );
      }
    });

    it("rejects invalid template ID UUID", () => {
      const result = generateSummarySchema.safeParse({
        caseId: "123e4567-e89b-12d3-a456-426614174000",
        templateId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain(
          "Invalid template ID",
        );
      }
    });

    it("rejects invalid date for vapiScheduledFor", () => {
      const result = generateSummarySchema.safeParse({
        caseId: "123e4567-e89b-12d3-a456-426614174000",
        vapiScheduledFor: "not-a-date",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.message).toContain("Invalid date");
      }
    });

    it("rejects empty case ID", () => {
      const result = generateSummarySchema.safeParse({
        caseId: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("accepts complex vapiVariables", () => {
      const result = generateSummarySchema.safeParse({
        caseId: "123e4567-e89b-12d3-a456-426614174000",
        vapiVariables: {
          petName: "Max",
          medications: ["Med1", "Med2"],
          nested: {
            value: "test",
          },
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts timestamp for vapiScheduledFor", () => {
      const result = generateSummarySchema.safeParse({
        caseId: "123e4567-e89b-12d3-a456-426614174000",
        vapiScheduledFor: Date.now(),
      });
      expect(result.success).toBe(true);
    });

    it("accepts international phone numbers", () => {
      const result = generateSummarySchema.safeParse({
        caseId: "123e4567-e89b-12d3-a456-426614174000",
        ownerPhone: "+44 20 7123 4567",
      });
      expect(result.success).toBe(true);
    });
  });
});
