"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useOptionalClinic } from "@odis-ai/shared/ui/clinic-context";
import React from "react";

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const clinicContext = useOptionalClinic();

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

  // Build clinic dashboard URL
  const clinicSlug = segments[1];
  const clinicDashboardUrl = clinicSlug ? `/dashboard/${clinicSlug}` : null;

  // Minimal breadcrumb - just show current location
  const isOnHomePage = segments.length === 2;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center">
      <ol className="flex items-center gap-1 text-xs">
        {/* Clinic name - always clickable when not on home */}
        {clinicContext && (
          <li>
            {currentPage && clinicDashboardUrl ? (
              <Link
                href={clinicDashboardUrl}
                className="text-slate-500 transition-colors hover:text-teal-600"
              >
                {clinicContext.clinicName}
              </Link>
            ) : (
              <span className="font-medium text-slate-700">
                {clinicContext.clinicName}
              </span>
            )}
          </li>
        )}

        {/* Separator + Current page */}
        {currentPage && (
          <>
            <li className="hidden text-slate-300 md:block">
              <ChevronRight className="h-3 w-3" />
            </li>
            <li className="hidden md:block">
              <span className="font-medium text-slate-700">
                {getBreadcrumbName(currentPage)}
              </span>
            </li>
          </>
        )}

        {/* Home indicator when on dashboard root */}
        {isOnHomePage && clinicContext && (
          <>
            <li className="hidden text-slate-300 md:block">
              <ChevronRight className="h-3 w-3" />
            </li>
            <li className="hidden md:block">
              <span className="text-slate-400">Overview</span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
