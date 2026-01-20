"use client";

import { usePathname } from "next/navigation";
import React from "react";

export function DashboardBreadcrumb() {
  const pathname = usePathname();

  // Simple path mapping logic
  const segments = pathname.split("/").filter(Boolean);
  // segments[0] is 'dashboard', segments[1] is clinicSlug, segments[2] is page

  const getBreadcrumbName = (segment: string) => {
    // For specific routes, use custom names
    switch (segment) {
      case "inbound":
        return "After Hours";
      case "outbound":
        return "Discharge";
      case "cases":
        return "Cases";
      case "patients":
        return "Patients";
      case "schedule":
        return "Schedule";
      case "settings":
        return "Settings";
      case "support":
        return "Support";
      case "activity":
        return "Activity";
      case "analytics":
        return "Analytics";
      case "billing":
        return "Billing";
      default:
        return segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
    }
  };

  // Extract page from path - format: /dashboard/[clinicSlug]/[page]
  const currentPage = segments[2]; // inbound, outbound, settings, etc.

  // Minimal breadcrumb - just show current location
  const isOnHomePage = segments.length === 2;

  // Display current page name, or "Overview" if on dashboard root
  const displayName = currentPage
    ? getBreadcrumbName(currentPage)
    : isOnHomePage
      ? "Overview"
      : null;

  if (!displayName) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center">
      <span className="text-sm font-medium text-slate-700">{displayName}</span>
    </nav>
  );
}
