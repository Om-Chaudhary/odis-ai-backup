/**
 * Example test for Next.js API routes
 *
 * This demonstrates how to test API route handlers
 */

import { beforeEach, describe, it, vi } from "vitest";
import {
  createAuthenticatedRequest,
  createMockContext,
  createMockRequest,
  getJsonResponse,
} from "../api-utils";

// Mock dependencies
vi.mock("~/lib/api/auth", () => ({
  withAuth: (handler: unknown) => handler,
  authenticateUser: vi.fn(),
}));

vi.mock("~/lib/services/cases-service", () => ({
  CasesService: {
    ingest: vi.fn(),
  },
}));

vi.mock("~/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("API Route Example", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle POST request", async () => {
    // Create a mock request
    const request = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/normalize",
      body: {
        input: "Patient presents with symptoms...",
        inputType: "transcript",
      },
    });

    const context = createMockContext();

    // Call the route handler
    // Note: In real tests, you'd mock the dependencies properly
    // const response = await POST(request, context);

    // Assert response
    // const data = await getJsonResponse(response);
    // expect(data).toHaveProperty("success", true);
  });

  it("should handle authenticated request", async () => {
    const request = createAuthenticatedRequest("test-token", {
      method: "POST",
      url: "http://localhost:3000/api/normalize",
      body: {
        input: "Test input",
        inputType: "transcript",
      },
    });

    // Test authenticated route...
  });
});
