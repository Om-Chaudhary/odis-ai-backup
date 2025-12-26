"use client";

import { type ReactNode } from "react";
import { Search, type LucideIcon } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { Badge } from "@odis-ai/shared/ui/badge";
import { DatePickerNav } from "./date-picker-nav";

interface ViewOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface DashboardToolbarProps {
  /** Search input value */
  searchTerm?: string;
  /** Callback when search changes */
  onSearchChange?: (term: string) => void;
  /** Placeholder text for search input */
  searchPlaceholder?: string;

  /** Whether to show date navigation */
  showDateNav?: boolean;
  /** Current date for date navigation */
  currentDate?: Date;
  /** Callback when date changes */
  onDateChange?: (date: Date) => void;
  /** Whether date nav is loading */
  isDateLoading?: boolean;

  /** View pills configuration */
  viewOptions?: ViewOption[];
  /** Currently selected view */
  currentView?: string;
  /** Callback when view changes */
  onViewChange?: (view: string) => void;

  /** Additional content on the left side */
  leftContent?: ReactNode;
  /** Additional content on the right side (before search) */
  rightContent?: ReactNode;

  /** Whether the toolbar is in a loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Dashboard Toolbar
 *
 * A unified toolbar component for dashboard pages with:
 * - Date navigation (optional)
 * - View pills for switching between views
 * - Search input with keyboard shortcut hint
 *
 * Usage:
 * ```tsx
 * <DashboardToolbar
 *   showDateNav
 *   currentDate={date}
 *   onDateChange={setDate}
 *   viewOptions={[
 *     { value: "calls", label: "Calls", count: 12 },
 *     { value: "appointments", label: "Appointments", count: 5 },
 *   ]}
 *   currentView={view}
 *   onViewChange={setView}
 *   searchTerm={search}
 *   onSearchChange={setSearch}
 * />
 * ```
 */
export function DashboardToolbar({
  searchTerm = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  showDateNav = false,
  currentDate,
  onDateChange,
  isDateLoading = false,
  viewOptions,
  currentView,
  onViewChange,
  leftContent,
  rightContent,
  isLoading = false,
  className,
}: DashboardToolbarProps) {
  return (
    <div className={cn("flex items-center justify-between gap-6", className)}>
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Date Navigation */}
        {showDateNav && currentDate && onDateChange && (
          <DatePickerNav
            currentDate={currentDate}
            onDateChange={onDateChange}
            isLoading={isDateLoading || isLoading}
          />
        )}

        {/* View Pills */}
        {viewOptions &&
          viewOptions.length > 0 &&
          currentView &&
          onViewChange && (
            <div className="flex items-center rounded-lg border border-teal-200/50 bg-white/60 p-1">
              {viewOptions.map((option) => {
                const isActive = currentView === option.value;
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => onViewChange(option.value)}
                    disabled={isLoading}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-teal-500 text-white shadow-sm"
                        : "text-slate-600 hover:bg-teal-50 hover:text-slate-800",
                      isLoading && "cursor-not-allowed opacity-50",
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <Badge
                        variant={isActive ? "outline" : "secondary"}
                        className={cn(
                          "ml-1 px-1.5 py-0 text-xs",
                          isActive && "border-white/40 bg-white/20 text-white",
                        )}
                      >
                        {option.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}

        {leftContent}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {rightContent}

        {/* Search */}
        {onSearchChange && (
          <div className="relative w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={isLoading}
              className={cn(
                "h-8 w-full rounded-md border border-teal-200/50 bg-white/60 pr-12 pl-9 text-sm",
                "placeholder:text-slate-400",
                "transition-all duration-200",
                "hover:border-teal-300/60 hover:bg-white/80",
                "focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none",
                isLoading && "cursor-not-allowed opacity-50",
              )}
            />
            <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-400 sm:inline-block">
              ⌘K
            </kbd>
          </div>
        )}
      </div>
    </div>
  );
}
