/**
 * Tests for phone.ts utilities
 * - formatPhoneNumber: E.164 to readable format
 * - normalizePhoneNumber: Any format to E.164
 * - normalizeToE164: Canonical E.164 normalization
 * - normalizeEmail: Email normalization
 */

import { describe, it, expect } from "vitest";
import {
  formatPhoneNumber,
  normalizePhoneNumber,
  normalizeToE164,
  normalizeEmail,
} from "../phone";

describe("formatPhoneNumber", () => {
  describe("US/Canada numbers (E.164 format)", () => {
    it("formats 11-digit US number starting with 1", () => {
      expect(formatPhoneNumber("+14155551234")).toBe("+1 (415) 555-1234");
    });

    it("formats another US number", () => {
      expect(formatPhoneNumber("+12137774445")).toBe("+1 (213) 777-4445");
    });

    it("handles number without + prefix", () => {
      // 11-digit number starting with 1 is formatted as US number
      const result = formatPhoneNumber("14155551234");
      expect(result).toBe("+1 (415) 555-1234");
    });
  });

  describe("non-US numbers", () => {
    it("returns UK number as-is", () => {
      expect(formatPhoneNumber("+442071234567")).toBe("+442071234567");
    });

    it("returns international number as-is", () => {
      expect(formatPhoneNumber("+33123456789")).toBe("+33123456789");
    });
  });

  describe("null/empty handling", () => {
    it("returns N/A for null", () => {
      expect(formatPhoneNumber(null)).toBe("N/A");
    });

    it("returns N/A for empty string", () => {
      expect(formatPhoneNumber("")).toBe("N/A");
    });
  });
});

