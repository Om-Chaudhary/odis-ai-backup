/**
 * Auth Service
 *
 * Handles IDEXX Neo authentication and login flow.
 */

import type { Page } from "playwright";
import { authLogger as logger } from "../lib/logger";
import { IDEXX_URLS } from "../config";
import { LOGIN_SELECTORS, DASHBOARD_SELECTORS } from "../selectors";
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

      // Wait for navigation to dashboard
      const navigated = await this.browser.waitForNavigation(
        page,
        /dashboard|home|schedule/i,
        { timeout: 30000 },
      );

      if (!navigated) {
        await this.handleLoginFailure(page);
        return false;
      }

      // Verify login succeeded
      const verified = await this.verifyLogin(page);
      if (!verified) {
        logger.error("Login verification failed - user menu not found");
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
   * Verify login by checking for dashboard elements
   */
  async verifyLogin(page: Page): Promise<boolean> {
    const userMenu = await this.browser.findElement(
      page,
      DASHBOARD_SELECTORS.userMenu,
      { timeout: 5000 },
    );

    return userMenu !== null;
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
