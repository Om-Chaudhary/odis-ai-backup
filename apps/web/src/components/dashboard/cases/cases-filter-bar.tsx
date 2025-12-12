"use client";

import { useMemo } from "react";
import { Button } from "@odis-ai/ui/button";
import { Input } from "@odis-ai/ui/input";
import { Label } from "@odis-ai/ui/label";
import { Checkbox } from "@odis-ai/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@odis-ai/ui/collapsible";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  FileText,
  FileCheck,
  CheckCircle2,
  Database,
  Tag,
  CircleDot,
  Star,
} from "lucide-react";
import { cn } from "@odis-ai/utils";
import type { QuickFilterId } from "../filters/quick-filters";
import { CasesDateRangeSelector } from "./cases-date-range-selector";
import type { DateRangePreset } from "@odis-ai/utils/date-ranges";

const STATUS_OPTIONS: Array<{
  value: string;
  label: string;
  icon?: React.ReactNode;
}> = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "reviewed", label: "Reviewed" },
];

const SOURCE_OPTIONS: Array<{
  value: string;
  label: string;
  icon?: React.ReactNode;
}> = [
  { value: "all", label: "All Sources" },
  { value: "manual", label: "Manual" },
  { value: "idexx_neo", label: "IDEXX Neo" },
  { value: "cornerstone", label: "Cornerstone" },
  { value: "ezyvet", label: "ezyVet" },
  { value: "avimark", label: "AVImark" },
];

interface CasesFilterBarProps {
  /** Current search query string */
  search: string;
  /** Callback when search query changes */
  onSearchChange: (value: string) => void;

  /** Set of active quick filter IDs (only Missing Discharge and Missing SOAP) */
  quickFilters: Set<QuickFilterId>;
  /** Callback when quick filters change */
  onQuickFiltersChange: (filters: Set<QuickFilterId>) => void;

  /** Current status filter value */
  statusFilter: string;
  /** Callback when status filter changes */
  onStatusFilterChange: (value: string) => void;

  /** Current source filter value */
  sourceFilter: string;
  /** Callback when source filter changes */
  onSourceFilterChange: (value: string) => void;

  /** Current date range preset, or null if none selected */
  dateRangePreset: DateRangePreset | null;
  /** Callback when date range preset changes */
  onDateRangePresetChange: (preset: DateRangePreset | null) => void;

  /** Whether to show only starred cases */
  starredOnly: boolean;
  /** Callback when starred filter changes */
  onStarredChange: (starred: boolean) => void;

  /** Callback to clear all active filters */
  onClearFilters: () => void;
}

/**
 * CasesFilterBar - Comprehensive filter interface for the cases tab
 *
 * Provides a collapsible filter panel with:
 * - Search input for patient/owner names
 * - Date range preset selector
 * - Status filter dropdown (Draft, Ongoing, Completed, Reviewed)
 * - Source filter dropdown (Manual, IDEXX Neo, Cornerstone, etc.)
 * - Quick filter checkboxes (Missing Discharge, Missing SOAP)
 *
 * The filter panel shows an active filter count badge and provides a "Clear All"
 * button when filters are active.
 *
 * @example
 * ```tsx
 * <CasesFilterBar
 *   search={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   quickFilters={activeQuickFilters}
 *   onQuickFiltersChange={setQuickFilters}
 *   statusFilter={status}
 *   onStatusFilterChange={setStatus}
 *   sourceFilter={source}
 *   onSourceFilterChange={setSource}
 *   dateRangePreset={dateRange}
 *   onDateRangePresetChange={setDateRange}
 *   onClearFilters={handleClearFilters}
 * />
 * ```
 */
