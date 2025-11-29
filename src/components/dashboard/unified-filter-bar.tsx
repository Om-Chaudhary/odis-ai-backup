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
import type { DischargeReadinessFilter } from "~/types/dashboard";
import type { DateRangePreset } from "~/lib/utils/date-ranges";
import { useQueryState } from "nuqs";

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
}

/**
 * UnifiedFilterBar - Combined filter interface for discharge management
 *
 * Combines date navigation, date range presets, and status filters into a
 * clean, standardized interface using Select dropdowns for compact, intuitive filtering.
 *
 * Features:
 * - Day-by-day date navigation with keyboard shortcuts
 * - Date range preset dropdown (All Time, Last Day, 3D, 30D)
 * - Status filter dropdown (All, Ready, Pending, Completed, Failed)
 * - Readiness filter dropdown (All Cases, Ready for Discharge, Not Ready)
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
}: UnifiedFilterBarProps) {
  // Date range preset state (uses URL state for persistence)
  const [dateRange, setDateRange] = useQueryState("dateRange", {
    defaultValue: "all",
    parse: (value) => (value as DateRangePreset) || "all",
    serialize: (value) => value,
  });

  return (
    <div className="space-y-4">
      {/* Full-width Date Navigator */}
      <DayPaginationControls
        currentDate={currentDate}
        onDateChange={onDateChange}
        totalItems={totalItems}
        isLoading={isLoading}
      />

      {/* Filter Row: Date Range, Status, and Readiness Selects */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
        {/* Date Range Filter */}
        <div className="flex min-w-0 flex-col gap-2 sm:max-w-[180px] sm:min-w-[140px]">
          <Label
            htmlFor="date-range-filter"
            className="text-xs font-medium text-slate-700"
          >
            Date Range
          </Label>
          <Select
            value={dateRange}
            onValueChange={(value) => setDateRange(value as DateRangePreset)}
          >
            <SelectTrigger
              id="date-range-filter"
              className="w-full sm:w-[140px]"
              size="sm"
            >
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="1d">Last Day</SelectItem>
              <SelectItem value="3d">3D</SelectItem>
              <SelectItem value="30d">30D</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
      </div>
    </div>
  );
}
