/**
 * Browser Pool
 * Manages a pool of browser instances for concurrent scraping
 */

import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";
import type {
  BrowserPoolConfig,
  BrowserInstance,
  ContextInstance,
  PageSession,
} from "./types";

/**
 * Pool manager for browser instances
 * Enables concurrent scraping with resource limits
 */
export class BrowserPool {
  private browsers = new Map<string, BrowserInstance>();
  private contexts = new Map<string, ContextInstance>();
  private config: Required<BrowserPoolConfig>;

  constructor(config: BrowserPoolConfig = {}) {
    this.config = {
      maxBrowsers: config.maxBrowsers ?? 3,
      maxContextsPerBrowser: config.maxContextsPerBrowser ?? 5,
      headless: config.headless ?? true,
      defaultTimeout: config.defaultTimeout ?? 30000,
      userDataDir: config.userDataDir ?? "",
    };
  }

  /**
   * Get or create a browser instance
   */
  private async getBrowser(): Promise<{ id: string; browser: Browser }> {
    // Find browser with capacity for more contexts
    for (const [id, instance] of this.browsers.entries()) {
      if (instance.contexts.length < this.config.maxContextsPerBrowser) {
        instance.lastUsed = new Date();
        return { id, browser: instance.browser };
      }
    }

    // Create new browser if under limit
    if (this.browsers.size < this.config.maxBrowsers) {
      const id = `browser-${Date.now()}`;
      const browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });

      const instance: BrowserInstance = {
        browser,
        contexts: [],
        createdAt: new Date(),
        lastUsed: new Date(),
      };

      this.browsers.set(id, instance);
      return { id, browser };
    }

    // Pool is full - find least recently used browser
    let lruBrowserId = "";
    let oldestTime = Date.now();

    for (const [id, instance] of this.browsers.entries()) {
      const time = instance.lastUsed.getTime();
      if (time < oldestTime) {
        oldestTime = time;
        lruBrowserId = id;
      }
    }

    const lruInstance = this.browsers.get(lruBrowserId);
    if (!lruInstance) {
      throw new Error("Browser pool exhausted");
    }

    lruInstance.lastUsed = new Date();
    return { id: lruBrowserId, browser: lruInstance.browser };
  }

  /**
   * Acquire a page session from the pool
   */
  async acquire(): Promise<PageSession> {
    // Find available context
    for (const [contextId, contextInstance] of this.contexts.entries()) {
      if (!contextInstance.inUse) {
        contextInstance.inUse = true;
        contextInstance.lastUsed = new Date();

        const page = await contextInstance.context.newPage();

        return {
          page,
          context: contextInstance.context,
          browserId: contextInstance.browserId,
          contextId,
        };
      }
    }

    // Create new context
    const { id: browserId, browser } = await this.getBrowser();

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      locale: "en-US",
      timezoneId: "America/New_York",
    });

    context.setDefaultTimeout(this.config.defaultTimeout);

    const contextId = `context-${Date.now()}`;
    const contextInstance: ContextInstance = {
      context,
      browserId,
      createdAt: new Date(),
      lastUsed: new Date(),
      inUse: true,
    };

    this.contexts.set(contextId, contextInstance);

    // Track context in browser instance
    const browserInstance = this.browsers.get(browserId);
    if (browserInstance) {
      browserInstance.contexts.push(context);
    }

    const page = await context.newPage();

    return {
      page,
      context,
      browserId,
      contextId,
    };
  }

  /**
   * Release a page session back to the pool
   */
  async release(session: PageSession): Promise<void> {
    // Close the page
    await session.page.close();

    // Mark context as available
    const contextInstance = this.contexts.get(session.contextId);
    if (contextInstance) {
      contextInstance.inUse = false;
      contextInstance.lastUsed = new Date();
    }
  }

  /**
   * Execute a function with a pooled page session
   */
  async withPage<T>(fn: (session: PageSession) => Promise<T>): Promise<T> {
    const session = await this.acquire();
    try {
      return await fn(session);
    } finally {
      await this.release(session);
    }
  }

  /**
   * Execute a function with an authenticated page session
   */
  async withAuthenticatedPage<T>(
    authClient: { applyAuth: (page: Page) => Promise<void> },
    fn: (session: PageSession) => Promise<T>,
  ): Promise<T> {
    return this.withPage(async (session) => {
      await authClient.applyAuth(session.page);
      return fn(session);
    });
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      browsers: this.browsers.size,
      contexts: this.contexts.size,
      inUseContexts: Array.from(this.contexts.values()).filter((c) => c.inUse)
        .length,
      availableContexts: Array.from(this.contexts.values()).filter(
        (c) => !c.inUse,
      ).length,
    };
  }

  /**
   * Close idle contexts (not in use for > 5 minutes)
   */
  async closeIdleContexts(maxIdleMs = 5 * 60 * 1000): Promise<number> {
    const now = Date.now();
    let closedCount = 0;

    for (const [contextId, contextInstance] of this.contexts.entries()) {
      const idleTime = now - contextInstance.lastUsed.getTime();

      if (!contextInstance.inUse && idleTime > maxIdleMs) {
        await contextInstance.context.close();
        this.contexts.delete(contextId);
        closedCount++;

        // Remove from browser instance
        const browserInstance = this.browsers.get(contextInstance.browserId);
        if (browserInstance) {
          const index = browserInstance.contexts.indexOf(
            contextInstance.context,
          );
          if (index > -1) {
            browserInstance.contexts.splice(index, 1);
          }
        }
      }
    }

    return closedCount;
  }

  /**
   * Close all browsers and contexts
   */
  async close(): Promise<void> {
    // Close all contexts
    await Promise.all(
      Array.from(this.contexts.values()).map((c) => c.context.close()),
    );
    this.contexts.clear();

    // Close all browsers
    await Promise.all(
      Array.from(this.browsers.values()).map((b) => b.browser.close()),
    );
    this.browsers.clear();
  }
}
