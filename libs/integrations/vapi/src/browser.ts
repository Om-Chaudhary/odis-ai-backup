/**
 * Browser-safe exports from @odis-ai/vapi
 * Excludes server SDK client operations
 */

// Types (browser-safe)
export * from "./types";

// Validators (browser-safe - Zod schemas)
export * from "./validators";

// Knowledge base (browser-safe)
export * from "./knowledge-base";

// Variable extraction utilities (browser-safe)
export * from "./extract-variables";

// Note: client.ts is NOT exported as it requires @vapi-ai/server-sdk
// For VAPI operations from the extension, use API routes instead
