/**
 * @odis-ai/domain/cases
 *
 * Case management service for handling patient case creation, updates, and scheduling.
 */

// Main facade (backward compatible)
export * from "./lib/cases-service";

// Focused modules for direct access
export * from "./lib/case-crud";
export * from "./lib/case-ai";
export * from "./lib/case-helpers";
export * from "./lib/call-scheduling";
export * from "./lib/entity-utils";
export * from "./lib/client-identity";
