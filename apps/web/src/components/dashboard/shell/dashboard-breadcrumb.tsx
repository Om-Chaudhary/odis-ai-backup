"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@odis-ai/shared/ui/breadcrumb";
import React from "react";

export function DashboardBreadcrumb() {
  const pathname = usePathname();

  // Simple path mapping logic
  const segments = pathname.split("/").filter(Boolean);
  // segments[0] is usually 'dashboard'

  const formatSlugToTitle = (slug: string) => {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getBreadcrumbName = (segment: string) => {
    switch (segment) {
      case "dashboard":
        return "Dashboard";
      case "inbound":
        return "Inbound Communications";
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
      default:
        return formatSlugToTitle(segment);
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>

        {segments.length > 1 && (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{getBreadcrumbName(segments[1]!)}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {segments.length > 2 && (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Details</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
