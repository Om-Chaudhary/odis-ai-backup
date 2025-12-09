"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@odis/ui/dropdown-menu";
import { Button } from "@odis/ui/button";
import { Settings2 } from "lucide-react";

export type DashboardSection =
  | "stats"
  | "activity"
  | "chart"
  | "upcoming"
  | "performance"
  | "actions";

interface DashboardCustomizationProps {
  visibleSections: Set<DashboardSection>;
  onToggleSection: (section: DashboardSection) => void;
}

const SECTION_LABELS: Record<DashboardSection, string> = {
  stats: "Quick Stats",
  activity: "Recent Activity",
  chart: "Weekly Chart",
  upcoming: "Upcoming Items",
  performance: "Call Performance",
  actions: "Quick Actions",
};

export function DashboardCustomization({
  visibleSections,
  onToggleSection,
}: DashboardCustomizationProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-slate-600 hover:text-slate-900"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Customize</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white">
        <DropdownMenuLabel>Dashboard Sections</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(SECTION_LABELS) as DashboardSection[]).map((section) => (
          <DropdownMenuCheckboxItem
            key={section}
            checked={visibleSections.has(section)}
            onCheckedChange={() => onToggleSection(section)}
          >
            {SECTION_LABELS[section]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
