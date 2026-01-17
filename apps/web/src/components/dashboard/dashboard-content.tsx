"use client";

import { ComprehensiveDashboard } from "./comprehensive-dashboard";

interface DashboardContentProps {
  clinicSlug?: string;
}

export function DashboardContent({ clinicSlug }: DashboardContentProps) {
  return <ComprehensiveDashboard clinicSlug={clinicSlug} />;
}
