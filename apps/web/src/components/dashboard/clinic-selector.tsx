"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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

export function ClinicSelector({
  clinics,
  currentClinicSlug,
}: ClinicSelectorProps) {
  const router = useRouter();
  const currentClinic = clinics.find((c) => c.slug === currentClinicSlug);

  const handleClinicChange = (slug: string) => {
    // Navigate to the new clinic's dashboard
    router.push(`/dashboard/${slug}`);
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
