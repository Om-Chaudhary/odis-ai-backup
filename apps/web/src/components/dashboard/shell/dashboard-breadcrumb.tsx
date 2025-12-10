"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@odis-ai/ui/breadcrumb";
import React from "react";

export function DashboardBreadcrumb() {
  const pathname = usePathname();

  // Simple path mapping logic
  const segments = pathname.split("/").filter(Boolean);
  // segments[0] is usually 'dashboard'

  const getBreadcrumbName = (segment: string) => {
    switch (segment) {
      case "dashboard":
        return "Dashboard";
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
        return segment.charAt(0).toUpperCase() + segment.slice(1);
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
