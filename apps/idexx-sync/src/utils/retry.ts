/**
 * Retry Utility with Exponential Backoff
 *
 * Provides resilient retry logic for transient failures.
 */

import { scheduleLogger as logger } from "../lib/logger";

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "shouldRetry" | "onRetry">> =
  {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
  };

/**
 * Default retry predicate - retries on network errors and rate limits
 */
function defaultShouldRetry(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Retry on network errors
    if (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("enotfound") ||
      message.includes("econnreset")
    ) {
      return true;
    }

    // Retry on rate limits (HTTP 429)
    if (message.includes("429") || message.includes("rate limit")) {
      return true;
    }

    // Retry on temporary server errors (HTTP 5xx)
    if (
      message.includes("502") ||
      message.includes("503") ||
      message.includes("504")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
): number {
  // Exponential backoff
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter (±25%)
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);

  return Math.floor(cappedDelay + jitter);
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param options - Retry options
 * @returns Result of the function
 * @throws Last error if all retries exhausted
 *
 * @example
 * ```typescript
 * const data = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxRetries, initialDelay, maxDelay, backoffMultiplier } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const shouldRetry = options.shouldRetry ?? defaultShouldRetry;
  const onRetry = options.onRetry;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!shouldRetry(error)) {
        throw error;
      }

      // Calculate delay
      const delay = calculateDelay(
        attempt,
        initialDelay,
        maxDelay,
        backoffMultiplier,
      );

      // Call retry callback
      if (onRetry) {
        onRetry(error, attempt + 1);
      } else {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay. Error: ${errorMsg}`,
        );
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  throw lastError;
}

/**
 * Retry wrapper specifically for database operations
 */
export async function withDatabaseRetry<T>(
  fn: () => Promise<T>,
  operationName?: string,
): Promise<T> {
  return withRetry(fn, {
    maxRetries: 2,
    initialDelay: 500,
    maxDelay: 2000,
    onRetry: (error, attempt) => {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.warn(
        `Database operation retry ${attempt}/2 for ${operationName ?? "unknown"}: ${errorMsg}`,
      );
    },
  });
}

/**
 * Retry wrapper specifically for API calls
 */
export async function withApiRetry<T>(
  fn: () => Promise<T>,
  apiName?: string,
): Promise<T> {
  return withRetry(fn, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    onRetry: (error, attempt) => {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.warn(
        `API call retry ${attempt}/3 for ${apiName ?? "unknown"}: ${errorMsg}`,
      );
    },
  });
}
