/**
 * Tests for cors.ts utilities
 * - isOriginAllowed: Check if origin is in allowlist (exact & wildcard)
 * - getCorsHeaders: Generate CORS headers
 */

import { describe, it, expect } from "vitest";
import {
  isOriginAllowed,
  getCorsHeaders,
  IDEXX_ALLOWED_ORIGINS,
  CORS_ALLOWED_METHODS,
  CORS_ALLOWED_HEADERS,
  CORS_MAX_AGE,
} from "../cors";

describe("isOriginAllowed", () => {
  describe("exact matches", () => {
    it("returns true for exact US IDEXX Neo match", () => {
      expect(isOriginAllowed("https://us.idexxneo.com")).toBe(true);
    });

    it("returns true for exact CA IDEXX Neo match", () => {
      expect(isOriginAllowed("https://ca.idexxneo.com")).toBe(true);
    });

    it("returns true for exact UK IDEXX Neo match", () => {
      expect(isOriginAllowed("https://uk.idexxneo.com")).toBe(true);
    });

    it("returns true for IDEXX Neo Cloud", () => {
      expect(isOriginAllowed("https://idexxneocloud.com")).toBe(true);
    });

    it("returns true for neo.vet", () => {
      expect(isOriginAllowed("https://neo.vet")).toBe(true);
    });

    it("returns true for neosuite.com", () => {
      expect(isOriginAllowed("https://neosuite.com")).toBe(true);
    });

    it("returns true for vapi.ai", () => {
      expect(isOriginAllowed("https://vapi.ai")).toBe(true);
    });

    it("returns true for dashboard.vapi.ai", () => {
      expect(isOriginAllowed("https://dashboard.vapi.ai")).toBe(true);
    });
  });

  describe("wildcard matches", () => {
    it("returns true for subdomain of idexxneocloud.com", () => {
      expect(isOriginAllowed("https://app.idexxneocloud.com")).toBe(true);
    });

    it("returns true for subdomain of neosuite.com", () => {
      expect(isOriginAllowed("https://portal.neosuite.com")).toBe(true);
    });

    it("returns true for subdomain of vapi.ai", () => {
      expect(isOriginAllowed("https://api.vapi.ai")).toBe(true);
    });

    it("returns true for nested subdomain", () => {
      expect(isOriginAllowed("https://dev.app.idexxneocloud.com")).toBe(true);
    });
  });

  describe("disallowed origins", () => {
    it("returns false for unknown domain", () => {
      expect(isOriginAllowed("https://example.com")).toBe(false);
    });

    it("returns false for localhost", () => {
      expect(isOriginAllowed("http://localhost:3000")).toBe(false);
    });

    it("returns false for similar but different domain", () => {
      expect(isOriginAllowed("https://idexxneo.com")).toBe(false);
    });

    it("returns false for HTTP version of allowed domain", () => {
      expect(isOriginAllowed("http://us.idexxneo.com")).toBe(false);
    });

    it("returns false for malicious domain trying to match", () => {
      expect(isOriginAllowed("https://evil.idexxneo.com.attacker.com")).toBe(
        false,
      );
    });

    it("returns false for empty string", () => {
      expect(isOriginAllowed("")).toBe(false);
    });
  });
});

describe("getCorsHeaders", () => {
  describe("allowed origin", () => {
    it("returns specific origin for allowed domain", () => {
      const headers = getCorsHeaders("https://us.idexxneo.com");

      expect(headers["Access-Control-Allow-Origin"]).toBe(
        "https://us.idexxneo.com",
      );
    });

    it("includes credentials for allowed domain", () => {
      const headers = getCorsHeaders("https://us.idexxneo.com");

      expect(headers["Access-Control-Allow-Credentials"]).toBe("true");
    });

    it("includes allowed methods", () => {
      const headers = getCorsHeaders("https://us.idexxneo.com");

      expect(headers["Access-Control-Allow-Methods"]).toBe(
        CORS_ALLOWED_METHODS.join(", "),
      );
    });

    it("includes allowed headers", () => {
      const headers = getCorsHeaders("https://us.idexxneo.com");

      expect(headers["Access-Control-Allow-Headers"]).toBe(
        CORS_ALLOWED_HEADERS.join(", "),
      );
    });

    it("includes max age", () => {
      const headers = getCorsHeaders("https://us.idexxneo.com");

      expect(headers["Access-Control-Max-Age"]).toBe(CORS_MAX_AGE.toString());
    });
  });

  describe("disallowed origin", () => {
    it("returns wildcard for unknown origin", () => {
      const headers = getCorsHeaders("https://example.com");

      expect(headers["Access-Control-Allow-Origin"]).toBe("*");
    });

    it("does not include credentials for unknown origin", () => {
      const headers = getCorsHeaders("https://example.com");

      expect(headers["Access-Control-Allow-Credentials"]).toBeUndefined();
    });

    it("still includes methods and headers", () => {
      const headers = getCorsHeaders("https://example.com");

      expect(headers["Access-Control-Allow-Methods"]).toBe(
        CORS_ALLOWED_METHODS.join(", "),
      );
      expect(headers["Access-Control-Allow-Headers"]).toBe(
        CORS_ALLOWED_HEADERS.join(", "),
      );
    });
  });

  describe("null origin", () => {
    it("returns wildcard for null origin", () => {
      const headers = getCorsHeaders(null);

      expect(headers["Access-Control-Allow-Origin"]).toBe("*");
    });

    it("does not include credentials for null origin", () => {
      const headers = getCorsHeaders(null);

      expect(headers["Access-Control-Allow-Credentials"]).toBeUndefined();
    });
  });

  describe("allowCredentials option", () => {
    it("respects allowCredentials=false for allowed origin", () => {
      const headers = getCorsHeaders("https://us.idexxneo.com", false);

      expect(headers["Access-Control-Allow-Credentials"]).toBeUndefined();
    });
  });
});

describe("CORS constants", () => {
  it("exports IDEXX_ALLOWED_ORIGINS array", () => {
    expect(Array.isArray(IDEXX_ALLOWED_ORIGINS)).toBe(true);
    expect(IDEXX_ALLOWED_ORIGINS.length).toBeGreaterThan(0);
  });

  it("exports CORS_ALLOWED_METHODS array", () => {
    expect(CORS_ALLOWED_METHODS).toContain("GET");
    expect(CORS_ALLOWED_METHODS).toContain("POST");
    expect(CORS_ALLOWED_METHODS).toContain("OPTIONS");
  });

  it("exports CORS_ALLOWED_HEADERS array", () => {
    expect(CORS_ALLOWED_HEADERS).toContain("Content-Type");
    expect(CORS_ALLOWED_HEADERS).toContain("Authorization");
  });

  it("exports CORS_MAX_AGE number", () => {
    expect(typeof CORS_MAX_AGE).toBe("number");
    expect(CORS_MAX_AGE).toBe(86400);
  });
});
