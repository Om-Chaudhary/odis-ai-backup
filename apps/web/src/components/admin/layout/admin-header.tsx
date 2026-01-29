"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Building2,
  LayoutDashboard,
  Users,
  RefreshCw,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { useAdminContext } from "~/lib/admin-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@odis-ai/shared/ui/dropdown-menu";
import { Button } from "@odis-ai/shared/ui/button";

const pageIcons: Record<string, React.ElementType> = {
  "/admin": LayoutDashboard,
  "/admin/clinics": Building2,
  "/admin/users": Users,
  "/admin/sync": RefreshCw,
};

const pageTitles: Record<string, string> = {
  "/admin": "Overview",
  "/admin/clinics": "Clinics",
  "/admin/users": "Users",
  "/admin/sync": "PIMS Sync",
};

/**
 * Extract admin sub-path from clinic-scoped URL
 * e.g., /dashboard/alum-rock/admin/sync -> /admin/sync
 * e.g., /dashboard/alum-rock/admin/users/123 -> /admin/users/123
 * e.g., /dashboard/alum-rock/admin -> /admin
 */
function getAdminSubPathFromPathname(pathname: string): string {
  const match = /^\/dashboard\/[^/]+(\/admin.*)$/.exec(pathname);
  return match?.[1] ?? "/admin";
}

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedClinicId, selectedClinic, clinics } = useAdminContext();

  // Get the admin sub-path for title/icon
  const adminSubPath = getAdminSubPathFromPathname(pathname);
  const Icon = pageIcons[adminSubPath] ?? LayoutDashboard;
  const title = pageTitles[adminSubPath] ?? "Admin";

  /**
   * Navigate to the selected clinic's admin page
   * The admin context will automatically update from the URL path
   */
  const handleClinicSelect = (clinicId: string) => {
    const clinic = clinics.find((c) => c.id === clinicId);
    if (!clinic) return;

    // Navigate to the same admin sub-path but for the selected clinic
    router.push(`/dashboard/${clinic.slug}${adminSubPath}`);
  };

  return (
    <div className="relative z-10 flex h-12 items-center justify-between border-b border-slate-200/60 bg-white/60 px-5 backdrop-blur-md">
      {/* Subtle bottom edge highlight */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-teal-400/20 to-transparent" />

      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-teal-600 shadow-sm shadow-teal-500/20">
          <Icon className="h-[18px] w-[18px] text-white" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-800">{title}</h1>
          <p className="text-xs text-slate-500">
            {selectedClinic?.name ?? "Select Clinic"}
          </p>
        </div>
      </div>

      {/* Clinic Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 gap-2 border-teal-200 bg-teal-50 text-sm text-teal-700"
          >
            <Building2 className="h-4 w-4" />
            <span className="font-medium">
              {selectedClinic?.name ?? "Select Clinic"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-50 w-64">
          {clinics.map((clinic) => (
            <DropdownMenuItem
              key={clinic.id}
              onClick={() => handleClinicSelect(clinic.id)}
              className={cn(
                "cursor-pointer",
                selectedClinicId === clinic.id && "bg-teal-50 text-teal-700",
              )}
            >
              <Building2 className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>{clinic.name}</span>
                <span className="text-xs text-slate-400">{clinic.slug}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
