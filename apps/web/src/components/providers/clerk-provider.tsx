"use client";

import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { clerkAppearance } from "~/lib/clerk-theme";

interface ClerkProviderProps {
  children: ReactNode;
}

// Check if Clerk is configured
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * Clerk authentication provider
 *
 * Wraps the application with Clerk's authentication context.
 * Uses custom teal theme appearance to match the Odis AI brand.
 *
 * If Clerk is not configured (no publishable key), renders children directly
 * to allow the app to work with existing Supabase Auth.
 */
export function ClerkProvider({ children }: ClerkProviderProps) {
  // If Clerk is not configured, just render children (use existing Supabase Auth)
  if (!isClerkConfigured) {
    return <>{children}</>;
  }

  return (
    <BaseClerkProvider
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignOutUrl="/"
    >
      {children}
    </BaseClerkProvider>
  );
}

export default ClerkProvider;
