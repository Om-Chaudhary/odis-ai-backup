/**
 * @odis-ai/vapi
 *
 * VAPI AI integration library.
 * Includes clients, types, webhook handlers, tool schemas, and processors.
 *
 * @example
 * ```typescript
 * // Core tool handler factory
 * import { createToolHandler } from "@odis-ai/integrations/vapi/core";
 *
 * // Tool schemas
 * import { BookAppointmentSchema } from "@odis-ai/integrations/vapi/schemas";
 *
 * // Tool processors
 * import { processBookAppointment } from "@odis-ai/integrations/vapi/processors";
 * ```
 */

// Core tool handler factory
export * from "./core";

// Core client and types
export * from "./client";
export * from "./types";
export * from "./validators";

// Variable extraction
export * from "./extract-variables";
export * from "./utils";

// Variable building utilities
export * from "./knowledge-base";

// Request queue for rate limiting
export * from "./request-queue";

// NOTE: schemas and processors are NOT re-exported here to keep imports explicit:
// - import { ... } from "@odis-ai/integrations/vapi/schemas"
// - import { ... } from "@odis-ai/integrations/vapi/processors"
