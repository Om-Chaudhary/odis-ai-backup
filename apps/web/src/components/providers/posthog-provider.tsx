"use client";

import { type ReactNode, useEffect, useState, useRef } from "react";

type PostHogProviderComponent = React.ComponentType<{
  client: unknown;
  children?: ReactNode;
}>;

// Lazy import PostHog modules
let posthogPromise: Promise<{
  default: { init: (key: string, opts: Record<string, unknown>) => void };
}> | null = null;
let PostHogProviderPromise: Promise<PostHogProviderComponent> | null = null;
let posthogInstance: unknown = null;

function getPostHog() {
  posthogPromise ??= import("posthog-js");
  return posthogPromise;
}

function getPostHogProvider() {
  PostHogProviderPromise ??= import("posthog-js/react").then(
    (mod) => mod.PostHogProvider as PostHogProviderComponent,
  );
  return PostHogProviderPromise;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<PostHogProviderComponent | null>(
    null,
  );
  const initRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (initRef.current) return;
      initRef.current = true;

      try {
        const [posthogModule, ProviderComponent] = await Promise.all([
          getPostHog(),
          getPostHogProvider(),
        ]);

        if (cancelled) return;

        if (
          typeof window !== "undefined" &&
          process.env.NEXT_PUBLIC_POSTHOG_KEY
        ) {
          posthogModule.default.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
            api_host:
              process.env.NEXT_PUBLIC_POSTHOG_HOST ??
              "https://us.i.posthog.com",
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
        if (!cancelled) console.error("[PostHog] Failed to load:", error);
      }
    };

    // Defer PostHog until after critical rendering
    const timer = setTimeout(() => {
      void run();
    }, 1500); // Load after 1.5s

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // Render children immediately, wrap when PostHog ready
  if (!Provider || !posthogInstance) {
    return <>{children}</>;
  }

  return <Provider client={posthogInstance}>{children}</Provider>;
}
