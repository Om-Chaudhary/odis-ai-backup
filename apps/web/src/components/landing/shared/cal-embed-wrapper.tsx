"use client";

import dynamic from "next/dynamic";
import { type ComponentProps } from "react";

// Dynamically import CalEmbed to prevent SSR issues
const CalEmbedDynamic = dynamic(
  () => import("./cal-embed").then((mod) => mod.CalEmbed),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[600px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-teal-600"></div>
          <p className="text-muted-foreground mt-4 text-sm">
            Loading calendar...
          </p>
        </div>
      </div>
    ),
  },
);

type CalEmbedProps = ComponentProps<typeof CalEmbedDynamic>;

/**
 * Cal.com embed wrapper with dynamic loading
 * Prevents SSR issues and provides loading state
 */
export function CalEmbedWrapper(props: CalEmbedProps) {
  return <CalEmbedDynamic {...props} />;
}
