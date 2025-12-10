/**
 * @odis-ai/services
 *
 * Transport-agnostic business logic services.
 * Services accept Supabase client injection and contain no UI/Next.js dependencies.
 */

// Export cases service
export * from "./cases-service";

// Export execution plan
export * from "./execution-plan";

// Note: discharge-batch-processor and discharge-orchestrator are not exported
// from index to avoid bundling @react-email/components during Next.js static
// page generation. Import directly when needed:
// - "@odis-ai/services/discharge-batch-processor"
// - "@odis-ai/services/discharge-orchestrator"
