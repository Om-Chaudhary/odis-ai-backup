"use client";

import type React from "react";
import { PostHogProvider } from "~/components/PostHogProvider";

export default function ClientPostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PostHogProvider>{children}</PostHogProvider>;
}
