"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Building2, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@odis-ai/shared/ui/dropdown-menu";
import { Button } from "@odis-ai/shared/ui/button";

interface Clinic {
  id: string;
  name: string;
  slug: string;
}

interface ClinicHeaderProps {
  clinicName: string;
  clinicSlug: string;
  isAdmin?: boolean;
  allClinics?: Clinic[];
}

/**
 * Extract sub-path from clinic-scoped URL
 * e.g., /dashboard/alum-rock/inbound -> /inbound
 * e.g., /dashboard/alum-rock/outbound/123 -> /outbound/123
 * e.g., /dashboard/alum-rock -> ""
 */
function getSubPathFromPathname(pathname: string): string {
  const match = /^\/dashboard\/[^/]+(\/.*)?$/.exec(pathname);
  return match?.[1] ?? "";
}

export function ClinicHeader({
  clinicName,
  clinicSlug,
  isAdmin = false,
  allClinics = [],
}: ClinicHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClinicChange = (slug: string) => {
    // Preserve the current sub-path when switching clinics
    const subPath = getSubPathFromPathname(pathname);
    router.push(`/dashboard/${slug}${subPath}`);
  };

  // Only show switcher for admins with multiple clinics
  const showSwitcher = isAdmin && allClinics.length > 1;

  return (
    <div className="flex items-center gap-3 border-b border-slate-100 bg-white/50 px-6 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
        <Building2 className="h-4 w-4 text-teal-600" />
      </div>

      {showSwitcher ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto gap-2 px-2 py-1 text-left hover:bg-slate-100"
            >
              <span className="text-lg font-semibold text-slate-800">
                {clinicName}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {allClinics.map((clinic) => (
              <DropdownMenuItem
                key={clinic.id}
                onClick={() => handleClinicChange(clinic.slug)}
                className="flex items-center justify-between"
              >
                <span className="truncate">{clinic.name}</span>
                {clinic.slug === clinicSlug && (
                  <Check className="h-4 w-4 shrink-0 text-teal-600" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <h1 className="text-lg font-semibold text-slate-800">{clinicName}</h1>
      )}
    </div>
  );
}
