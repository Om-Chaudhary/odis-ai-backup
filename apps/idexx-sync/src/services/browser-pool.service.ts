/**
 * Browser Pool Service
 *
 * Manages a pool of browser instances for reuse across sync operations.
 * Reduces overhead of launching/closing browsers frequently.
 */

import type { Browser } from "playwright";
import { chromium } from "playwright";
import { browserLogger as logger } from "../lib/logger";
import { config } from "../config";

interface PooledBrowser {
  browser: Browser;
  lastUsed: Date;
  inUse: boolean;
  healthChecks: number;
}

/**
 * Browser Pool Service (Singleton)
 *
 * Features:
 * - Pool of reusable browser instances
 * - Automatic cleanup of stale browsers
 * - Health checking
 * - Graceful shutdown support
 */
export class BrowserPoolService {
  private static instance: BrowserPoolService;

  private pool: PooledBrowser[] = [];
  private readonly maxPoolSize: number;
  private readonly maxIdleTime = 5 * 60 * 1000; // 5 minutes
  private readonly maxBrowserAge = 30 * 60 * 1000; // 30 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.maxPoolSize = config.BROWSER_POOL_SIZE;
    this.startCleanupInterval();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): BrowserPoolService {
    if (!BrowserPoolService.instance) {
      BrowserPoolService.instance = new BrowserPoolService();
    }
    return BrowserPoolService.instance;
  }

  /**
   * Acquire a browser from the pool
   *
   * @returns Browser instance
   */
  async acquire(): Promise<Browser> {
    // Try to find an available browser in the pool
    for (const pooled of this.pool) {
      if (!pooled.inUse) {
        // Check if browser is still healthy
        if (await this.isHealthy(pooled.browser)) {
          pooled.inUse = true;
          pooled.lastUsed = new Date();
          pooled.healthChecks++;
          logger.debug("Reusing browser from pool");
          return pooled.browser;
        } else {
          // Remove unhealthy browser
          logger.warn("Removing unhealthy browser from pool");
          await this.removeBrowser(pooled);
        }
      }
    }

    // No available browser, create new one if under limit
    if (this.pool.length < this.maxPoolSize) {
      logger.info(
        `Creating new browser (pool size: ${this.pool.length + 1}/${this.maxPoolSize})`,
      );
      const browser = await this.createBrowser();

      this.pool.push({
        browser,
        lastUsed: new Date(),
        inUse: true,
        healthChecks: 0,
      });

      return browser;
    }

    // Pool is full and all browsers in use - wait for one to become available
    logger.warn("Browser pool exhausted, waiting for available browser...");
    return this.waitForAvailableBrowser();
  }

  /**
   * Release a browser back to the pool
   *
   * @param browser - Browser to release
   */
  async release(browser: Browser): Promise<void> {
    const pooled = this.pool.find((p) => p.browser === browser);

    if (!pooled) {
      logger.warn("Attempted to release browser not in pool, closing it");
      await browser.close();
      return;
    }

    pooled.inUse = false;
    pooled.lastUsed = new Date();
    logger.debug("Browser released back to pool");
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    total: number;
    inUse: number;
    available: number;
    maxSize: number;
  } {
    const inUse = this.pool.filter((p) => p.inUse).length;

    return {
      total: this.pool.length,
      inUse,
      available: this.pool.length - inUse,
      maxSize: this.maxPoolSize,
    };
  }

  /**
   * Close all browsers and cleanup
   */
  async closeAll(): Promise<void> {
    logger.info(`Closing all browsers in pool (${this.pool.length} total)`);

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    const closePromises = this.pool.map(async (pooled) => {
      try {
        await pooled.browser.close();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error(`Error closing browser: ${msg}`);
      }
    });

    await Promise.all(closePromises);
    this.pool = [];
    logger.info("All browsers closed");
  }

  /**
   * Create a new browser instance
   */
  private async createBrowser(): Promise<Browser> {
    const browser = await chromium.launch({
      headless: config.HEADLESS,
    });

    logger.debug("Browser instance created");
    return browser;
  }

  /**
   * Check if a browser is healthy
   */
  private async isHealthy(browser: Browser): Promise<boolean> {
    try {
      // Check if browser is connected
      if (!browser.isConnected()) {
        return false;
      }

      // Create a test page to verify functionality
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.close();
      await context.close();

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove a browser from the pool
   */
  private async removeBrowser(pooled: PooledBrowser): Promise<void> {
    const index = this.pool.indexOf(pooled);
    if (index > -1) {
      this.pool.splice(index, 1);
    }

    try {
      await pooled.browser.close();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error closing browser during removal: ${msg}`);
    }
  }

  /**
   * Wait for a browser to become available
   */
  private async waitForAvailableBrowser(): Promise<Browser> {
    const maxWaitTime = 60000; // 60 seconds
    const checkInterval = 500; // 500ms
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      // Check for available browser
      const available = this.pool.find((p) => !p.inUse);

      if (available) {
        if (await this.isHealthy(available.browser)) {
          available.inUse = true;
          available.lastUsed = new Date();
          available.healthChecks++;
          logger.info("Found available browser after waiting");
          return available.browser;
        } else {
          await this.removeBrowser(available);
        }
      }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    throw new Error("Timeout waiting for available browser");
  }

  /**
   * Start periodic cleanup of idle/stale browsers
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      void this.cleanup();
    }, 60 * 1000); // Every minute
  }

  /**
   * Cleanup idle and stale browsers
   */
  private async cleanup(): Promise<void> {
    const now = Date.now();
    const toRemove: PooledBrowser[] = [];

    for (const pooled of this.pool) {
      // Skip browsers currently in use
      if (pooled.inUse) continue;

      const idleTime = now - pooled.lastUsed.getTime();
      const browserAge = now - pooled.lastUsed.getTime();

      // Remove if idle too long or too old
      if (idleTime > this.maxIdleTime || browserAge > this.maxBrowserAge) {
        logger.debug(
          `Removing browser: idle=${idleTime}ms, age=${browserAge}ms`,
        );
        toRemove.push(pooled);
      }
    }

    // Remove stale browsers
    for (const pooled of toRemove) {
      await this.removeBrowser(pooled);
    }

    if (toRemove.length > 0) {
      logger.info(`Cleaned up ${toRemove.length} idle/stale browsers`);
    }
  }
}

// Export singleton instance
export const browserPool = BrowserPoolService.getInstance();
