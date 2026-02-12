"use client";

import { type ReactNode, useEffect, useState, useRef } from "react";

// Lazy import PostHog modules
let posthogPromise: Promise<typeof import("posthog-js")> | null = null;
let PostHogProviderPromise: Promise<any> | null = null;
let posthogInstance: any = null;

function getPostHog() {
  if (!posthogPromise) {
    posthogPromise = import("posthog-js");
  }
  return posthogPromise;
}

function getPostHogProvider() {
  if (!PostHogProviderPromise) {
    PostHogProviderPromise = import("posthog-js/react").then(
      (mod) => mod.PostHogProvider
    );
  }
  return PostHogProviderPromise;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<any>(null);
  const initRef = useRef(false);

  useEffect(() => {
    // Defer PostHog until after critical rendering
    const timer = setTimeout(async () => {
      if (initRef.current) return;
      initRef.current = true;

      try {
        const [posthogModule, ProviderComponent] = await Promise.all([
          getPostHog(),
          getPostHogProvider(),
        ]);

        if (
          typeof window !== "undefined" &&
          process.env.NEXT_PUBLIC_POSTHOG_KEY
        ) {
          posthogModule.default.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
            api_host:
              process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
            ui_host: "https://us.posthog.com",
            capture_pageview: true,
            capture_exceptions: false,
            person_profiles: "identified_only",
            debug: false,
          });
          posthogInstance = posthogModule.default;
          setProvider(() => ProviderComponent);
        }
      } catch (error) {
        console.error("[PostHog] Failed to load:", error);
      }
    }, 1500); // Load after 1.5s

    return () => clearTimeout(timer);
  }, []);

  // Render children immediately, wrap when PostHog ready
  if (!Provider || !posthogInstance) {
    return <>{children}</>;
  }

  return <Provider client={posthogInstance}>{children}</Provider>;
}
