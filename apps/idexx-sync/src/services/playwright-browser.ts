/**
 * Playwright Browser Service
 *
 * Manages browser lifecycle and provides utilities for IDEXX Neo automation.
 * Handles headless Chromium with anti-detection measures.
 */

import { chromium } from "playwright";
import type { Browser, Page, BrowserContext } from "playwright";
import { getSelectorVariants, SESSION_SELECTORS } from "../utils/selectors";
import type { SelectorSet } from "../utils/selectors";

export interface BrowserConfig {
  headless: boolean;
  timeout: number;
  viewport: { width: number; height: number };
}

const DEFAULT_CONFIG: BrowserConfig = {
  headless: true,
  timeout: 30000,
  viewport: { width: 1920, height: 1080 },
};

/**
 * Playwright Browser Service
 *
 * Singleton-like service for managing Playwright browser instances.
 */
export class PlaywrightBrowser {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: BrowserConfig;

  constructor(config: Partial<BrowserConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Launch a new browser instance
   */
  async launch(): Promise<Browser> {
    if (this.browser) {
      await this.close();
    }

    console.log("[BROWSER] Launching Chromium...");

    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-web-security",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    console.log("[BROWSER] Chromium launched successfully");

    return this.browser;
  }

  /**
   * Create a new browser context with realistic settings
   */
  async createContext(): Promise<BrowserContext> {
    if (!this.browser) {
      await this.launch();
    }

    this.context = await this.browser!.newContext({
      viewport: this.config.viewport,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      locale: "en-US",
      timezoneId: "America/Los_Angeles",
      permissions: [],
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    // Set default timeout
    this.context.setDefaultTimeout(this.config.timeout);

    return this.context;
  }

  /**
   * Create a new page in the current context
   */
  async newPage(): Promise<Page> {
    if (!this.context) {
      await this.createContext();
    }

    const page = await this.context!.newPage();

    // Add stealth settings - runs in browser context
    await page.addInitScript(`
      // Override webdriver detection
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });

      // Override plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override languages
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });
    `);

    return page;
  }

  /**
   * Close the browser and all contexts
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    console.log("[BROWSER] Browser closed");
  }

  /**
   * Try multiple selectors and return the first match
   */
  async findElement(
    page: Page,
    selectorSet: SelectorSet,
    options: { timeout?: number } = {},
  ): Promise<ReturnType<Page["locator"]> | null> {
    const selectors = getSelectorVariants(selectorSet);
    const timeout = options.timeout ?? 5000;

    for (const selector of selectors) {
      try {
        const locator = page.locator(selector);
        await locator.waitFor({ timeout, state: "visible" });
        return locator;
      } catch {
        // Try next selector
        continue;
      }
    }

    return null;
  }

  /**
   * Wait for navigation with retry logic
   */
  async waitForNavigation(
    page: Page,
    urlPattern: string | RegExp,
    options: { timeout?: number } = {},
  ): Promise<boolean> {
    const timeout = options.timeout ?? this.config.timeout;

    try {
      await page.waitForURL(urlPattern, { timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if session has expired
   */
  async isSessionExpired(page: Page): Promise<boolean> {
    const sessionExpired = await this.findElement(
      page,
      SESSION_SELECTORS.sessionExpired,
      { timeout: 1000 },
    );

    const loginRequired = await this.findElement(
      page,
      SESSION_SELECTORS.loginRequired,
      { timeout: 1000 },
    );

    return sessionExpired !== null || loginRequired !== null;
  }

  /**
   * Fill a form field using multiple selector strategies
   */
  async fillField(
    page: Page,
    selectorSet: SelectorSet,
    value: string,
  ): Promise<boolean> {
    const element = await this.findElement(page, selectorSet);

    if (element) {
      await element.fill(value);
      return true;
    }

    return false;
  }

  /**
   * Click an element using multiple selector strategies
   */
  async clickElement(page: Page, selectorSet: SelectorSet): Promise<boolean> {
    const element = await this.findElement(page, selectorSet);

    if (element) {
      await element.click();
      return true;
    }

    return false;
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(page: Page, name: string): Promise<Buffer> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const buffer = await page.screenshot({
      path: `/tmp/idexx-sync-${name}-${timestamp}.png`,
      fullPage: true,
    });

    console.log(`[BROWSER] Screenshot saved: ${name}-${timestamp}.png`);

    return buffer;
  }

  /**
   * Get current browser instance
   */
  getBrowser(): Browser | null {
    return this.browser;
  }

  /**
   * Get current context
   */
  getContext(): BrowserContext | null {
    return this.context;
  }
}
