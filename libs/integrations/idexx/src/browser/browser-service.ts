/**
 * Browser Service
 * Manages Playwright browser lifecycle for IDEXX Neo automation
 */

import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";
import type { BrowserServiceConfig, PageSession } from "./types";

/**
 * Service for managing browser instances
 * Handles browser launch, context creation, and page navigation
 */
export class BrowserService {
  private browser: Browser | null = null;
  private contexts = new Map<string, BrowserContext>();
  private config: Required<BrowserServiceConfig>;

  constructor(config: BrowserServiceConfig = {}) {
    this.config = {
      headless: config.headless ?? true,
      defaultTimeout: config.defaultTimeout ?? 30000,
      userDataDir: config.userDataDir ?? "",
      viewport: config.viewport ?? { width: 1280, height: 720 },
    };
  }

  /**
   * Launch browser instance
   */
  async launch(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    return this.browser;
  }

  /**
   * Create a new browser context (isolated session)
   */
  async createContext(contextId?: string): Promise<BrowserContext> {
    const browser = await this.launch();
    const id = contextId ?? `context-${Date.now()}`;

    const context = await browser.newContext({
      viewport: this.config.viewport,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      locale: "en-US",
      timezoneId: "America/New_York",
    });

    // Set default timeout
    context.setDefaultTimeout(this.config.defaultTimeout);

    this.contexts.set(id, context);
    return context;
  }

  /**
   * Get existing context or create new one
   */
  async getContext(contextId: string): Promise<BrowserContext | null> {
    return this.contexts.get(contextId) ?? null;
  }

  /**
   * Create a new page session
   */
  async createPage(contextId?: string): Promise<PageSession> {
    const context = contextId
      ? ((await this.getContext(contextId)) ??
        (await this.createContext(contextId)))
      : await this.createContext();

    const page = await context.newPage();

    // Enable request interception for logging/debugging if needed
    await page.route("**/*", (route) => {
      // Pass through all requests (can add filtering/logging here)
      void route.continue();
    });

    return {
      page,
      context,
      browserId: this.browser?.contexts().indexOf(context).toString() ?? "0",
      contextId: contextId ?? "default",
    };
  }

  /**
   * Navigate to URL and wait for network idle
   */
  async navigateTo(page: Page, url: string): Promise<void> {
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: this.config.defaultTimeout,
    });
  }

  /**
   * Close a specific context
   */
  async closeContext(contextId: string): Promise<void> {
    const context = this.contexts.get(contextId);
    if (context) {
      await context.close();
      this.contexts.delete(contextId);
    }
  }

  /**
   * Close all contexts
   */
  async closeAllContexts(): Promise<void> {
    await Promise.all(
      Array.from(this.contexts.values()).map((context) => context.close()),
    );
    this.contexts.clear();
  }

  /**
   * Close browser and all contexts
   */
  async close(): Promise<void> {
    await this.closeAllContexts();

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Check if browser is running
   */
  isRunning(): boolean {
    return this.browser?.isConnected() ?? false;
  }

  /**
   * Get active context count
   */
  getContextCount(): number {
    return this.contexts.size;
  }

  /**
   * Take screenshot for debugging
   */
  async screenshot(page: Page, path: string): Promise<void> {
    await page.screenshot({ path, fullPage: true });
  }
}
