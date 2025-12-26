"use client";

import { Search } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { DatePickerNav } from "../shared";

interface OutboundFilterTabsProps {
  // Search
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  // Date navigation
  currentDate: Date;
  onDateChange: (date: Date) => void;
  isLoading?: boolean;
  /** Whether to show the date navigator (default: true) */
  showDateNav?: boolean;
}

/**
 * Outbound Filter Tabs - Simplified toolbar with date navigation and search
 * View mode switching has moved to the sidebar navigation
 */
export function OutboundFilterTabs({
  searchTerm = "",
  onSearchChange,
  currentDate,
  onDateChange,
  isLoading = false,
  showDateNav = true,
}: OutboundFilterTabsProps) {
  return (
    <div className="flex items-center justify-between gap-6">
      {/* Left: Date Navigator (optional) */}
      {showDateNav && (
        <div className="flex items-center gap-3">
          <DatePickerNav
            currentDate={currentDate}
            onDateChange={onDateChange}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Right: Search */}
      {onSearchChange && (
        <div className="relative w-64">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "h-8 w-full rounded-md border border-teal-200/50 bg-white/60 pr-12 pl-9 text-sm",
              "placeholder:text-slate-400",
              "transition-all duration-200",
              "hover:border-teal-300/60 hover:bg-white/80",
              "focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none",
            )}
          />
          <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-400 sm:inline-block">
            ⌘K
          </kbd>
        </div>
      )}
    </div>
  );
}
