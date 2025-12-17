/**
 * Timeout Utilities
 *
 * Helper functions for wrapping promises with timeouts to prevent hanging operations.
 */

import { logger } from './logger';

/* eslint-disable func-style */

/**
 * Error thrown when a timeout occurs
 */
export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly timeoutMs: number,
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wrap a promise with a timeout that throws TimeoutError if exceeded
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param operationName - Name of the operation for error messages
 * @returns The resolved value of the promise
 * @throws TimeoutError if the timeout is exceeded
 *
 * @example
 * ```typescript
 * import { logger } from '@odis-ai/extension-shared';
 *
 * try {
 *   const result = await withTimeout(fetchData(), 5000, 'fetchData');
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     logger.warn('Operation timed out');
 *   }
 * }
 * ```
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName = 'operation'): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(`${operationName} timed out after ${timeoutMs}ms`, timeoutMs));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Wrap a promise with a timeout that returns a fallback value if exceeded
 * This is a non-throwing version that's useful for non-critical operations.
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param fallbackValue - Value to return if timeout is exceeded
 * @param operationName - Name of the operation for logging
 * @returns The resolved value of the promise, or fallbackValue if timed out
 *
 * @example
 * ```typescript
 * // Returns null if the operation takes more than 5 seconds
 * const result = await withTimeoutFallback(fetchData(), 5000, null, 'fetchData');
 * ```
 */
export async function withTimeoutFallback<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallbackValue: T,
  operationName = 'operation',
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>(resolve => {
    timeoutId = setTimeout(() => {
      logger.warn(`[Timeout] ${operationName} timed out after ${timeoutMs}ms, using fallback`);
      resolve(fallbackValue);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    logger.warn(`[Timeout] ${operationName} failed`, { error });
    return fallbackValue;
  }
}

/**
 * Create an AbortController that automatically aborts after a timeout
 * Useful for fetch requests that need timeout handling.
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns Object containing the AbortController and a cleanup function
 *
 * @example
 * ```typescript
 * const { controller, cleanup } = createTimeoutAbortController(30000);
 * try {
 *   const response = await fetch(url, { signal: controller.signal });
 *   cleanup(); // Clear timeout on success
 *   return response;
 * } catch (error) {
 *   cleanup();
 *   throw error;
 * }
 * ```
 */
export function createTimeoutAbortController(timeoutMs: number): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new TimeoutError(`Request timed out after ${timeoutMs}ms`, timeoutMs));
  }, timeoutMs);

  return {
    controller,
    cleanup: () => clearTimeout(timeoutId),
  };
}

/**
 * Wrap a fetch request with a timeout using AbortController
 *
 * @param url - The URL to fetch
 * @param options - Fetch options (signal will be overwritten)
 * @param timeoutMs - Timeout in milliseconds
 * @returns The fetch Response
 * @throws TimeoutError if the timeout is exceeded
 *
 * @example
 * ```typescript
 * const response = await fetchWithTimeout('https://api.example.com/data', {
 *   method: 'GET',
 *   headers: { 'Content-Type': 'application/json' },
 * }, 30000);
 * ```
 */
export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number): Promise<Response> {
  const { controller, cleanup } = createTimeoutAbortController(timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    cleanup();
    return response;
  } catch (error) {
    cleanup();
    // Convert AbortError to TimeoutError for consistency
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(`Fetch to ${url} timed out after ${timeoutMs}ms`, timeoutMs);
    }
    throw error;
  }
}