describe("normalizePhoneNumber", () => {
  describe("valid US numbers", () => {
    it("normalizes 10-digit number", () => {
      expect(normalizePhoneNumber("4155551234")).toBe("+14155551234");
    });

    it("normalizes 11-digit number with 1 prefix", () => {
      expect(normalizePhoneNumber("14155551234")).toBe("+14155551234");
    });

    it("preserves E.164 format", () => {
      expect(normalizePhoneNumber("+14155551234")).toBe("+14155551234");
    });
  });

  describe("formatted numbers", () => {
    it("removes parentheses", () => {
      expect(normalizePhoneNumber("(415) 555-1234")).toBe("+14155551234");
    });

    it("removes dashes", () => {
      expect(normalizePhoneNumber("415-555-1234")).toBe("+14155551234");
    });

    it("removes spaces", () => {
      expect(normalizePhoneNumber("415 555 1234")).toBe("+14155551234");
    });

    it("removes dots", () => {
      expect(normalizePhoneNumber("415.555.1234")).toBe("+14155551234");
    });

    it("handles mixed formatting", () => {
      expect(normalizePhoneNumber("(415) 555-1234")).toBe("+14155551234");
    });
  });

  describe("international numbers", () => {
    it("handles international number with +", () => {
      expect(normalizePhoneNumber("+442071234567")).toBe("+442071234567");
    });
  });

  describe("null/empty handling", () => {
    it("returns null for null input", () => {
      expect(normalizePhoneNumber(null)).toBeNull();
    });

    it("returns null for undefined input", () => {
      expect(normalizePhoneNumber(undefined)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(normalizePhoneNumber("")).toBeNull();
    });

    it("returns null for whitespace only", () => {
      expect(normalizePhoneNumber("   ")).toBeNull();
    });

    it("returns null for non-digit string", () => {
      expect(normalizePhoneNumber("abc")).toBeNull();
    });
  });
});

describe("normalizeToE164", () => {
  describe("US numbers", () => {
    it("normalizes 10-digit US number", () => {
      expect(normalizeToE164("2137774445")).toBe("+12137774445");
    });

    it("normalizes 11-digit US number starting with 1", () => {
      expect(normalizeToE164("12137774445")).toBe("+12137774445");
    });

    it("normalizes formatted US number", () => {
      expect(normalizeToE164("(213) 777-4445")).toBe("+12137774445");
    });

    it("normalizes US number with + prefix", () => {
      expect(normalizeToE164("+1 213-777-4445")).toBe("+12137774445");
    });

    it("handles US number with country code spaces", () => {
      expect(normalizeToE164("+1 (213) 777-4445")).toBe("+12137774445");
    });
  });

  describe("international numbers", () => {
    it("normalizes UK number with +", () => {
      expect(normalizeToE164("+44 20 7123 4567")).toBe("+442071234567");
    });

    it("normalizes number already in E.164", () => {
      expect(normalizeToE164("+33123456789")).toBe("+33123456789");
    });
  });

  describe("edge cases", () => {
    it("returns null for null input", () => {
      expect(normalizeToE164(null)).toBeNull();
    });

    it("returns null for undefined input", () => {
      expect(normalizeToE164(undefined)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(normalizeToE164("")).toBeNull();
    });

    it("returns null for whitespace only", () => {
      expect(normalizeToE164("   ")).toBeNull();
    });

    it("returns null for no digits", () => {
      expect(normalizeToE164("abc")).toBeNull();
    });

    it("handles single digit", () => {
      expect(normalizeToE164("1")).toBe("+1");
    });

    it("handles max E.164 length (15 digits)", () => {
      expect(normalizeToE164("123456789012345")).toBe("+123456789012345");
    });

    it("returns null for too many digits (>15)", () => {
      expect(normalizeToE164("1234567890123456")).toBeNull();
    });
  });

  describe("common input formats", () => {
    const testCases = [
      { input: "(213) 777-4445", expected: "+12137774445" },
      { input: "12137774445", expected: "+12137774445" },
      { input: "+1 213-777-4445", expected: "+12137774445" },
      { input: "2137774445", expected: "+12137774445" },
      { input: "213.777.4445", expected: "+12137774445" },
      { input: "213 777 4445", expected: "+12137774445" },
    ];

    testCases.forEach(({ input, expected }) => {
      it(`normalizes "${input}" to "${expected}"`, () => {
        expect(normalizeToE164(input)).toBe(expected);
      });
    });
  });
});

describe("normalizeEmail", () => {
  describe("valid emails", () => {
    it("lowercases email", () => {
      expect(normalizeEmail("John.Doe@Example.COM")).toBe(
        "john.doe@example.com",
      );
    });

    it("trims whitespace", () => {
      expect(normalizeEmail("  john@example.com  ")).toBe("john@example.com");
    });

    it("handles simple email", () => {
      expect(normalizeEmail("user@domain.com")).toBe("user@domain.com");
    });

    it("handles email with subdomain", () => {
      expect(normalizeEmail("user@mail.domain.com")).toBe(
        "user@mail.domain.com",
      );
    });

    it("handles email with plus sign", () => {
      expect(normalizeEmail("user+tag@domain.com")).toBe("user+tag@domain.com");
    });

    it("handles email with dots in local part", () => {
      expect(normalizeEmail("john.doe@domain.com")).toBe("john.doe@domain.com");
    });
  });

  describe("invalid emails", () => {
    it("returns null for null input", () => {
      expect(normalizeEmail(null)).toBeNull();
    });

    it("returns null for undefined input", () => {
      expect(normalizeEmail(undefined)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(normalizeEmail("")).toBeNull();
    });

    it("returns null for whitespace only", () => {
      expect(normalizeEmail("   ")).toBeNull();
    });

    it("returns null for missing @", () => {
      expect(normalizeEmail("notanemail")).toBeNull();
    });

    it("returns null for missing domain", () => {
      expect(normalizeEmail("user@")).toBeNull();
    });

    it("returns null for missing local part", () => {
      expect(normalizeEmail("@domain.com")).toBeNull();
    });

    it("returns null for missing TLD", () => {
      expect(normalizeEmail("user@domain")).toBeNull();
    });

    it("returns null for spaces in email", () => {
      expect(normalizeEmail("user name@domain.com")).toBeNull();
    });

    it("returns null for multiple @", () => {
      expect(normalizeEmail("user@@domain.com")).toBeNull();
    });
  });
});
