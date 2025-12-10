"use client";

import type React from "react";
import { PostHogProvider } from "./posthog-provider";

export default function ClientPostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PostHogProvider>{children}</PostHogProvider>;
}
