/**
 * Shared IDEXX API Fetch Utilities
 *
 * Provides reusable patterns for making authenticated API calls to IDEXX Neo
 * via Playwright page.evaluate() with fetch().
 */

import type { Page } from "playwright";

/**
 * Options for IDEXX fetch operations
 */
export interface IdexxFetchOptions<TBody = unknown> {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: TBody;
  csrfToken?: string | null;
  contentType?: "json" | "form-data";
  timeout?: number;
}

/**
 * Result from IDEXX fetch operation
 */
export interface IdexxFetchResult<TData = unknown> {
  ok: boolean;
  status: number;
  statusText: string;
  data: TData;
}

/**
 * Perform authenticated fetch to IDEXX Neo API via page.evaluate()
 *
 * Handles:
 * - CSRF token injection
 * - Content-Type headers (JSON or multipart/form-data)
 * - Credentials and CORS headers
 * - Error handling
 *
 * @example JSON POST
 * ```typescript
 * const result = await idexxFetch(page, `${baseUrl}/clients/create`, {
 *   method: "POST",
 *   body: { first_name: "John", last_name: "Doe" },
 *   csrfToken: await extractCsrfToken(page),
 *   contentType: "json",
 * });
 * ```
 *
 * @example Form-data POST
 * ```typescript
 * const result = await idexxFetch(page, `${baseUrl}/appointments/create`, {
 *   method: "POST",
 *   body: { date: "2024-01-15", start_time: "10:00" },
 *   csrfToken: await extractCsrfToken(page),
 *   contentType: "form-data",
 * });
 * ```
 *
 * @example GET request
 * ```typescript
 * const result = await idexxFetch<PatientData[]>(page, `${baseUrl}/search/patients?q=fluffy`);
 * ```
 */
export async function idexxFetch<TData = unknown, TBody = unknown>(
  page: Page,
  url: string,
  options: IdexxFetchOptions<TBody> = {},
): Promise<IdexxFetchResult<TData>> {
  const {
    method = "GET",
    body,
    csrfToken,
    contentType = "json",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    timeout = 30000,
  } = options;

  // The callback runs in browser context where DOM APIs are available
  const result = await page.evaluate(
    async (args: {
      url: string;
      method: string;
      body?: unknown;
      csrfToken: string | null;
      contentType: string;
    }) => {
      // Build headers
      const headers: Record<string, string> = {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      };

      // Add CSRF token if provided
      if (args.csrfToken) {
        headers["X-CSRF-Token"] = args.csrfToken;
      }

      // Build request body (FormData or string for JSON)
      let requestBody: FormData | string | undefined;

      if (args.body) {
        if (args.contentType === "form-data") {
          // Build multipart/form-data
          const form = new FormData();
          const bodyRecord = args.body as Record<string, string | number | boolean>;
          for (const [key, value] of Object.entries(bodyRecord)) {
            form.append(key, String(value));
          }
          requestBody = form;
          // Don't set Content-Type header - browser will set it with boundary
        } else {
          // JSON body
          headers["Content-Type"] = "application/json";
          requestBody = JSON.stringify(args.body);
        }
      }

      // Execute fetch
      const res = await fetch(args.url, {
        method: args.method,
        credentials: "include",
        headers,
        body: requestBody,
      });

      // Parse response
      const responseData = await res.json().catch(() => ({ parseError: true }));

      return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        data: responseData,
      };
    },
    { url, method, body, csrfToken: csrfToken ?? null, contentType },
  );

  return result as IdexxFetchResult<TData>;
}

/**
 * Extract CSRF token from page
 *
 * Checks multiple common locations in order:
 * 1. Meta tags (name="csrf-token", name="csrf_token", name="_csrf")
 * 2. Cookies (csrf_token, XSRF-TOKEN, _csrf)
 * 3. Hidden form inputs
 *
 * @returns CSRF token string or null if not found
 *
 * @example
 * ```typescript
 * const csrfToken = await extractCsrfToken(page);
 * if (!csrfToken) {
 *   console.warn("No CSRF token found - request may fail");
 * }
 * ```
 */
export async function extractCsrfToken(page: Page): Promise<string | null> {
  try {
    // This code runs in browser context via page.evaluate() where DOM APIs are available
    // We use a string function to avoid TypeScript DOM type issues
    const token = await page.evaluate(`
      (function() {
        // 1. Check meta tags
        var metaSelectors = [
          'meta[name="csrf-token"]',
          'meta[name="csrf_token"]',
          'meta[name="_csrf"]',
          'meta[name="X-CSRF-Token"]'
        ];

        for (var i = 0; i < metaSelectors.length; i++) {
          var meta = document.querySelector(metaSelectors[i]);
          if (meta) {
            var content = meta.getAttribute("content");
            if (content) {
              return content;
            }
          }
        }

        // 2. Check cookies
        var cookieNames = ["csrf_token", "XSRF-TOKEN", "_csrf", "csrftoken"];
        var cookies = document.cookie.split(";");

        for (var j = 0; j < cookies.length; j++) {
          var parts = cookies[j].trim().split("=");
          var name = parts[0];
          var value = parts[1];
          if (name && cookieNames.indexOf(name) !== -1 && value) {
            return decodeURIComponent(value);
          }
        }

        // 3. Check hidden form inputs
        var inputSelectors = [
          'input[name="csrf_token"]',
          'input[name="_csrf"]',
          'input[name="csrfmiddlewaretoken"]'
        ];

        for (var k = 0; k < inputSelectors.length; k++) {
          var input = document.querySelector(inputSelectors[k]);
          if (input && input.value) {
            return input.value;
          }
        }

        return null;
      })()
    `) as string | null;

    return token;
  } catch (error) {
    console.error("[CSRF] Failed to extract CSRF token:", error);
    return null;
  }
}
