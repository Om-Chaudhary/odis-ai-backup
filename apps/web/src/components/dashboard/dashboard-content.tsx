"use client";

import { DashboardOverview } from "./overview";

interface DashboardContentProps {
  clinicSlug?: string;
}

export function DashboardContent({ clinicSlug }: DashboardContentProps) {
  return <DashboardOverview clinicSlug={clinicSlug} />;
}
