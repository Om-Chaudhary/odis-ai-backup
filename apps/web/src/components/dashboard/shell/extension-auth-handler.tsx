"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@odis-ai/data-access/db/client";
import {
  AUTH_PARAMS,
  AUTH_ERRORS,
  MIN_TOKEN_LENGTH,
} from "@odis-ai/shared/constants/auth";

interface ExtensionAuthHandlerProps {
  children: React.ReactNode;
}

/**
 * Checks if a JWT token is expired
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return true; // Invalid JWT format
    }
    const payload = JSON.parse(atob(parts[1] ?? ""));
    const exp = payload.exp;
    if (!exp) {
      return false; // No expiration claim, assume valid
    }
    const expTime = exp * 1000; // Convert to milliseconds
    const now = Date.now();
    // Add 5 minute buffer to account for clock skew
    return now >= expTime - 5 * 60 * 1000;
  } catch {
    return true; // If we can't parse, assume expired for safety
  }
}

/**
 * Validates token format and length
 */
function validateToken(token: string): void {
  if (!token || token.length < MIN_TOKEN_LENGTH) {
    throw new Error("Invalid token format: token too short");
  }
  // JWT tokens should contain dots (header.payload.signature)
  if (!token.includes(".")) {
    throw new Error("Invalid token format: not a valid JWT");
  }
}

/**
 * Sets Supabase session with retry logic for network errors
 */
async function setSessionWithRetry(
  supabase: ReturnType<typeof createClient>,
  accessToken: string,
  refreshToken: string,
  maxRetries = 2,
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (!error) {
        return; // Success
      }

      lastError = error;

      // Don't retry on authentication errors (invalid token, expired, etc.)
      if (
        error.message.includes("expired") ||
        error.message.includes("invalid") ||
        error.message.includes("JWT")
      ) {
        throw error;
      }

      // Retry on network errors
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1)),
        );
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on validation errors
      if (
        error instanceof Error &&
        (error.message.includes("expired") ||
          error.message.includes("invalid") ||
          error.message.includes("JWT"))
      ) {
        throw error;
      }

      // Retry on network errors
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1)),
        );
      }
    }
  }

  // If we get here, all retries failed
  throw lastError ?? new Error("Failed to set session after retries");
}

/**
 * Handles authentication tokens passed from Chrome extension via URL parameters.
 * Validates the token, sets the Supabase session, and cleans the URL.
 */
export function ExtensionAuthHandler({ children }: ExtensionAuthHandlerProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const processedTokensRef = useRef<Set<string>>(new Set());
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function handleExtensionAuth() {
      const authToken = searchParams.get(AUTH_PARAMS.AUTH_TOKEN);
      const refreshToken = searchParams.get(AUTH_PARAMS.REFRESH_TOKEN);
      const returnUrl =
        searchParams.get(AUTH_PARAMS.RETURN_URL) ?? "/dashboard";

      // Only process if we have an auth_token
      if (!authToken) {
        return;
      }

      // Create a unique key for this token to prevent duplicate processing
      const tokenKey = authToken.substring(0, Math.min(20, authToken.length));

      // Check if we've already processed this token (using ref to persist across re-renders)
      if (processedTokensRef.current.has(tokenKey)) {
        return;
      }

      // Mark as processing
      processedTokensRef.current.add(tokenKey);
      setIsAuthenticating(true);

      try {
        // Validate token format
        validateToken(authToken);

        // Decode URL-encoded token
        const decodedAccessToken = decodeURIComponent(authToken);
        const decodedRefreshToken = refreshToken
          ? decodeURIComponent(refreshToken)
          : "";

        // Validate refresh token if provided
        if (decodedRefreshToken) {
          validateToken(decodedRefreshToken);
        }

        // Check if token is expired before attempting to set session
        if (isTokenExpired(decodedAccessToken)) {
          throw new Error("Token has expired");
        }

        // Set session with Supabase (with retry logic)
        await setSessionWithRetry(
          supabase,
          decodedAccessToken,
          decodedRefreshToken,
        );

        // Validate the session by getting the user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("Invalid token: unable to authenticate user");
        }

        // Success: clean URL and redirect
        // Remove only auth-related params, preserve others
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete(AUTH_PARAMS.AUTH_TOKEN);
        currentUrl.searchParams.delete(AUTH_PARAMS.REFRESH_TOKEN);
        currentUrl.searchParams.delete(AUTH_PARAMS.RETURN_URL);

        // Use returnUrl if specified, otherwise use cleaned current URL
        const cleanUrl = returnUrl?.startsWith("/")
          ? returnUrl
          : currentUrl.pathname + (currentUrl.search ? currentUrl.search : "");

        window.history.replaceState({}, "", cleanUrl);

        // Keep loading state during refresh to prevent flash
        // Refresh the router to reflect the new URL and trigger server-side auth check
        router.refresh();

        // Remove from processed set after successful auth (allows re-auth if needed)
        processedTokensRef.current.delete(tokenKey);
      } catch (error) {
        // Remove from processed set on error to allow retry
        processedTokensRef.current.delete(tokenKey);

        // Handle errors gracefully - don't expose token details
        let errorMessage: (typeof AUTH_ERRORS)[keyof typeof AUTH_ERRORS] =
          AUTH_ERRORS.INVALID_TOKEN;

        if (error instanceof Error) {
          // Check for specific error types
          if (
            error.message.includes("expired") ||
            error.message.includes("Expired")
          ) {
            errorMessage = AUTH_ERRORS.TOKEN_EXPIRED;
          } else if (
            error.message.includes("network") ||
            error.message.includes("fetch") ||
            error.message.includes("Network")
          ) {
            errorMessage = AUTH_ERRORS.NETWORK_ERROR;
          }

          // Log error details only in development
          if (process.env.NODE_ENV === "development") {
            console.error("Extension authentication failed:", error.message);
          }
          // In production, errors should be logged to error tracking service
          // but not exposed to console
        }

        // Redirect to login with error parameter
        const loginUrl = new URL("/login", window.location.origin);
        loginUrl.searchParams.set("error", errorMessage);
        router.push(loginUrl.pathname + loginUrl.search);
      } finally {
        // Note: We don't set isAuthenticating to false here because
        // router.refresh() will cause a re-render, and we want to keep
        // the loading state until the server component renders with the authenticated user
        // The loading state will be cleared when the component unmounts/remounts
      }
    }

    void handleExtensionAuth();
  }, [searchParams, router, supabase]);

  // Show loading state while authenticating
  if (isAuthenticating) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Authenticating"
      >
        <div className="text-center">
          <div
            className="border-primary mx-auto h-12 w-12 animate-spin rounded-full border-t-2 border-b-2"
            aria-hidden="true"
          />
          <p className="text-muted-foreground mt-4">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Render children once authentication is complete (or if no token was present)
  return <>{children}</>;
}
