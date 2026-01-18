/**
 * IDEXX Neo Authentication Client
 * Handles login flow and session management
 */

import type { Page } from "playwright";
import type { PimsCredentials } from "@odis-ai/domain/sync";
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
    // Wait for form to be visible
    await page.waitForSelector(IDEXX_SELECTORS.USERNAME_INPUT, {
      state: "visible",
    });

    // Fill username/email
    await page.fill(IDEXX_SELECTORS.USERNAME_INPUT, credentials.username);

    // Fill password
    await page.fill(IDEXX_SELECTORS.PASSWORD_INPUT, credentials.password);

    // Fill company ID if present
    if (credentials.companyId) {
      const companyIdInput = await page.$(IDEXX_SELECTORS.COMPANY_ID_INPUT);
      if (companyIdInput) {
        await page.fill(
          IDEXX_SELECTORS.COMPANY_ID_INPUT,
          credentials.companyId,
        );
      }
    }
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
}
