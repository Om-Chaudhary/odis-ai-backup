/**
 * VAPI Webhook Utilities
 *
 * Modular utility functions for webhook processing.
 * Re-exports from focused utility modules for backward compatibility.
 *
 * @module vapi/webhooks/utils
 */

// Status mapping
export {
  mapVapiStatus,
  mapEndedReasonToStatus,
  shouldMarkAsFailed,
  shouldMarkInboundCallAsFailed,
  FAILED_ENDED_REASONS,
  type CallStatus,
} from "./status-mapper";

// Retry scheduling
export {
  shouldRetry,
  calculateRetryDelay,
  evaluateRetry,
  DEFAULT_MAX_RETRIES,
  RETRYABLE_REASONS,
  type RetryDecision,
} from "./retry-scheduler";

// Cost and duration calculation
export {
  calculateTotalCost,
  calculateDuration,
  formatDuration,
  formatCost,
} from "./cost-calculator";

// Sentiment analysis
export {
  extractSentiment,
  sentimentToScore,
  scoreToSentiment,
  type Sentiment,
} from "./sentiment-analyzer";

// Incomplete call detection
export {
  isIncompleteInboundCall,
  sanitizeIncompleteCallStructuredData,
} from "./incomplete-call-detector";

// Call data enrichment
export {
  isInboundCall,
  getCallTableName,
  enrichCallFromMessage,
  formatCallForLog,
  formatWebhookForLog,
} from "./call-enricher";
