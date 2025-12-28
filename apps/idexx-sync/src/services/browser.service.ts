/**
 * Browser Service
 *
 * Manages Playwright browser lifecycle and provides utilities for web automation.
 * Includes anti-detection measures for scraping.
 */

import { chromium } from "playwright";
import type { Browser, Page, BrowserContext } from "playwright";
import { browserLogger as logger } from "../lib/logger";
import { config, BROWSER_DEFAULTS } from "../config";
import { getSelectorVariants, SESSION_SELECTORS } from "../selectors";
import type { SelectorSet, BrowserConfig } from "../types";

/**
 * Browser Service
 *
 * Manages Playwright browser instances with:
 * - Stealth configuration to avoid detection
 * - Multi-fallback selector strategies
 * - Screenshot capture for debugging
 */
export class BrowserService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private browserConfig: BrowserConfig;

  constructor(overrides: Partial<BrowserConfig> = {}) {
    this.browserConfig = {
      headless: config.HEADLESS,
      timeout: BROWSER_DEFAULTS.TIMEOUT_MS,
      viewport: BROWSER_DEFAULTS.VIEWPORT,
      ...overrides,
    };
  }

  /**
   * Launch a new browser instance
   */
  async launch(): Promise<Browser> {
    if (this.browser) {
      await this.close();
    }

    logger.info(
      `Launching Chromium (headless: ${this.browserConfig.headless})...`,
    );

    this.browser = await chromium.launch({
      headless: this.browserConfig.headless,
    });

    logger.info("Chromium launched successfully");
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
      viewport: this.browserConfig.viewport,
      userAgent: BROWSER_DEFAULTS.USER_AGENT,
      locale: BROWSER_DEFAULTS.LOCALE,
      timezoneId: BROWSER_DEFAULTS.TIMEZONE,
      permissions: [],
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    this.context.setDefaultTimeout(this.browserConfig.timeout);

    return this.context;
  }

  /**
   * Create a new page with stealth settings
   */
  async newPage(): Promise<Page> {
    if (!this.context) {
      await this.createContext();
    }

    const page = await this.context!.newPage();

    // Add stealth settings to avoid detection
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

    logger.info("Browser closed");
  }

  /**
   * Find element using multi-fallback selector strategy
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
   * Wait for navigation with URL pattern matching
   */
  async waitForNavigation(
    page: Page,
    urlPattern: string | RegExp,
    options: { timeout?: number } = {},
  ): Promise<boolean> {
    const timeout = options.timeout ?? this.browserConfig.timeout;

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
   * Fill a form field using multi-fallback selector strategy
   */
  async fillField(
    page: Page,
    selectorSet: SelectorSet,
    value: string,
  ): Promise<boolean> {
    logger.debug(`Filling field with value: ${value.substring(0, 3)}***`);

    const element = await this.findElement(page, selectorSet);

    if (element) {
      await element.click(); // Focus the field first
      await element.fill(value);
      logger.debug("Field filled successfully");
      return true;
    }

    logger.warn("Could not find element with any selector");
    return false;
  }

  /**
   * Click an element using multi-fallback selector strategy
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
    const path = `/tmp/idexx-scrape-${name}-${timestamp}.png`;

    const buffer = await page.screenshot({
      path,
      fullPage: true,
    });

    logger.info(`Screenshot saved: ${path}`);
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
