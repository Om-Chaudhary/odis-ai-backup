/**
 * Browser configuration and types
 */

import type { Browser, BrowserContext, Page } from "playwright";

/**
 * Configuration for browser pool
 */
export interface BrowserPoolConfig {
  /**
   * Maximum number of concurrent browser instances
   * @default 3
   */
  maxBrowsers?: number;

  /**
   * Maximum number of contexts per browser
   * @default 5
   */
  maxContextsPerBrowser?: number;

  /**
   * Browser launch options
   */
  headless?: boolean;

  /**
   * Browser timeout in milliseconds
   * @default 30000
   */
  defaultTimeout?: number;

  /**
   * User data directory for persistent sessions
   */
  userDataDir?: string;
}

/**
 * Browser instance wrapper
 */
export interface BrowserInstance {
  browser: Browser;
  contexts: BrowserContext[];
  createdAt: Date;
  lastUsed: Date;
}

/**
 * Browser context wrapper
 */
export interface ContextInstance {
  context: BrowserContext;
  browserId: string;
  createdAt: Date;
  lastUsed: Date;
  inUse: boolean;
}

/**
 * Page session for scraping
 */
export interface PageSession {
  page: Page;
  context: BrowserContext;
  browserId: string;
  contextId: string;
}

/**
 * Browser service configuration
 */
export interface BrowserServiceConfig {
  headless?: boolean;
  defaultTimeout?: number;
  userDataDir?: string;
  viewport?: {
    width: number;
    height: number;
  };
}
