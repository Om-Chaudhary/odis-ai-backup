"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import type { ReactNode } from "react";

// Initialize PostHog at module level (client-side only)
// This follows the official PostHog + Next.js best practice
// The typeof window check ensures this only runs in the browser
if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    ui_host: "https://us.posthog.com",
    capture_pageview: false, // Disable automatic pageview - capture manually for SPA
    capture_exceptions: true,
    person_profiles: "identified_only", // Only create profiles for identified users
    debug: false, // Disable debug mode to reduce console noise
  });
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
