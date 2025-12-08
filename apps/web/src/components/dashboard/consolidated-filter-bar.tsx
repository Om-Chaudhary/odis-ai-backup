"use client";

import { useState } from "react";
import { Button } from "@odis/ui/button";
import { Input } from "@odis/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis/ui/select";
import { Label } from "@odis/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@odis/ui/collapsible";
import {
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { DischargeReadinessFilter } from "~/types/dashboard";

/**
 * VAPI call end reason filter options
 */
export type CallEndReasonFilter =
  | "all"
  | "successful"
  | "voicemail"
  | "no_answer"
  | "busy"
  | "failed";

/**
 * Human-readable labels for call end reason filters
 */
const CALL_END_REASON_LABELS: Record<CallEndReasonFilter, string> = {
  all: "All Outcomes",
  successful: "Successful",
  voicemail: "Voicemail",
  no_answer: "No Answer",
  busy: "Line Busy",
  failed: "Failed",
};

interface ConsolidatedFilterBarProps {
  /** Search term */
  searchTerm: string;
  /** Callback when search term changes */
  onSearchChange: (term: string) => void;
  /** Refresh handler */
  onRefresh: () => void;
  /** Whether data is currently loading */
  isLoading?: boolean;

  /** Current status filter value */
  statusFilter: "all" | "ready" | "pending" | "completed" | "failed";
  /** Callback when status filter changes */
  onStatusFilterChange: (
    filter: "all" | "ready" | "pending" | "completed" | "failed",
  ) => void;

  /** Current readiness filter value */
  readinessFilter: DischargeReadinessFilter;
  /** Callback when readiness filter changes */
  onReadinessFilterChange: (filter: DischargeReadinessFilter) => void;

  /** Current call end reason filter value */
  callEndReasonFilter?: CallEndReasonFilter;
  /** Callback when call end reason filter changes */
  onCallEndReasonFilterChange?: (filter: CallEndReasonFilter) => void;
}

/**
 * ConsolidatedFilterBar - Production-ready filter interface for discharge management
 *
 * Features a clean, consolidated layout with:
 * - Left: Refresh button (minimal/icon only)
 * - Center: Expanded search input
 * - Right: Filter toggle button
 * - Collapsible filter options (Status, Readiness, Call Outcome)
 */
export function ConsolidatedFilterBar({
  searchTerm,
  onSearchChange,
  onRefresh,
  isLoading = false,
  statusFilter,
  onStatusFilterChange,
  readinessFilter,
  onReadinessFilterChange,
  callEndReasonFilter = "all",
  onCallEndReasonFilterChange,
}: ConsolidatedFilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Check if any filters are active (non-default)
  const hasActiveFilters =
    statusFilter !== "all" ||
    readinessFilter !== "all" ||
    callEndReasonFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Main Toolbar Row */}
      <div className="flex items-center gap-4">
        {/* Left: Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="transition-smooth shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh</span>
        </Button>

        {/* Center: Search Input (Expanded) */}
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search patients or owners..."
            className="transition-smooth pl-9 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Right: Filter Toggle Button */}
        <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant={hasActiveFilters ? "default" : "outline"}
              size="sm"
              className={`transition-smooth shrink-0 gap-2 ${
                hasActiveFilters
                  ? "bg-teal-600 hover:bg-teal-700"
                  : "hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                  {[
                    statusFilter !== "all" ? 1 : 0,
                    readinessFilter !== "all" ? 1 : 0,
                    callEndReasonFilter !== "all" ? 1 : 0,
                  ].reduce((a, b) => a + b)}
                </span>
              )}
              {isFilterOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          {/* Collapsible Filter Options */}
          <CollapsibleContent className="absolute top-full right-0 z-50 mt-2 w-80 rounded-lg border bg-white p-4 shadow-lg">
            <div className="grid grid-cols-1 gap-4">
              <div className="mb-2">
                <h3 className="text-sm font-medium text-gray-900">
                  Filter Options
                </h3>
                <p className="text-xs text-gray-500">
                  Refine your view by status, readiness, and call outcomes
                </p>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label
                  htmlFor="status-filter"
                  className="text-xs font-medium text-slate-700"
                >
                  Status
                </Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    onStatusFilterChange(
                      value as
                        | "all"
                        | "ready"
                        | "pending"
                        | "completed"
                        | "failed",
                    )
                  }
                >
                  <SelectTrigger
                    id="status-filter"
                    className="w-full"
                    size="sm"
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Readiness Filter */}
              <div className="space-y-2">
                <Label
                  htmlFor="readiness-filter"
                  className="text-xs font-medium text-slate-700"
                >
                  Readiness
                </Label>
                <Select
                  value={readinessFilter}
                  onValueChange={(value) =>
                    onReadinessFilterChange(value as DischargeReadinessFilter)
                  }
                >
                  <SelectTrigger
                    id="readiness-filter"
                    className="w-full"
                    size="sm"
                  >
                    <SelectValue placeholder="Select readiness" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cases</SelectItem>
                    <SelectItem value="ready_for_discharge">
                      Ready for Discharge
                    </SelectItem>
                    <SelectItem value="not_ready">Not Ready</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Call Outcome Filter */}
              {onCallEndReasonFilterChange && (
                <div className="space-y-2">
                  <Label
                    htmlFor="call-outcome-filter"
                    className="text-xs font-medium text-slate-700"
                  >
                    Call Outcome
                  </Label>
                  <Select
                    value={callEndReasonFilter}
                    onValueChange={(value) =>
                      onCallEndReasonFilterChange(value as CallEndReasonFilter)
                    }
                  >
                    <SelectTrigger
                      id="call-outcome-filter"
                      className="w-full"
                      size="sm"
                    >
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CALL_END_REASON_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="flex justify-end border-t pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onStatusFilterChange("all");
                      onReadinessFilterChange("all");
                      if (onCallEndReasonFilterChange) {
                        onCallEndReasonFilterChange("all");
                      }
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
