/**
 * Rate Limiter Utility
 *
 * Token bucket algorithm for rate limiting API calls.
 */

import { scheduleLogger as logger } from "../lib/logger";

/**
 * Token Bucket Rate Limiter
 *
 * Implements the token bucket algorithm for smooth rate limiting.
 * Refills tokens at a constant rate, allows bursts up to bucket capacity.
 */
export class RateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second
  private readonly refillInterval: number; // milliseconds between refills

  /**
   * Create a new rate limiter
   *
   * @param tokensPerSecond - Maximum tokens (requests) per second
   * @param bucketSize - Bucket capacity (defaults to tokensPerSecond)
   */
  constructor(tokensPerSecond: number, bucketSize?: number) {
    this.maxTokens = bucketSize ?? tokensPerSecond;
    this.refillRate = tokensPerSecond;
    this.tokens = this.maxTokens; // Start with full bucket
    this.lastRefillTime = Date.now();
    this.refillInterval = 1000 / tokensPerSecond; // ms per token
  }

  /**
   * Wait until a token is available, then consume it
   *
   * @returns Promise that resolves when token is acquired
   */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Not enough tokens, wait for refill
    const waitTime = this.calculateWaitTime();
    logger.debug(`Rate limit: waiting ${waitTime}ms for token`);

    await new Promise((resolve) => setTimeout(resolve, waitTime));

    // Refill and consume
    this.refill();
    this.tokens -= 1;
  }

  /**
   * Try to acquire a token without waiting
   *
   * @returns true if token acquired, false if would need to wait
   */
  tryAcquire(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Acquire multiple tokens at once
   *
   * @param count - Number of tokens to acquire
   */
  async acquireMultiple(count: number): Promise<void> {
    if (count > this.maxTokens) {
      throw new Error(
        `Cannot acquire ${count} tokens - exceeds bucket capacity of ${this.maxTokens}`,
      );
    }

    for (let i = 0; i < count; i++) {
      await this.acquire();
    }
  }

  /**
   * Get current available tokens
   */
  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Reset rate limiter to full capacity
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefillTime = Date.now();
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillTime;

    if (elapsed <= 0) return;

    // Calculate tokens to add based on elapsed time
    const tokensToAdd = (elapsed / 1000) * this.refillRate;

    // Add tokens but don't exceed capacity
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  /**
   * Calculate wait time until next token is available
   */
  private calculateWaitTime(): number {
    const tokensNeeded = 1 - this.tokens;
    const timePerToken = 1000 / this.refillRate;
    return Math.ceil(tokensNeeded * timePerToken);
  }
}

/**
 * Global rate limiters by resource
 */
const limiters = new Map<string, RateLimiter>();

/**
 * Get or create a rate limiter for a resource
 *
 * @param resource - Resource identifier (e.g., 'idexx-api', 'supabase')
 * @param tokensPerSecond - Rate limit
 * @returns Rate limiter instance
 */
export function getRateLimiter(
  resource: string,
  tokensPerSecond: number,
): RateLimiter {
  if (!limiters.has(resource)) {
    limiters.set(resource, new RateLimiter(tokensPerSecond));
  }
  return limiters.get(resource)!;
}

/**
 * Rate-limited wrapper for async functions
 *
 * @param limiter - Rate limiter to use
 * @param fn - Async function to rate limit
 * @returns Rate-limited function
 *
 * @example
 * ```typescript
 * const limiter = new RateLimiter(10); // 10 requests per second
 * const fetchLimited = withRateLimit(limiter, fetchFromApi);
 * await fetchLimited(url);
 * ```
 */
export function withRateLimit<
  T extends (...args: unknown[]) => Promise<unknown>,
>(limiter: RateLimiter, fn: T): T {
  return (async (...args: Parameters<T>) => {
    await limiter.acquire();
    return fn(...args);
  }) as T;
}
