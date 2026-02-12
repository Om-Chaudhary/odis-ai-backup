"use client";

import dynamic from "next/dynamic";
import { Suspense, type ReactNode } from "react";

// Bundle all providers into single dynamic import for parallel loading
const ProviderBundle = dynamic(
  () =>
    Promise.all([
      import("./client-posthog-provider"),
      import("~/trpc/Provider").then((mod) => mod.TRPCReactProvider),
      import("nuqs/adapters/next/app").then((mod) => mod.NuqsAdapter),
    ]).then(([PostHog, TRPC, Nuqs]) => ({
      default: function Providers({ children }: { children: ReactNode }) {
        return (
          <PostHog.default>
            <TRPC>
              <Nuqs>{children}</Nuqs>
            </TRPC>
          </PostHog.default>
        );
      },
    })),
  {
    ssr: false,
    loading: () => null,
  }
);

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <ProviderBundle>{children}</ProviderBundle>
    </Suspense>
  );
}
