"use client";

import dynamic from "next/dynamic";
import { Suspense, type ReactNode } from "react";

// Dynamically import providers with SSR disabled to prevent prerender errors
const ClientPostHogProvider = dynamic(
  () => import("./client-posthog-provider"),
  { ssr: false, loading: () => null },
);

const TRPCReactProvider = dynamic(
  () =>
    import("~/trpc/Provider").then((mod) => ({
      default: mod.TRPCReactProvider,
    })),
  { ssr: false, loading: () => null },
);

const NuqsAdapter = dynamic(
  () =>
    import("nuqs/adapters/next/app").then((mod) => ({
      default: mod.NuqsAdapter,
    })),
  { ssr: false, loading: () => null },
);

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <ClientPostHogProvider>
        <TRPCReactProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </TRPCReactProvider>
      </ClientPostHogProvider>
    </Suspense>
  );
}
