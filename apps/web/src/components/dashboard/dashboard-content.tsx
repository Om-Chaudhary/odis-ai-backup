"use client";

import { OverviewClient } from "./overview";

interface DashboardContentProps {
  clinicSlug?: string;
}

export function DashboardContent({ clinicSlug }: DashboardContentProps) {
  return <OverviewClient clinicSlug={clinicSlug} />;
}
