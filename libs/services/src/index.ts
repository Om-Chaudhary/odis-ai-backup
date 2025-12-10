/**
 * @odis-ai/services
 *
 * Transport-agnostic business logic services.
 * Services accept Supabase client injection and contain no UI/Next.js dependencies.
 *
 * This library now re-exports from focused sub-libraries:
 * - @odis-ai/services-cases
 * - @odis-ai/services-discharge
 * - @odis-ai/services-shared
 */

// Re-export from services-cases
export * from "@odis-ai/services-cases";

// Re-export from services-shared
export * from "@odis-ai/services-shared";

// Note: discharge-batch-processor and discharge-orchestrator are not exported
// from index to avoid bundling @react-email/components during Next.js static
// page generation. Import directly when needed:
// - "@odis-ai/services-discharge/discharge-batch-processor"
// - "@odis-ai/services-discharge/discharge-orchestrator"
// OR use the old paths (backward compatible):
// - "@odis-ai/services/discharge-batch-processor"
// - "@odis-ai/services/discharge-orchestrator"
