/**
 * Tests for phone-formatting.ts utilities
 *
 * This is a practice test file to learn Vitest!
 * Some tests are complete, some are incomplete (marked with TODO)
 *
 * To run these tests:
 * - pnpm test phone-formatting
 * - pnpm test:watch phone-formatting (watch mode)
 * - pnpm test:ui (interactive UI)
 */

import { describe, it, expect } from "vitest";
import {
  formatPhoneNumberDisplay,
  formatPhoneCompact,
  formatPhoneShort,
  isValidE164,
  toE164,
  getCountryCode,
  isUSNumber,
  // NEW: Messy data handling functions
  extractPhoneNumber,
  parsePhoneFromText,
  hasValidPhone,
  extractPhoneWithDetails,
  type PhoneExtractionResult,
} from "../phone-formatting";

/**
 * Test Structure:
 *
 * describe() - Groups related tests together
 * it() - Individual test case
 * expect() - Assertion to check if result matches expected value
 *
 * Common matchers:
 * - .toBe() - For primitives (strings, numbers, booleans)
 * - .toEqual() - For objects/arrays
 * - .toBeNull() - Checks if value is null
 * - .toBeTruthy() - Checks if value is truthy
 * - .toBeFalsy() - Checks if value is falsy
 */

describe("formatPhoneNumberDisplay", () => {
  describe("US phone numbers", () => {
    // ✅ COMPLETE EXAMPLE - Study this pattern!
    it("formats US number with +1 country code", () => {
      const input = "+12137774445";
      const expected = "(213) 777-4445";
      const result = formatPhoneNumberDisplay(input);

      expect(result).toBe(expected);
    });

    // TODO: Write a test for US number without +1 prefix
    // Example: "2137774445" should return "(213) 777-4445"
    it("formats US number without country code", () => {
      const input = "2137774445";
      const expected = "(213) 777-4445";
      const result = formatPhoneNumberDisplay(input);

      expect(result).toBe(expected);
    });

    // TODO: Write a test for US number with formatting characters
    // Example: "(213) 777-4445" should return "(213) 777-4445"
    it("handles US number with existing formatting", () => {
      const input = "(213) 777-4445";
      const expected = "(213) 777-4445";
      const result = formatPhoneNumberDisplay(input);

      expect(result).toBe(expected);
    });

    // TODO: Write a test for US number with dashes
    // Example: "213-777-4445" should return "(213) 777-4445"
    it("handles US number with dashes", () => {
      const input = "213-777-4445";
      const expected = "(213) 777-4445";
      const result = formatPhoneNumberDisplay(input);

      expect(result).toBe(expected);
    });
  });

  describe("international phone numbers", () => {
    // TODO: Write a test for UK number
    // Example: "+442071234567" should return "+44 207 123 4567" (or similar)
    it("formats UK number", () => {
      const input = "+442071234567";
      const expected = "+44 20 7123 4567";
    });

    // TODO: Write a test for a number with a different country code
    // Try any international format you like!
    it("formats international number with spacing", () => {
      // Your test here!
    });
  });

  describe("edge cases", () => {
    // TODO: What should happen with an empty string?
    it("handles empty string", () => {
      // Your test here!
    });

    // TODO: What about a string with only letters?
    it("handles non-numeric input", () => {
      // Your test here!
    });
  });
});

describe("formatPhoneCompact", () => {
  // ✅ COMPLETE EXAMPLE
  // Note: This function only removes formatting, it doesn't add country code
  it("removes all formatting characters", () => {
    expect(formatPhoneCompact("(213) 777-4445")).toBe("2137774445");
  });

  // TODO: Test with spaces
  it("removes spaces", () => {
    // Your test here!
  });

  // TODO: Test with only numbers
  it("preserves plain numbers", () => {
    // Your test here!
  });
});

describe("formatPhoneShort", () => {
  // ✅ COMPLETE EXAMPLE
  it("shows last 4 digits for US number", () => {
    expect(formatPhoneShort("+12137774445")).toBe("•••• 4445");
  });

  // TODO: What happens with a short number (less than 4 digits)?
  it("handles short numbers", () => {
    // Your test here!
  });

  // TODO: Test with formatted input
  it("handles formatted input", () => {
    // Your test here!
  });
});

describe("isValidE164", () => {
  // ✅ COMPLETE EXAMPLE
  it("returns true for valid E.164 format", () => {
    expect(isValidE164("+12137774445")).toBe(true);
  });

  // TODO: Test invalid formats
  it("returns false for number without + prefix", () => {
    // Your test here! Try "2137774445"
  });

  it("returns false for number with letters", () => {
    // Your test here!
  });

  it("returns false for empty string", () => {
    // Your test here!
  });

  // TODO: Test boundary cases
  it("returns false for number that's too short", () => {
    // Your test here! E.164 requires at least 2 digits after country code
  });

  it("returns false for number that's too long", () => {
    // Your test here! E.164 allows max 15 digits total
  });
});

