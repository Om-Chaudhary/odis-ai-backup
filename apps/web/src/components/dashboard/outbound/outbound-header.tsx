import { DashboardToolbar } from "~/components/dashboard/shared";
import { OutboundViewFilterPills } from "./outbound-view-filter-pills";
import type { ViewMode } from "./types";

export interface OutboundHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  isLoading: boolean;
  showDateNav?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  totalCount?: number;
  needsAttentionCount?: number;
}

export function OutboundHeader({
  currentDate,
  onDateChange,
  isLoading,
  showDateNav = true,
  viewMode,
  onViewModeChange,
  totalCount,
  needsAttentionCount,
}: OutboundHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-teal-100/50 bg-gradient-to-r from-teal-50/30 to-white/50 px-6 py-3.5">
      {/* View Mode Filter Pills (LEFT) */}
      {viewMode && onViewModeChange && (
        <OutboundViewFilterPills
          value={viewMode}
          onChange={onViewModeChange}
          totalCount={totalCount}
          needsAttentionCount={needsAttentionCount}
        />
      )}

      {/* Date Navigation (RIGHT - aligns above pagination) */}
      {showDateNav && (
        <DashboardToolbar
          showDateNav
          currentDate={currentDate}
          onDateChange={onDateChange}
          isDateLoading={isLoading}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
