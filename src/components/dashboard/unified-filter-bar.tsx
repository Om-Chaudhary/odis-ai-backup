"use client";

import { FilterButtonGroup } from "./filter-button-group";
import { DateFilterButtonGroup } from "./date-filter-button-group";
import { DayPaginationControls } from "./day-pagination-controls";

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
}

/**
 * UnifiedFilterBar - Combined filter interface for discharge management
 *
 * Combines date navigation, date range presets, and status filters into a
 * clean, standardized interface. Used in the discharge management page to
 * provide consistent filtering UX.
 *
 * Features:
 * - Day-by-day date navigation with keyboard shortcuts
 * - Date range preset buttons (All Time, Last Day, 3D, 30D)
 * - Status filter buttons (All, Ready, Pending, Completed, Failed)
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
}: UnifiedFilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Full-width Date Navigator */}
      <DayPaginationControls
        currentDate={currentDate}
        onDateChange={onDateChange}
        totalItems={totalItems}
        isLoading={isLoading}
      />

      {/* Filter Row: Date Range Presets and Status Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Date Range Presets */}
        <DateFilterButtonGroup />

        {/* Status Filter Buttons */}
        <FilterButtonGroup<"all" | "ready" | "pending" | "completed" | "failed">
          options={[
            { value: "all", label: "All" },
            { value: "ready", label: "Ready" },
            { value: "pending", label: "Pending" },
            { value: "completed", label: "Completed" },
            { value: "failed", label: "Failed" },
          ]}
          value={statusFilter}
          onChange={onStatusFilterChange}
        />
      </div>
    </div>
  );
}