describe("toE164", () => {
  // ✅ COMPLETE EXAMPLE
  it("converts 10-digit US number to E.164", () => {
    expect(toE164("2137774445")).toBe("+12137774445");
  });

  // TODO: Test 11-digit US number (with leading 1)
  it("converts 11-digit US number with leading 1", () => {
    // Your test here! "12137774445" should become "+12137774445"
  });

  // TODO: Test formatted US number
  it("converts formatted US number", () => {
    // Your test here! "(213) 777-4445" should become "+12137774445"
  });

  // TODO: Test already valid E.164
  it("returns E.164 number as-is", () => {
    // Your test here! "+12137774445" should stay "+12137774445"
  });

  // TODO: Test invalid inputs - what should return null?
  it("returns null for invalid short number", () => {
    // Your test here! Try "123" - should return null
  });

  it("returns null for invalid long number", () => {
    // Your test here!
  });
});

describe("getCountryCode", () => {
  // ✅ COMPLETE EXAMPLE
  // Note: This function extracts up to 3 digits greedily after +
  // For 3-digit country codes like +351 (Portugal), it works correctly
  it("extracts 3-digit country code", () => {
    expect(getCountryCode("+351912345678")).toBe("+351");
  });

  // TODO: Test with a shorter country code (notice the limitation!)
  it("extracts digits from UK number (note: has a bug with 2-digit codes)", () => {
    // Try this and see what happens! "+442071234567"
    // The regex extracts 1-3 digits greedily, so it returns "+442" not "+44"
    // This is a known limitation of this function
  });

  // TODO: Test number without country code
  it("returns null for number without + prefix", () => {
    // Your test here!
  });

  // TODO: Test empty string
  it("returns null for empty string", () => {
    // Your test here!
  });
});

describe("isUSNumber", () => {
  // Note: This function has a limitation due to getCountryCode's greedy extraction
  // For reliable US number detection, use parsePhoneFromText() instead!

  // ✅ COMPLETE EXAMPLE - Testing with number that clearly has non-US code
  it("returns false for UK number", () => {
    expect(isUSNumber("+442071234567")).toBe(false);
  });

  // TODO: Test number without country code
  it("returns false for number without country code", () => {
    // Your test here! "2137774445" should return false (no + prefix)
  });

  // TODO: Explore the limitation - what happens with US numbers?
  it("has a known issue with US numbers due to greedy regex", () => {
    // Try: isUSNumber("+12137774445")
    // You might expect true, but due to getCountryCode extracting "+121"
    // it actually returns false!
    //
    // This is a great example of why tests are important - they help
    // you discover bugs in your code!
  });
});

// =============================================================================
// MESSY DATA HANDLING TESTS
// These are the most important tests for real-world discharge phone numbers!
// =============================================================================

describe("extractPhoneNumber", () => {
  describe("clean phone numbers", () => {
    // ✅ COMPLETE EXAMPLE
    it("extracts 10 consecutive digits", () => {
      expect(extractPhoneNumber("9258958479")).toBe("9258958479");
    });

    // TODO: Test with dashes
    it("extracts phone with dashes", () => {
      // Your test here! "925-895-8479" should return "9258958479"
    });

    // TODO: Test with parentheses
    it("extracts phone with parentheses", () => {
      // Your test here! "(925) 895-8479" should return "9258958479"
    });

    // TODO: Test with dots
    it("extracts phone with dots", () => {
      // Your test here! "925.895.8479" should return "9258958479"
    });
  });

  describe("phone numbers with extra text - REAL IDEXX DATA! 🏥", () => {
    // ✅ COMPLETE EXAMPLE - This is exactly what comes from IDEXX!
    it("extracts phone from 'NUMBER BEST!'", () => {
      const messyInput = "9258958479 BEST!";
      const result = extractPhoneNumber(messyInput);
      expect(result).toBe("9258958479");
    });

    // TODO: Test "NEW" prefix (common in IDEXX)
    it("extracts phone from 'NEW NUMBER'", () => {
      // Your test here! "NEW 925-346-1245" should return "9253461245"
    });

    // TODO: Test "Home:" prefix
    it("extracts phone from 'Home: NUMBER'", () => {
      // Your test here! "Home: (925) 555-1234" should return "9255551234"
    });

    // TODO: Test "cell" suffix
    it("extracts phone from 'NUMBER cell'", () => {
      // Your test here! "925.555.1234 cell" should return "9255551234"
    });

    // TODO: Test "CALL FIRST" prefix
    it("extracts phone from 'CALL FIRST NUMBER'", () => {
      // Your test here! "CALL FIRST 925-555-1234" should return "9255551234"
    });

    // TODO: Test with country code prefix
    it("extracts phone with country code prefix", () => {
      // Your test here! "1-925-555-1234" should return "9255551234"
    });

    // TODO: Test with +1 prefix
    it("extracts phone with +1 prefix", () => {
      // Your test here! "+1 925-555-1234" should return "9255551234"
    });
  });

  describe("invalid inputs", () => {
    // ✅ COMPLETE EXAMPLE
    it("returns null for text without phone number", () => {
      expect(extractPhoneNumber("Call mom")).toBeNull();
    });

    // TODO: Test empty string
    it("returns null for empty string", () => {
      // Your test here!
    });

    // TODO: Test null/undefined
    it("returns null for null input", () => {
      // Your test here! extractPhoneNumber(null as any) should return null
    });

    // TODO: Test too few digits
    it("returns null for partial phone number", () => {
      // Your test here! "925-555" should return null (not enough digits)
    });

    // TODO: Test invalid area code starting with 0
    it("returns null for invalid area code starting with 0", () => {
      // Your test here! "025-555-1234" is invalid (area codes can't start with 0)
    });

    // TODO: Test invalid area code starting with 1
    it("returns null for invalid area code starting with 1", () => {
      // Your test here! "125-555-1234" is invalid (area codes can't start with 1)
    });
  });
});

