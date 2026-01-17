"use client";

import { OverviewDashboard } from "./overview";

interface DashboardContentProps {
  clinicSlug?: string;
}

export function DashboardContent({ clinicSlug }: DashboardContentProps) {
  return <OverviewDashboard clinicSlug={clinicSlug} />;
}
