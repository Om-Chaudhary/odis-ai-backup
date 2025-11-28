"use client";

import { useState, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "~/lib/utils";
import type { DateRangePreset } from "~/lib/utils/date-ranges";
import type { QuickFilterId } from "./quick-filters";

const DATE_OPTIONS: Array<{ value: DateRangePreset; label: string }> = [
  { value: "all", label: "All Time" },
  { value: "1d", label: "Last Day" },
  { value: "3d", label: "3D" },
  { value: "30d", label: "30D" },
];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "reviewed", label: "Reviewed" },
];

const SOURCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All" },
  { value: "manual", label: "Manual" },
  { value: "idexx_neo", label: "IDEXX Neo" },
  { value: "cornerstone", label: "Cornerstone" },
  { value: "ezyvet", label: "ezyVet" },
  { value: "avimark", label: "AVImark" },
];

interface CasesFilterBarProps {
  // Search
  search: string;
  onSearchChange: (value: string) => void;

  // Quick Filters (only Missing Discharge and Missing SOAP)
  quickFilters: Set<QuickFilterId>;
  onQuickFiltersChange: (filters: Set<QuickFilterId>) => void;

  // Date Range
  dateRange: DateRangePreset;
  onDateRangeChange: (preset: DateRangePreset) => void;

  // Status
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;

  // Source
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;

  // Clear all filters
  onClearFilters: () => void;
}

export function CasesFilterBar({
  search,
  onSearchChange,
  quickFilters,
  onQuickFiltersChange,
  dateRange,
  onDateRangeChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
  onClearFilters,
}: CasesFilterBarProps) {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Check if any filters are active
  const hasActiveFilters =
    search ||
    quickFilters.size > 0 ||
    dateRange !== "all" ||
    statusFilter !== "all" ||
    sourceFilter !== "all";

  // Count active filters in the panel (Missing Discharge, Missing SOAP, Status, Source)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (quickFilters.has("missingDischarge")) count++;
    if (quickFilters.has("missingSoap")) count++;
    if (statusFilter !== "all") count++;
    if (sourceFilter !== "all") count++;
    return count;
  }, [quickFilters, statusFilter, sourceFilter]);

  const handleToggleMissingDischarge = (checked: boolean) => {
    const newFilters = new Set(quickFilters);
    if (checked) {
      newFilters.add("missingDischarge");
    } else {
      newFilters.delete("missingDischarge");
    }
    onQuickFiltersChange(newFilters);
  };

  const handleToggleMissingSoap = (checked: boolean) => {
    const newFilters = new Set(quickFilters);
    if (checked) {
      newFilters.add("missingSoap");
    } else {
      newFilters.delete("missingSoap");
    }
    onQuickFiltersChange(newFilters);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar - Separated on its own row */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by patient or owner name..."
          className="transition-smooth pl-9 focus:ring-2"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter Buttons Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Range Filter - Leftmost, prominent */}
        <div className="transition-smooth inline-flex rounded-lg border border-slate-200 bg-slate-50/50 p-1 backdrop-blur-sm">
          {DATE_OPTIONS.map((preset) => {
            const isActive = dateRange === preset.value;
            return (
              <Button
                key={preset.value}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => onDateRangeChange(preset.value)}
                className={cn(
                  "transition-smooth hover:scale-[1.01] focus:ring-2 focus:ring-[#31aba3] focus:ring-offset-2",
                  isActive &&
                    "bg-[#31aba3] text-white shadow-sm hover:bg-[#2a9a92]",
                )}
                aria-pressed={isActive}
              >
                {preset.label}
              </Button>
            );
          })}
        </div>

        {/* Filter Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
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
          {isFilterPanelOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="transition-smooth gap-2 text-slate-600 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Expanded Filter Panel */}
      {isFilterPanelOpen && (
        <div className="animate-in slide-in-from-top-2 fade-in-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Missing Discharge */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="missing-discharge"
                checked={quickFilters.has("missingDischarge")}
                onCheckedChange={handleToggleMissingDischarge}
              />
              <Label
                htmlFor="missing-discharge"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Missing Discharge
              </Label>
            </div>

            {/* Missing SOAP */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="missing-soap"
                checked={quickFilters.has("missingSoap")}
                onCheckedChange={handleToggleMissingSoap}
              />
              <Label
                htmlFor="missing-soap"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Missing SOAP
              </Label>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-sm font-medium">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
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
              <Label htmlFor="source-filter" className="text-sm font-medium">
                Source
              </Label>
              <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
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
        </div>
      )}
    </div>
  );
}
