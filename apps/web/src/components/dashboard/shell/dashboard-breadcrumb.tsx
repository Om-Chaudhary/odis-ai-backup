"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@odis-ai/shared/ui/breadcrumb";
import { useOptionalClinic } from "@odis-ai/shared/ui/clinic-context";
import React from "react";

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const clinicContext = useOptionalClinic();

  // Simple path mapping logic
  const segments = pathname.split("/").filter(Boolean);
  // segments[0] is 'dashboard', segments[1] is clinicSlug, segments[2] is page

  const formatSlugToTitle = (slug: string) => {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getBreadcrumbName = (segment: string) => {
    // For specific routes, use custom names
    switch (segment) {
      case "inbound":
        return "After Hours";
      case "outbound":
        return "Discharge Communications";
      case "cases":
        return "Discharge Management";
      case "patients":
        return "Patients";
      case "schedule":
        return "Schedule";
      case "settings":
        return "Settings";
      case "support":
        return "Help & Support";
      case "activity":
        return "Activity Log";
      case "analytics":
        return "Analytics";
      default:
        return formatSlugToTitle(segment);
    }
  };

  const getFilterName = (page: string, filterParam: string | null) => {
    if (!filterParam) return null;

    // Inbound filters (outcome parameter)
    if (page === "inbound") {
      switch (filterParam) {
        case "all":
          return "All Calls";
        case "emergency":
          return "Emergency";
        case "appointment":
          return "Appointments";
        case "callback":
          return "Callback";
        case "info":
          return "Info";
        default:
          return formatSlugToTitle(filterParam);
      }
    }

    // Outbound filters (view parameter)
    if (page === "outbound") {
      switch (filterParam) {
        case "all":
          return "All Calls";
        case "needs_attention":
          return "Needs Attention";
        default:
          return formatSlugToTitle(filterParam);
      }
    }

    return null;
  };

  // Extract page from path - format: /dashboard/[clinicSlug]/[page]
  const currentPage = segments[2]; // inbound, outbound, settings, etc.

  // Get filter parameter based on the page
  const outcomeFilter = searchParams.get("outcome");
  const viewFilter = searchParams.get("view");
  const filterParam = currentPage === "inbound" ? outcomeFilter : viewFilter;
  const filterName = currentPage
    ? getFilterName(currentPage, filterParam)
    : null;

  // Build clinic dashboard URL
  const clinicSlug = segments[1];
  const clinicDashboardUrl = clinicSlug ? `/dashboard/${clinicSlug}` : null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Show clinic name as first breadcrumb */}
        {clinicContext && (
          <BreadcrumbItem>
            {currentPage && clinicDashboardUrl ? (
              <BreadcrumbLink asChild>
                <Link href={clinicDashboardUrl}>
                  {clinicContext.clinicName}
                </Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{clinicContext.clinicName}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        )}

        {/* Show page name if present */}
        {currentPage && (
          <>
            {clinicContext && (
              <BreadcrumbSeparator className="hidden md:block" />
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>{getBreadcrumbName(currentPage)}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {/* Show filter if present */}
        {filterName && (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-muted-foreground">
                {filterName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
