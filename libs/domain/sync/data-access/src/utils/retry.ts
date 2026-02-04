/**
 * Retry Utility
 * Provides retry logic with exponential backoff for transient network errors
 */

/** Configuration for retry behavior */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelayMs?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelayMs?: number;
  /** Custom retry predicate - return true if error should be retried */
  shouldRetry?: (error: unknown) => boolean;
  /** Callback fired before each retry attempt */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

/** Result of a retry operation */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoff(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async operation with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {},
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    shouldRetry = () => true,
    onRetry,
  } = config;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const data = await fn();
      return { success: true, data, attempts: attempt };
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt > maxRetries;
      if (isLastAttempt || !shouldRetry(error)) {
        break;
      }

      const delayMs = calculateBackoff(attempt - 1, baseDelayMs, maxDelayMs);
      onRetry?.(error, attempt, delayMs);
      await sleep(delayMs);
    }
  }

  return { success: false, error: lastError, attempts: maxRetries + 1 };
}
