import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addDays, subDays, isToday } from "date-fns";

interface DayPaginationControlsProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  totalItems: number;
}

export function DayPaginationControls({
  currentDate,
  onDateChange,
  totalItems,
}: DayPaginationControlsProps) {
  const goToPreviousDay = () => {
    const previousDay = subDays(currentDate, 1);
    onDateChange(previousDay);
  };

  const goToNextDay = () => {
    const nextDay = addDays(currentDate, 1);
    onDateChange(nextDay);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const formatDateDisplay = (date: Date) => {
    if (isToday(date)) {
      return "Today";
    }
    return format(date, "EEEE, MMMM d, yyyy");
  };

  return (
    <div className="bg-card flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousDay}
          className="h-9"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">Previous Day</span>
        </Button>
        <div className="flex flex-col items-center gap-1 px-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">
              {formatDateDisplay(currentDate)}
            </span>
          </div>
          <div className="text-muted-foreground text-xs">
            {totalItems} {totalItems === 1 ? "case" : "cases"}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextDay}
          className="h-9"
          disabled={isToday(currentDate)}
        >
          <span className="mr-1 hidden sm:inline">Next Day</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {!isToday(currentDate) && (
        <Button variant="outline" size="sm" onClick={goToToday} className="h-9">
          Go to Today
        </Button>
      )}
    </div>
  );
}
