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

/** Error patterns that indicate transient network issues */
const RETRYABLE_ERROR_PATTERNS = [
  "Failed to fetch",
  "net::ERR_",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ESOCKETTIMEDOUT",
  "socket hang up",
  "Request timed out",
  "Network request failed",
  "Target closed",
  "Session closed",
  "Protocol error",
  "Navigation interrupted",
] as const;

/**
 * Check if an error is retryable (transient network error)
 */
export function isRetryableError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return RETRYABLE_ERROR_PATTERNS.some((pattern) =>
    message.toLowerCase().includes(pattern.toLowerCase()),
  );
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoff(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  // Exponential backoff: baseDelay * 2^attempt with jitter
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
  return Math.min(exponentialDelay + jitter, maxDelayMs);
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
    shouldRetry = isRetryableError,
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
