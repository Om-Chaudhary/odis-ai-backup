"use client";

import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { ReactNode } from "react";

interface ClerkProviderProps {
  children: ReactNode;
}

// Check if Clerk is configured
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * Clerk authentication provider
 *
 * Wraps the application with Clerk's authentication context.
 * Uses dark theme appearance to match the ODIS AI design.
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
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#0D9488", // Teal-600 to match ODIS brand
          colorBackground: "#0A2E2E", // Dark teal background
          colorInputBackground: "#134E4A", // Teal-900
          colorInputText: "#F0FDFA", // Teal-50
        },
        elements: {
          formButtonPrimary:
            "bg-teal-600 hover:bg-teal-700 text-white font-medium",
          card: "bg-teal-950 border-teal-800",
          headerTitle: "text-teal-50",
          headerSubtitle: "text-teal-300",
          socialButtonsBlockButton:
            "bg-teal-900 border-teal-700 text-teal-100 hover:bg-teal-800",
          socialButtonsBlockButtonText: "text-teal-100",
          formFieldLabel: "text-teal-200",
          formFieldInput:
            "bg-teal-900 border-teal-700 text-teal-50 placeholder:text-teal-400",
          footerActionLink: "text-teal-400 hover:text-teal-300",
          identityPreviewText: "text-teal-200",
          identityPreviewEditButton: "text-teal-400 hover:text-teal-300",
          organizationSwitcherTrigger:
            "bg-teal-900 border-teal-700 text-teal-100",
          organizationPreviewMainIdentifier: "text-teal-100",
          organizationPreviewSecondaryIdentifier: "text-teal-400",
        },
      }}
      afterSignOutUrl="/"
    >
      {children}
    </BaseClerkProvider>
  );
}

export default ClerkProvider;
