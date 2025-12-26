"use client";

import { format, isValid } from "date-fns";
import { PawPrint, Calendar } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { api } from "~/trpc/client";

interface PetContextCardProps {
  phone: string;
  className?: string;
}

/**
 * Get species emoji for pet avatar
 */
function getSpeciesEmoji(species: string | null): string {
  const speciesLower = species?.toLowerCase() ?? "";

  if (speciesLower.includes("canine") || speciesLower.includes("dog")) {
    return "🐕";
  }
  if (speciesLower.includes("feline") || speciesLower.includes("cat")) {
    return "🐈";
  }
  if (speciesLower.includes("avian") || speciesLower.includes("bird")) {
    return "🐦";
  }
  if (speciesLower.includes("rabbit") || speciesLower.includes("bunny")) {
    return "🐰";
  }
  if (speciesLower.includes("hamster")) {
    return "🐹";
  }
  if (speciesLower.includes("fish")) {
    return "🐠";
  }
  if (speciesLower.includes("reptile") || speciesLower.includes("lizard")) {
    return "🦎";
  }
  if (speciesLower.includes("horse") || speciesLower.includes("equine")) {
    return "🐴";
  }
  return "🐾";
}

/**
 * Safely parse and format a date
 */
function formatLastVisit(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (!isValid(date)) return null;
  return format(date, "MMM d, yyyy");
}

/**
 * Pet Context Card - Shows known pet information based on phone number lookup
 * Used in Messages tab to provide context about the caller's pet
 */
export function PetContextCard({ phone, className }: PetContextCardProps) {
  // Query for caller info by phone number
  const { data: callerInfo, isLoading } =
    api.inbound.getCallerNameByPhone.useQuery(
      { phone },
      {
        enabled: !!phone,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        retry: false,
      },
    );

  // Don't render if loading or no pet info found
  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no pet info found
  if (!callerInfo?.petName) {
    return null;
  }

  const petMetadata = [callerInfo.species, callerInfo.breed]
    .filter(Boolean)
    .join(" · ");
  const lastVisitFormatted = formatLastVisit(callerInfo.lastVisit);

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200/50 bg-slate-50/50 p-3 dark:border-slate-700/50 dark:bg-slate-800/30",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {/* Pet Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-100 to-emerald-100 text-xl dark:from-teal-900/50 dark:to-emerald-900/50">
          {getSpeciesEmoji(callerInfo.species ?? null)}
        </div>

        {/* Pet Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <PawPrint className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
            <span className="truncate font-medium text-slate-800 dark:text-slate-200">
              {callerInfo.petName}
            </span>
          </div>
          {petMetadata && (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {petMetadata}
            </p>
          )}
          {lastVisitFormatted && (
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <Calendar className="h-3 w-3" />
              <span>Last visit: {lastVisitFormatted}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
