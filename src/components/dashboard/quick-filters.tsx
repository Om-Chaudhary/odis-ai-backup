"use client";

import { Button } from "~/components/ui/button";
import {
  AlertCircle,
  FileText,
  Calendar,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";

export type QuickFilterId =
  | "missingDischarge"
  | "missingSoap"
  | "today"
  | "thisWeek"
  | "recent";

interface QuickFilter {
  id: QuickFilterId;
  label: string;
  icon: LucideIcon;
}

const QUICK_FILTERS: QuickFilter[] = [
  { id: "missingDischarge", label: "Missing Discharge", icon: AlertCircle },
  { id: "missingSoap", label: "Missing SOAP", icon: FileText },
  { id: "today", label: "Today", icon: Calendar },
  { id: "thisWeek", label: "This Week", icon: Calendar },
  { id: "recent", label: "Recent", icon: Clock },
];

interface QuickFiltersProps {
  selected: Set<QuickFilterId>;
  onChange: (selected: Set<QuickFilterId>) => void;
  className?: string;
}

export function QuickFilters({
  selected,
  onChange,
  className,
}: QuickFiltersProps) {
  const handleToggle = (filterId: QuickFilterId) => {
    const newSelected = new Set(selected);
    if (newSelected.has(filterId)) {
      newSelected.delete(filterId);
    } else {
      newSelected.add(filterId);
    }
    onChange(newSelected);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {QUICK_FILTERS.map((filter) => {
        const Icon = filter.icon;
        const isActive = selected.has(filter.id);

        return (
          <Button
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => handleToggle(filter.id)}
            className={cn(
              "transition-smooth hover:scale-[1.02] focus:ring-2 focus:ring-[#31aba3] focus:ring-offset-2",
              isActive &&
                "border-[#31aba3] bg-[#31aba3] text-white shadow-sm hover:bg-[#2a9a92]",
            )}
            aria-pressed={isActive}
          >
            <Icon className="transition-smooth mr-2 h-4 w-4" />
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}
