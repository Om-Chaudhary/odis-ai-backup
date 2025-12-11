/**
 * @odis-ai/vapi
 *
 * VAPI AI integration library.
 * Includes clients, prompts, and webhook handlers.
 */

// Core client and types
export * from "./client";
export * from "./types";
export * from "./simple-types";
export * from "./validators";

// Interfaces for dependency injection
export * from "./call-client.interface";

// Call management
export * from "./call-manager";
export * from "./warm-transfer";

// Variable extraction
export * from "./extract-variables";
export * from "./utils";

// Variable building utilities
export * from "./knowledge-base";
