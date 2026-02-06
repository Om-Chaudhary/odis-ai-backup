/**
 * IDEXX Neo Authentication Client
 * Handles login flow and session management
 */

import type { Page } from "playwright";
import type { PimsCredentials } from "@odis-ai/shared/types";
import type { BrowserService } from "../browser/browser-service";
import type { IdexxAuthState } from "./types";
import { IDEXX_ENDPOINTS, IDEXX_SELECTORS } from "./types";

/**
 * Authentication client for IDEXX Neo
 */
export class IdexxAuthClient {
  private authState: IdexxAuthState = {
    authenticated: false,
  };

  constructor(
    private browserService: BrowserService,
    private baseUrl: string,
  ) {}

  /**
   * Authenticate with IDEXX Neo
   */
  async authenticate(credentials: PimsCredentials): Promise<boolean> {
    const session = await this.browserService.createPage("auth-session");
    const { page } = session;

    try {
      // Navigate to login page
      await this.browserService.navigateTo(
        page,
        `${this.baseUrl}${IDEXX_ENDPOINTS.LOGIN}`,
      );

      // Fill in credentials
      await this.fillLoginForm(page, credentials);

      // Submit login
      await this.submitLogin(page);

      // Wait for navigation to complete
      await page.waitForLoadState("networkidle");

      // Check if login was successful
      const authenticated = await this.verifyAuthentication(page);

      if (authenticated) {
        // Store session cookies
        const cookies = await page.context().cookies();
        this.authState = {
          authenticated: true,
          sessionCookies: JSON.stringify(cookies),
          companyId: credentials.companyId,
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
        };
      }

      return authenticated;
    } catch (error) {
      console.error("IDEXX authentication failed:", error);
      return false;
    } finally {
      await page.close();
    }
  }

  /**
   * Fill login form with credentials
   */
  private async fillLoginForm(
    page: Page,
    credentials: PimsCredentials,
  ): Promise<void> {
    // Debug: Log what credentials we received
    console.log("[IdexxAuthClient] fillLoginForm called with:", {
      username: credentials.username,
      hasPassword: !!credentials.password,
      companyId: credentials.companyId,
      companyIdLength: credentials.companyId?.length ?? 0,
    });

    // Wait for the login form to be ready (username field is always present)
    await page.waitForSelector(IDEXX_SELECTORS.USERNAME_INPUT, {
      state: "visible",
      timeout: 15000,
    });

    // Try to fill company ID if provided AND if the field exists on the page
    if (credentials.companyId) {
      console.log(
        `[IdexxAuthClient] Company ID provided: "${credentials.companyId}"`,
      );

      // Check if company ID field exists (don't wait, just check)
      const companyIdField = await page.$(IDEXX_SELECTORS.COMPANY_ID_INPUT);

      if (companyIdField) {
        console.log("[IdexxAuthClient] Company ID field found, filling...");
        await page.fill(
          IDEXX_SELECTORS.COMPANY_ID_INPUT,
          credentials.companyId,
        );
        console.log("[IdexxAuthClient] Company ID filled successfully");
      } else {
        console.log(
          "[IdexxAuthClient] Company ID field NOT found on login page - skipping",
        );
        console.log(
          "[IdexxAuthClient] This IDEXX instance may not require company ID for login",
        );
      }
    }

    // Fill username/email
    console.log(`[IdexxAuthClient] Filling username: ${credentials.username}`);
    await page.fill(IDEXX_SELECTORS.USERNAME_INPUT, credentials.username);

    // Fill password
    console.log("[IdexxAuthClient] Filling password");
    await page.fill(IDEXX_SELECTORS.PASSWORD_INPUT, credentials.password);
    console.log("[IdexxAuthClient] All credentials filled");
  }

  /**
   * Submit login form
   */
  private async submitLogin(page: Page): Promise<void> {
    // Click login button
    await page.click(IDEXX_SELECTORS.LOGIN_BUTTON);

    // Wait for either navigation or error message
    await Promise.race([
      page.waitForNavigation({ waitUntil: "networkidle" }),
      page
        .waitForSelector(IDEXX_SELECTORS.LOGIN_ERROR, { timeout: 5000 })
        .catch(() => null),
    ]);
  }

  /**
   * Verify authentication was successful
   */
  private async verifyAuthentication(page: Page): Promise<boolean> {
    // Check if we're still on login page (failed login)
    const currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      const errorElement = await page.$(IDEXX_SELECTORS.LOGIN_ERROR);
      if (errorElement) {
        const errorText = await errorElement.textContent();
        console.error("Login error:", errorText);
      }
      return false;
    }

    // Check if we have session cookies
    const cookies = await page.context().cookies();
    const hasSessionCookie = cookies.some(
      (cookie) =>
        cookie.name.toLowerCase().includes("session") ||
        cookie.name.toLowerCase().includes("auth"),
    );

    return hasSessionCookie;
  }

  /**
   * Authenticate on an existing page by applying stored session cookies
   * @returns true if authenticated successfully
   */
  async authenticateOnPage(page: Page): Promise<boolean> {
    try {
      await this.applyAuth(page);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Apply stored authentication to a page
   */
  async applyAuth(page: Page): Promise<void> {
    if (!this.authState.authenticated || !this.authState.sessionCookies) {
      throw new Error("Not authenticated - call authenticate() first");
    }

    // Check if session expired
    if (this.authState.expiresAt && this.authState.expiresAt < new Date()) {
      this.authState.authenticated = false;
      throw new Error("Session expired - re-authentication required");
    }

    // Apply session cookies to page context
    const cookies = JSON.parse(this.authState.sessionCookies);
    await page.context().addCookies(cookies);
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    if (!this.authState.authenticated) {
      return false;
    }

    // Check if session expired
    if (this.authState.expiresAt && this.authState.expiresAt < new Date()) {
      this.authState.authenticated = false;
      return false;
    }

    return true;
  }

  /**
   * Clear authentication state
   */
  clearAuth(): void {
    this.authState = {
      authenticated: false,
    };
  }

  /**
   * Get current auth state
   */
  getAuthState(): IdexxAuthState {
    return { ...this.authState };
  }

  /**
   * Restore authentication state from cached cookies
   * @param cookiesJson - JSON stringified array of cookies
   * @returns true if state was restored successfully
   */
  restoreFromCache(cookiesJson: string): boolean {
    try {
      // Validate cookies can be parsed
      const cookies = JSON.parse(cookiesJson);
      if (!Array.isArray(cookies) || cookies.length === 0) {
        return false;
      }

      this.authState = {
        authenticated: true,
        sessionCookies: cookiesJson,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // Reset 8-hour TTL
      };

      return true;
    } catch {
      return false;
    }
  }
}
