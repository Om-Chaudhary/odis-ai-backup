import {
  now,
  isToday as isTodayUtil,
  formatDateForDisplay,
} from "@odis-ai/extension/shared";
import { Button } from "@odis-ai/shared/ui/extension";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface DateNavigatorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onRefresh?: () => void;
  loading?: boolean;
  caseCount?: number | null;
}

const formatDate = (date: Date): string => formatDateForDisplay(date);

export const DateNavigator = ({
  currentDate,
  onDateChange,
  onRefresh,
  loading = false,
  caseCount = null,
}: DateNavigatorProps) => {
  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(now());
  };

  return (
    <div className="bg-primary flex items-center gap-3 rounded-xl p-3 shadow-lg">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePreviousDay}
        className="text-primary-foreground hover:text-primary-foreground h-8 w-8 flex-shrink-0 hover:bg-white/20"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex flex-1 items-center justify-center gap-3">
        {!isTodayUtil(currentDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="text-primary-foreground hover:text-primary-foreground h-7 w-7 flex-shrink-0 p-0 hover:bg-white/20"
            title="Jump to today"
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        )}
        <div className="text-primary-foreground flex-1 text-center text-base font-semibold">
          {formatDate(currentDate)}
          {!loading && caseCount !== null && caseCount !== undefined && (
            <span className="text-primary-foreground/80 ml-2 text-sm font-normal">
              - {caseCount} {caseCount === 1 ? "case" : "cases"}
            </span>
          )}
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="text-primary-foreground hover:text-primary-foreground h-7 w-7 flex-shrink-0 p-0 hover:bg-white/20"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextDay}
        className="text-primary-foreground hover:text-primary-foreground h-8 w-8 flex-shrink-0 hover:bg-white/20"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
