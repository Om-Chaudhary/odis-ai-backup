/**
 * Auth Service
 *
 * Handles IDEXX Neo authentication and login flow.
 */

import type { Page } from "playwright";
import { authLogger as logger } from "../lib/logger";
import { IDEXX_URLS } from "../config";
import { LOGIN_SELECTORS } from "../selectors";
import type { BrowserService } from "./browser.service";
import type { IdexxCredentials } from "../types";

/**
 * Auth Service
 *
 * Manages IDEXX Neo login:
 * - Fill login form
 * - Handle 2FA detection
 * - Verify successful login
 */
export class AuthService {
  constructor(private browser: BrowserService) {}

  /**
   * Login to IDEXX Neo
   *
   * @param page - Playwright page instance
   * @param credentials - IDEXX credentials
   * @returns true if login successful
   */
  async login(page: Page, credentials: IdexxCredentials): Promise<boolean> {
    try {
      logger.info("Logging into IDEXX Neo...");

      // Navigate to login page
      await page.goto(IDEXX_URLS.LOGIN, {
        waitUntil: "networkidle",
      });

      // Fill company ID if provided
      if (credentials.companyId) {
        const companyIdFilled = await this.browser.fillField(
          page,
          LOGIN_SELECTORS.companyIdInput,
          credentials.companyId,
        );

        if (!companyIdFilled) {
          logger.error("Could not find company ID field");
          return false;
        }
      }

      // Fill username
      const usernameFilled = await this.browser.fillField(
        page,
        LOGIN_SELECTORS.usernameInput,
        credentials.username,
      );

      if (!usernameFilled) {
        logger.error("Could not find username field");
        return false;
      }

      // Fill password
      const passwordFilled = await this.browser.fillField(
        page,
        LOGIN_SELECTORS.passwordInput,
        credentials.password,
      );

      if (!passwordFilled) {
        logger.error("Could not find password field");
        return false;
      }

      // Click submit
      await this.browser.clickElement(page, LOGIN_SELECTORS.submitButton);

      // Wait for navigation to dashboard (URL-based verification)
      const navigated = await this.browser.waitForNavigation(
        page,
        /dashboard|home|schedule/i,
        { timeout: 30000 },
      );

      if (!navigated) {
        await this.handleLoginFailure(page);
        return false;
      }

      // Verify login by checking URL and cookies
      const verified = await this.verifyLogin(page);
      if (!verified) {
        logger.error("Login verification failed - not on dashboard");
        return false;
      }

      logger.info("Login successful");
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Login error: ${msg}`);
      return false;
    }
  }

  /**
   * Verify login by checking URL and authentication cookies
   */
  async verifyLogin(page: Page): Promise<boolean> {
    const url = page.url();

    // Check if we're on a dashboard/authenticated page
    const isOnDashboard = /dashboard|schedule|home|patients|clients/i.test(url);

    if (isOnDashboard) {
      logger.debug(`Verified login via URL: ${url}`);
      return true;
    }

    // Fallback: check for authentication cookies
    const context = page.context();
    const cookies = await context.cookies();
    const hasAuthCookie = cookies.some(
      (c) =>
        c.name.toLowerCase().includes("auth") ||
        c.name.toLowerCase().includes("session") ||
        c.name.toLowerCase().includes("token"),
    );

    if (hasAuthCookie) {
      logger.debug("Verified login via authentication cookie");
      return true;
    }

    logger.debug(
      `Current URL: ${url}, Cookies: ${cookies.map((c) => c.name).join(", ")}`,
    );
    return false;
  }

  /**
   * Handle login failure - check for error messages and 2FA
   */
  private async handleLoginFailure(page: Page): Promise<void> {
    // Check for error message
    const errorElement = await this.browser.findElement(
      page,
      LOGIN_SELECTORS.errorMessage,
      { timeout: 2000 },
    );

    if (errorElement) {
      const errorText = await errorElement.textContent();
      logger.error(`Login error message displayed: ${errorText}`);
    }

    // Check for 2FA
    const twoFactorElement = await this.browser.findElement(
      page,
      LOGIN_SELECTORS.twoFactorInput,
      { timeout: 2000 },
    );

    if (twoFactorElement) {
      logger.error("2FA required - cannot proceed automatically");
    }
  }
}
