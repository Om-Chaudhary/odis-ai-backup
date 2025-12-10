/**
 * Custom Vitest matchers
 *
 * Extends Vitest with domain-specific assertions
 */
import { expect } from "vitest";

/**
 * Custom matchers interface for TypeScript
 */
interface CustomMatchers<R = unknown> {
  /**
   * Assert that a value is a valid ISO date string
   */
  toBeISODate(): R;

  /**
   * Assert that a value is a valid UUID
   */
  toBeUUID(): R;

  /**
   * Assert that a value is a valid phone number (E.164 format)
   */
  toBeE164Phone(): R;

  /**
   * Assert that a value is a valid email address
   */
  toBeEmail(): R;

  /**
   * Assert that an API response has the expected structure
   */
  toBeApiSuccess(expectedData?: unknown): R;

  /**
   * Assert that an API response is an error
   */
  toBeApiError(expectedStatus?: number, expectedMessage?: string): R;

  /**
   * Assert that a Zod schema validation passes
   */
  toPassZodSchema<T>(schema: { safeParse: (v: unknown) => { success: boolean } }): R;
}

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

/**
 * Register custom matchers with Vitest
 */
export function registerCustomMatchers(): void {
  expect.extend({
    toBeISODate(received: unknown) {
      const pass =
        typeof received === "string" &&
        !isNaN(Date.parse(received)) &&
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(received);

      return {
        pass,
        message: () =>
          pass
            ? `expected ${received} not to be a valid ISO date string`
            : `expected ${received} to be a valid ISO date string`,
      };
    },

    toBeUUID(received: unknown) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const pass = typeof received === "string" && uuidRegex.test(received);

      return {
        pass,
        message: () =>
          pass
            ? `expected ${received} not to be a valid UUID`
            : `expected ${received} to be a valid UUID`,
      };
    },

    toBeE164Phone(received: unknown) {
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      const pass = typeof received === "string" && e164Regex.test(received);

      return {
        pass,
        message: () =>
          pass
            ? `expected ${received} not to be a valid E.164 phone number`
            : `expected ${received} to be a valid E.164 phone number (e.g., +15551234567)`,
      };
    },

    toBeEmail(received: unknown) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const pass = typeof received === "string" && emailRegex.test(received);

      return {
        pass,
        message: () =>
          pass
            ? `expected ${received} not to be a valid email address`
            : `expected ${received} to be a valid email address`,
      };
    },

    toBeApiSuccess(received: unknown, expectedData?: unknown) {
      const isObject = typeof received === "object" && received !== null;
      const hasSuccess = isObject && "success" in received && (received as Record<string, unknown>).success === true;
      const dataMatches = expectedData === undefined ||
        (isObject && "data" in received &&
          JSON.stringify((received as Record<string, unknown>).data) === JSON.stringify(expectedData));

      const pass = hasSuccess && dataMatches;

      return {
        pass,
        message: () =>
          pass
            ? `expected response not to be a successful API response`
            : `expected response to be a successful API response with success: true${expectedData ? ` and data: ${JSON.stringify(expectedData)}` : ""}`,
      };
    },

    toBeApiError(received: unknown, expectedStatus?: number, expectedMessage?: string) {
      const isObject = typeof received === "object" && received !== null;
      const rec = received as Record<string, unknown>;
      const hasError = isObject && ("error" in rec || rec.success === false);
      const statusMatches = expectedStatus === undefined || rec.status === expectedStatus;
      const messageMatches = expectedMessage === undefined ||
        (typeof rec.error === "string" && rec.error.includes(expectedMessage)) ||
        (typeof rec.message === "string" && rec.message.includes(expectedMessage));

      const pass = hasError && statusMatches && messageMatches;

      return {
        pass,
        message: () =>
          pass
            ? `expected response not to be an API error`
            : `expected response to be an API error${expectedStatus ? ` with status ${expectedStatus}` : ""}${expectedMessage ? ` containing "${expectedMessage}"` : ""}`,
      };
    },

    toPassZodSchema(received: unknown, schema: { safeParse: (v: unknown) => { success: boolean; error?: { message: string } } }) {
      const result = schema.safeParse(received);
      const pass = result.success;

      return {
        pass,
        message: () =>
          pass
            ? `expected value not to pass Zod schema validation`
            : `expected value to pass Zod schema validation, but got error: ${result.error?.message ?? "unknown error"}`,
      };
    },
  });
}

// Auto-register matchers when this module is imported
registerCustomMatchers();

export default registerCustomMatchers;
