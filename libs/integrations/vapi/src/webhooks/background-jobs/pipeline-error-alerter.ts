/**
 * Pipeline Error Alerter Background Job
 *
 * Sends Slack alerts when VAPI calls fail due to pipeline/provider errors
 * (e.g., OpenAI quota exceeded, rate limits). These errors indicate
 * systemic issues that affect all callers and need immediate attention.
 *
 * @module vapi/webhooks/background-jobs/pipeline-error-alerter
 */

import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.webhook.child("pipeline-error-alerter");

/**
 * Check if an endedReason indicates a pipeline/provider error
 */
export function isPipelineError(endedReason: string | undefined): boolean {
  return !!endedReason && endedReason.startsWith("pipeline-error");
}

/**
 * Parse a pipeline error reason into a human-readable description
 */
function describePipelineError(endedReason: string): {
  provider: string;
  errorType: string;
  severity: "warning" | "error" | "critical";
  description: string;
} {
  // Format: pipeline-error-<provider>-<error-code>
  // e.g., pipeline-error-openai-429-exceeded-quota
  //        pipeline-error-openai-429-rate-limit-reached
  const parts = endedReason.replace("pipeline-error-", "").split("-");
  const provider = parts[0] ?? "unknown";

  if (endedReason.includes("exceeded-quota")) {
    return {
      provider,
      errorType: "quota_exceeded",
      severity: "critical",
      description: `${provider.toUpperCase()} API quota exceeded. All calls will fail until credits are added or the quota resets.`,
    };
  }

  if (endedReason.includes("rate-limit")) {
    return {
      provider,
      errorType: "rate_limit",
      severity: "warning",
      description: `${provider.toUpperCase()} API rate limit reached. Some calls may fail temporarily.`,
    };
  }

  return {
    provider,
    errorType: "unknown",
    severity: "error",
    description: `${provider.toUpperCase()} pipeline error: ${endedReason}`,
  };
}

/**
 * Send a Slack alert for a pipeline error (fire-and-forget)
 *
 * @param callId - VAPI call ID
 * @param endedReason - The pipeline error reason
 * @param customerPhone - Caller's phone number
 * @param assistantId - VAPI assistant ID
 */
export function alertPipelineError(
  callId: string,
  endedReason: string,
  customerPhone: string | undefined,
  assistantId: string | undefined,
): void {
  void (async () => {
    try {
      const { provider, errorType, severity, description } =
        describePipelineError(endedReason);

      logger.error("Pipeline error detected on call", {
        callId,
        endedReason,
        provider,
        errorType,
        severity,
        customerPhone,
        assistantId,
      });

      // Dynamic import to avoid circular dependencies
      const { notifySlack, isEnvSlackConfigured } =
        await import("@odis-ai/integrations/slack");

      if (!isEnvSlackConfigured()) {
        logger.warn("Slack not configured — pipeline error alert not sent", {
          callId,
          endedReason,
        });
        return;
      }

      notifySlack("admin_alert", {
        title: "AI Call Pipeline Error",
        message:
          `${description}\n\n` +
          `*Ended Reason:* \`${endedReason}\`\n` +
          `*Call ID:* ${callId}\n` +
          (customerPhone ? `*Caller:* ${customerPhone}\n` : "") +
          (assistantId ? `*Assistant:* ${assistantId}\n` : "") +
          `*Time:* ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}`,
        severity,
        metadata: {
          provider,
          error_type: errorType,
          call_id: callId,
        },
      });

      logger.info("Pipeline error alert sent to Slack", {
        callId,
        endedReason,
        severity,
      });
    } catch (error) {
      logger.error("Failed to send pipeline error alert", {
        callId,
        endedReason,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();
}
