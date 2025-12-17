"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { type ReactNode, useEffect, useState } from "react";

// Track if PostHog has been initialized
let posthogInitialized = false;

export function PostHogProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Initialize PostHog only once on the client
    if (
      typeof window !== "undefined" &&
      !posthogInitialized &&
      process.env.NEXT_PUBLIC_POSTHOG_KEY
    ) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        ui_host: "https://us.posthog.com",
        capture_pageview: false, // Disable automatic pageview - capture manually for SPA
        capture_exceptions: true,
        person_profiles: "identified_only", // Only create profiles for identified users
        debug: false, // Disable debug mode to reduce console noise
      });
      posthogInitialized = true;
    }
    setIsClient(true);
  }, []);

  // During SSR/SSG, render children without the PostHog provider
  // This prevents useRef errors during static generation
  if (!isClient) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
