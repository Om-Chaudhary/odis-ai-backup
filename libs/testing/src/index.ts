/**
 * @odis-ai/testing - Shared testing utilities for ODIS AI monorepo
 *
 * This library provides:
 * - Test utilities for API routes, components, and services
 * - Mock factories for Supabase, VAPI, and other external services
 * - Fixture generators for common data types
 * - Custom Vitest matchers
 * - Setup helpers for different test environments
 *
 * @example
 * // In a test file
 * import { createMockSupabaseClient, createMockUser } from '@odis-ai/testing';
 *
 * describe('MyService', () => {
 *   const supabase = createMockSupabaseClient();
 *   const user = createMockUser({ email: 'test@example.com' });
 * });
 */

// Utils
export * from "./utils/api";
export * from "./utils/assertions";
// React utils exported separately to avoid importing React in Node tests
// export * from "./utils/react";

// Mocks
export * from "./mocks/supabase";
export * from "./mocks/vapi";
// export * from "./mocks/next"; // Contains JSX, import directly when needed

// Fixtures
export * from "./fixtures/users";
export * from "./fixtures/cases";
export * from "./fixtures/calls";

// Setup - import directly when needed in vitest.config.ts setupFiles
// export * from "./setup/node";
// export * from "./setup/react";

// Matchers - auto-registers when imported
// export * from "./matchers";

// Re-export types for convenience
export type { MockRequestOptions, RouteContext } from "./utils/api";
export type { MockQueryBuilder, MockSupabaseAuth } from "./mocks/supabase";
export type { MockVapiCall, VapiWebhookType } from "./mocks/vapi";
export type { MockPatient, MockCase, MockMedication } from "./fixtures/cases";
export type {
  MockCallRecord,
  MockScheduledCall,
  MockInboundCall,
} from "./fixtures/calls";
export type { MockClinicUser, MockClinic } from "./fixtures/users";
