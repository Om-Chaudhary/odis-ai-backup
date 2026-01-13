"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@odis-ai/shared/ui/dropdown-menu";

interface ClinicSelectorProps {
  clinics: Array<{ id: string; name: string; slug: string }>;
  currentClinicSlug: string;
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

export function ClinicSelector({
  clinics,
  currentClinicSlug,
}: ClinicSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentClinic = clinics.find((c) => c.slug === currentClinicSlug);

  const handleClinicChange = (slug: string) => {
    // Preserve the current sub-path when switching clinics
    // e.g., /dashboard/clinic-a/inbound -> /dashboard/clinic-b/inbound
    const subPath = getSubPathFromPathname(pathname);
    router.push(`/dashboard/${slug}${subPath}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center justify-between gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50 focus:ring-2 focus:ring-teal-500/20 focus:outline-none">
        <span className="truncate text-slate-700">
          {currentClinic?.name ?? "Select clinic"}
        </span>
        <ChevronsUpDown className="h-3 w-3 shrink-0 text-slate-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {clinics.map((clinic) => (
          <DropdownMenuItem
            key={clinic.id}
            onClick={() => handleClinicChange(clinic.slug)}
            className="flex items-center justify-between"
          >
            <span>{clinic.name}</span>
            {clinic.slug === currentClinicSlug && (
              <Check className="h-4 w-4 text-teal-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