export function CasesFilterBar({
  search,
  onSearchChange,
  quickFilters,
  onQuickFiltersChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
  dateRangePreset,
  onDateRangePresetChange,
  starredOnly,
  onStarredChange,
  onClearFilters,
}: CasesFilterBarProps) {
  // Check if any filters are active (excluding search, as it's always visible)
  const hasActiveFilters =
    quickFilters.size > 0 ||
    statusFilter !== "all" ||
    sourceFilter !== "all" ||
    starredOnly;

  // Count active filters in the panel (Missing Discharge, Missing SOAP, Status, Source, Starred)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (quickFilters.has("missingDischarge")) count++;
    if (quickFilters.has("missingSoap")) count++;
    if (statusFilter !== "all") count++;
    if (sourceFilter !== "all") count++;
    if (starredOnly) count++;
    return count;
  }, [quickFilters, statusFilter, sourceFilter, starredOnly]);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Row: Search and Date Range */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by patient or owner name..."
            className="transition-smooth pl-9 focus:ring-2"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Date Range Selector */}
        <div className="flex-shrink-0">
          <CasesDateRangeSelector
            selectedPreset={dateRangePreset}
            onPresetSelect={onDateRangePresetChange}
          />
        </div>
      </div>

      {/* Filter Bar Row */}
      <div className="flex items-center gap-2">
        {/* Starred Quick Filter Button */}
        <Button
          variant={starredOnly ? "default" : "outline"}
          size="sm"
          onClick={() => onStarredChange(!starredOnly)}
          className={cn(
            "transition-smooth gap-2",
            starredOnly
              ? "bg-amber-500 hover:bg-amber-600"
              : "border-amber-200 text-amber-600 hover:border-amber-300 hover:bg-amber-50",
          )}
        >
          <Star
            className={cn(
              "h-4 w-4",
              starredOnly && "fill-white text-white",
              !starredOnly && "fill-amber-400 text-amber-500",
            )}
          />
          Starred
        </Button>

        {/* Filter Toggle Button */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "transition-smooth gap-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                activeFilterCount > 0 && "text-[#31aba3] hover:text-[#2a9a92]",
              )}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#31aba3] px-1.5 text-xs font-medium text-white">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>

          {/* Expanded Filter Panel */}
          <CollapsibleContent className="animate-in slide-in-from-top-2 fade-in-0">
            <div className="mt-2 rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
              {/* Header with Clear Filters button */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Filter Cases
                  </h3>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="transition-smooth gap-2 text-slate-600 hover:text-slate-900"
                  >
                    <X className="h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>

              {/* Filter Controls - Two Column Layout */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Column: Dropdowns */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Tag className="h-4 w-4 text-slate-500" />
                    <h4 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Categories
                    </h4>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="status-filter"
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-600"
                    >
                      <CircleDot className="h-3 w-3" />
                      Status
                    </Label>
                    <Select
                      value={statusFilter}
                      onValueChange={onStatusFilterChange}
                    >
                      <SelectTrigger id="status-filter" className="h-9">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Source Filter */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="source-filter"
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-600"
                    >
                      <Database className="h-3 w-3" />
                      Source
                    </Label>
                    <Select
                      value={sourceFilter}
                      onValueChange={onSourceFilterChange}
                    >
                      <SelectTrigger id="source-filter" className="h-9">
                        <SelectValue placeholder="All Sources" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right Column: Quick Filters (Radio Buttons) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <CheckCircle2 className="h-4 w-4 text-slate-500" />
                    <h4 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Quick Filters
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <label
                      htmlFor="missing-discharge"
                      className={cn(
                        "flex w-full cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-slate-50",
                        quickFilters.has("missingDischarge")
                          ? "border-[#31aba3] bg-teal-50/50"
                          : "border-slate-200",
                      )}
                    >
                      <Checkbox
                        id="missing-discharge"
                        checked={quickFilters.has("missingDischarge")}
                        onCheckedChange={(checked) => {
                          const newFilters = new Set(quickFilters);
                          if (checked) {
                            newFilters.add("missingDischarge");
                          } else {
                            newFilters.delete("missingDischarge");
                          }
                          onQuickFiltersChange(newFilters);
                        }}
                        className="border-slate-300"
                      />
                      <div className="flex flex-1 items-center gap-2">
                        <FileCheck className="h-4 w-4 shrink-0 text-teal-600" />
                        <span className="text-sm font-medium text-slate-700">
                          Missing Discharge
                        </span>
                      </div>
                    </label>

                    <label
                      htmlFor="missing-soap"
                      className={cn(
                        "flex w-full cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-slate-50",
                        quickFilters.has("missingSoap")
                          ? "border-[#31aba3] bg-blue-50/50"
                          : "border-slate-200",
                      )}
                    >
                      <Checkbox
                        id="missing-soap"
                        checked={quickFilters.has("missingSoap")}
                        onCheckedChange={(checked) => {
                          const newFilters = new Set(quickFilters);
                          if (checked) {
                            newFilters.add("missingSoap");
                          } else {
                            newFilters.delete("missingSoap");
                          }
                          onQuickFiltersChange(newFilters);
                        }}
                        className="border-slate-300"
                      />
                      <div className="flex flex-1 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                        <span className="text-sm font-medium text-slate-700">
                          Missing SOAP
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
