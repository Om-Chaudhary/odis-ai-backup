/**
 * @odis-ai/services-discharge
 *
 * Discharge orchestration, batch processing, and execution services.
 *
 * ## Architecture
 *
 * This library provides modular execution services for discharge workflows:
 *
 * - **Executors**: Core execution logic for calls and emails
 *   - `executeScheduledCall` - Executes a scheduled VAPI call
 *   - `executeScheduledEmail` - Executes a scheduled email via Resend
 *
 * - **Orchestrator**: Coordinates multi-step discharge workflows
 *   - Import directly: `@odis-ai/services-discharge/discharge-orchestrator`
 *
 * - **Batch Processor**: Handles batch discharge operations
 *   - Import directly: `@odis-ai/services-discharge/discharge-batch-processor`
 *
 * ## Usage
 *
 * ### Direct Execution (Test Mode)
 * ```typescript
 * import { executeScheduledCall, executeScheduledEmail } from '@odis-ai/services-discharge';
 *
 * // Execute call immediately
 * const callResult = await executeScheduledCall(callId, supabase);
 *
 * // Execute email immediately
 * const emailResult = await executeScheduledEmail(emailId, supabase);
 * ```
 *
 * ### Scheduled Execution (Normal Mode)
 * Scheduled execution goes through QStash -> Webhook -> Executor:
 * ```typescript
 * import { scheduleCallExecution } from '@odis-ai/qstash/client';
 *
 * // Schedule for later
 * await scheduleCallExecution(callId, scheduledFor);
 * ```
 *
 * ## Note on Bundling
 *
 * The orchestrator and batch processor are not exported from index to avoid
 * bundling @react-email/components during Next.js static page generation.
 * Import them directly when needed:
 * - `@odis-ai/services-discharge/discharge-orchestrator`
 * - `@odis-ai/services-discharge/discharge-batch-processor`
 */

// Export executor functions for direct use
export { executeScheduledCall } from "./lib/call-executor";
export { executeScheduledEmail } from "./lib/email-executor";

// Export email content generator for use in outbound procedures
export { generateDischargeEmailContent } from "./lib/email-content-generator";

// Export types
export type { CallExecutionResult } from "@odis-ai/types/services";
export type { EmailExecutionResult, ExecutorDependencies } from "./types";
