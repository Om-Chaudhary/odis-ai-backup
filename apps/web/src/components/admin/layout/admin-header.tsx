"use client";

import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Building2,
  Globe,
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
  DropdownMenuSeparator,
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

export function AdminHeader() {
  const pathname = usePathname();
  const { selectedClinicId, clinics, setSelectedClinic, isGlobalView } =
    useAdminContext();

  // Get the base path (without IDs)
  const basePath = pathname.split("/").slice(0, 3).join("/");
  const Icon = pageIcons[basePath] ?? LayoutDashboard;
  const title = pageTitles[basePath] ?? "Admin";

  const selectedClinic = clinics.find((c) => c.id === selectedClinicId);

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
            {isGlobalView ? "All Clinics" : (selectedClinic?.name ?? "Unknown")}
          </p>
        </div>
      </div>

      {/* Clinic Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 gap-2 border-slate-200/70 text-sm",
              isGlobalView
                ? "text-slate-600"
                : "border-teal-200 bg-teal-50 text-teal-700",
            )}
          >
            {isGlobalView ? (
              <Globe className="h-4 w-4" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            <span className="font-medium">
              {isGlobalView
                ? "All Clinics"
                : (selectedClinic?.name ?? "Select Clinic")}
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-50 w-64">
          <DropdownMenuItem
            onClick={() => setSelectedClinic(null)}
            className={cn(
              "cursor-pointer",
              isGlobalView && "bg-teal-50 text-teal-700",
            )}
          >
            <Globe className="mr-2 h-4 w-4" />
            <span>All Clinics</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {clinics.map((clinic) => (
            <DropdownMenuItem
              key={clinic.id}
              onClick={() => setSelectedClinic(clinic.id)}
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
