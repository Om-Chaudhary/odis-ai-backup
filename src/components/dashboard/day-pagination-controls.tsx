import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import {
  format,
  addDays,
  subDays,
  isToday,
  isYesterday,
  isTomorrow,
} from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          {
            const previousDay = subDays(currentDate, 1);
            onDateChange(previousDay);
          }
          break;
        case "ArrowRight":
          if (!isToday(currentDate)) {
            const nextDay = addDays(currentDate, 1);
            onDateChange(nextDay);
          }
          break;
        case "t":
        case "T":
          if (!isToday(currentDate)) {
            onDateChange(new Date());
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentDate, onDateChange]);

  const formatDateDisplay = (date: Date) => {
    if (isToday(date)) {
      return "Today";
    }
    if (isYesterday(date)) {
      return "Yesterday";
    }
    if (isTomorrow(date)) {
      return "Tomorrow";
    }
    return format(date, "EEE, MMM d, yyyy");
  };

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-3 py-2">
        <div className="bg-card flex items-center rounded-md border shadow-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousDay}
                className="hover:bg-muted h-9 w-9 rounded-r-none border-r"
                aria-label="Previous Day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Previous Day (←)</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex min-w-[160px] items-center justify-center gap-2 px-4">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-sm font-medium">
                {formatDateDisplay(currentDate)}
              </span>
              <span className="text-muted-foreground text-[10px]">
                {totalItems} {totalItems === 1 ? "case" : "cases"}
              </span>
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextDay}
                className="hover:bg-muted h-9 w-9 rounded-l-none border-l"
                disabled={isToday(currentDate)}
                aria-label="Next Day"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Next Day (→)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {!isToday(currentDate) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="text-muted-foreground hover:text-foreground h-9"
              >
                Go to Today
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Jump to Today (T)</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
