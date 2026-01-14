import { DashboardToolbar } from "~/components/dashboard/shared";

export interface OutboundHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  isLoading: boolean;
  showDateNav?: boolean;
}

export function OutboundHeader({
  currentDate,
  onDateChange,
  isLoading,
  showDateNav = true,
}: OutboundHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-teal-100/50 bg-gradient-to-r from-teal-50/30 to-white/50 px-6 py-3.5">
      {/* Date Navigation */}
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
