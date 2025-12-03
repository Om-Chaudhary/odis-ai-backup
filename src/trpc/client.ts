"use client";

import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

export const api = createTRPCReact<AppRouter>({});

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;

function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser should use relative path
  // reference vercel url if available, otherwise assume localhost
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const port = process.env.PORT ?? 3000;
  return `http://localhost:${port}`;
}

export function getTRPCClientLinks() {
  const links = [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === "development" ||
        (opts.direction === "down" && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include", // Include cookies for authentication
        });
      },
    }),
  ];
  return links;
}
