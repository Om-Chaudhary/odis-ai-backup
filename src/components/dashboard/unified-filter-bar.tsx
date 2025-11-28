"use client";

import { FilterButtonGroup } from "./filter-button-group";
import { DateFilterButtonGroup } from "./date-filter-button-group";
import { DayPaginationControls } from "./day-pagination-controls";

interface UnifiedFilterBarProps {
  // Date controls
  currentDate: Date;
  onDateChange: (date: Date) => void;
  totalItems: number;
  isLoading?: boolean;

  // Status filter
  statusFilter: "all" | "ready" | "pending" | "completed" | "failed";
  onStatusFilterChange: (
    filter: "all" | "ready" | "pending" | "completed" | "failed",
  ) => void;
}

/**
 * UnifiedFilterBar - Combines date navigation, date range presets, and status filters
 * into a clean, standardized interface matching the dashboard page
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
