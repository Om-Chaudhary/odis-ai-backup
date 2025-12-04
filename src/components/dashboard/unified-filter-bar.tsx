"use client";

import { DayPaginationControls } from "./day-pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Search, Info } from "lucide-react";
import type { DischargeReadinessFilter } from "~/types/dashboard";
import { Badge } from "~/components/ui/badge";

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

interface UnifiedFilterBarProps {
  /** Current selected date for day navigation */
  currentDate: Date;
  /** Callback when date changes */
  onDateChange: (date: Date) => void;
  /** Total number of items for the current date */
  totalItems: number;
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

  /** Search term */
  searchTerm: string;
  /** Callback when search term changes */
  onSearchChange: (term: string) => void;
}

/**
 * UnifiedFilterBar - Combined filter interface for discharge management
 *
 * Combines date navigation and status filters into a clean, standardized interface
 * using Select dropdowns for compact, intuitive filtering.
 *
 * Features:
 * - Day-by-day date navigation with keyboard shortcuts
 * - Status filter dropdown (All, Ready, Pending, Completed, Failed)
 * - Readiness filter dropdown (All Cases, Ready for Discharge, Not Ready)
 * - Search by patient or owner name
 *
 * @example
 * ```tsx
 * <UnifiedFilterBar
 *   currentDate={selectedDate}
 *   onDateChange={setSelectedDate}
 *   totalItems={cases.length}
 *   isLoading={isLoading}
 *   statusFilter={status}
 *   onStatusFilterChange={setStatus}
 *   readinessFilter={readiness}
 *   onReadinessFilterChange={setReadiness}
 * />
 * ```
 */
export function UnifiedFilterBar({
  currentDate,
  onDateChange,
  totalItems,
  isLoading = false,
  statusFilter,
  onStatusFilterChange,
  readinessFilter,
  onReadinessFilterChange,
  callEndReasonFilter = "all",
  onCallEndReasonFilterChange,
  searchTerm,
  onSearchChange,
}: UnifiedFilterBarProps) {
  // Check if search is active
  const isSearchActive = searchTerm.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Search Bar - First element, full width on mobile, constrained on desktop */}
      <div className="flex-1 space-y-2 md:max-w-sm">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search patients or owners..."
            className="transition-smooth pl-9 focus:ring-2"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {/* Show indicator when search overrides date filters */}
        {isSearchActive && (
          <Badge
            variant="secondary"
            className="gap-1.5 border-blue-200 bg-blue-50 text-blue-700"
          >
            <Info className="h-3 w-3" />
            Searching all cases (date filter overridden)
          </Badge>
        )}
      </div>

      {/* Day Navigation - Show when not searching */}
      {!isSearchActive && (
        <DayPaginationControls
          currentDate={currentDate}
          onDateChange={onDateChange}
          totalItems={totalItems}
          isLoading={isLoading}
        />
      )}

      {/* Filter Row: Status and Readiness Selects */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
        {/* Status Filter */}
        <div className="flex min-w-0 flex-col gap-2 sm:max-w-[180px] sm:min-w-[140px]">
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
                value as "all" | "ready" | "pending" | "completed" | "failed",
              )
            }
          >
            <SelectTrigger
              id="status-filter"
              className="w-full sm:w-[140px]"
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
        <div className="flex min-w-0 flex-col gap-2 sm:max-w-[200px] sm:min-w-[160px]">
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
              className="w-full sm:w-[160px]"
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
          <div className="flex min-w-0 flex-col gap-2 sm:max-w-[180px] sm:min-w-[140px]">
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
                className="w-full sm:w-[150px]"
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
      </div>
    </div>
  );
}