describe("parsePhoneFromText", () => {
  describe("successful parsing", () => {
    // ✅ COMPLETE EXAMPLE - This is the main function for discharge calls!
    it("parses messy IDEXX data to E.164", () => {
      const messyInput = "9258958479 BEST!";
      const result = parsePhoneFromText(messyInput);
      expect(result).toBe("+19258958479");
    });

    // TODO: Test "NEW" prefix to E.164
    it("parses 'NEW NUMBER' to E.164", () => {
      // Your test here! "NEW 925-346-1245" should return "+19253461245"
    });

    // TODO: Test formatted number to E.164
    it("parses formatted number to E.164", () => {
      // Your test here! "(925) 555-1234" should return "+19255551234"
    });
  });

  describe("failed parsing", () => {
    // TODO: Test with no phone number
    it("returns null when no phone found", () => {
      // Your test here! "Please call the owner" should return null
    });

    // TODO: Test with email instead of phone
    it("returns null for email address", () => {
      // Your test here! "owner@email.com" should return null
    });
  });
});

describe("hasValidPhone", () => {
  // ✅ COMPLETE EXAMPLE
  it("returns true for valid messy phone", () => {
    expect(hasValidPhone("9258958479 BEST!")).toBe(true);
  });

  // TODO: Test clean phone number
  it("returns true for clean phone number", () => {
    // Your test here!
  });

  // TODO: Test invalid input
  it("returns false for text without phone", () => {
    // Your test here! "No phone available" should return false
  });

  // TODO: Test empty string
  it("returns false for empty string", () => {
    // Your test here!
  });
});

describe("extractPhoneWithDetails", () => {
  // ✅ COMPLETE EXAMPLE - This shows how to test object returns!
  it("returns detailed extraction result for messy input", () => {
    const result = extractPhoneWithDetails("9258958479 BEST!");

    // Use .toEqual() for objects, not .toBe()
    expect(result).toEqual({
      valid: true,
      e164: "+19258958479",
      rawDigits: "9258958479",
      originalText: "9258958479 BEST!",
      extraText: "BEST!",
    });
  });

  // TODO: Test with clean phone (extraText should be null)
  it("returns null extraText for clean input", () => {
    const result = extractPhoneWithDetails("9255551234");
    // Your assertions here!
    // Hint: extraText should be null for a clean number
  });

  // TODO: Test with invalid input
  it("returns invalid result for text without phone", () => {
    const result = extractPhoneWithDetails("Call mom");
    // Your assertions here!
    // Hint: valid should be false, e164 and rawDigits should be null
  });

  // TODO: Test with "NEW" prefix - what's the extraText?
  it("captures 'NEW' as extraText", () => {
    const result = extractPhoneWithDetails("NEW 925-346-1245");
    // Your assertions here!
    // What should extraText be?
  });

  // TODO: Test with multiple annotations
  it("captures all extra text", () => {
    const result = extractPhoneWithDetails("NEW 925-346-1245 cell - BEST");
    // Your assertions here!
    // What should extraText be when there's text on both sides?
  });
});

/**
 * 🎯 LEARNING TIPS:
 *
 * 1. Start with the TODO tests above
 * 2. Run tests with: pnpm test phone-formatting --watch
 * 3. Write one test at a time and watch it pass!
 * 4. Use the complete examples as a reference
 *
 * 5. Test Pattern (AAA):
 *    - ARRANGE: Set up your test data
 *    - ACT: Call the function
 *    - ASSERT: Check the result
 *
 * 6. Common mistakes to avoid:
 *    - Forgetting to import the function
 *    - Using wrong matcher (.toBe vs .toEqual for objects!)
 *    - Not thinking about edge cases
 *
 * 7. After completing TODOs, try adding your own tests!
 *    - What other edge cases can you think of?
 *    - What happens with unexpected inputs?
 *
 * 🏥 REAL-WORLD TIP:
 * The messy data tests are the most important ones! These simulate
 * exactly what comes from IDEXX systems. If these tests pass, your
 * discharge calls will work correctly even with messy clinic data.
 */
