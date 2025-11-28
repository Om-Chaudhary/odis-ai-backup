"use client";

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
  startOfDay,
  endOfDay,
} from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

interface CasesDateNavigatorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  isLoading?: boolean;
  className?: string;
}

export function CasesDateNavigator({
  currentDate,
  onDateChange,
  isLoading = false,
  className,
}: CasesDateNavigatorProps) {
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
      // Ignore if loading or user is typing in an input
      if (
        isLoading ||
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
  }, [currentDate, onDateChange, isLoading]);

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

  const isCurrentDateToday = isToday(currentDate);

  return (
    <TooltipProvider>
      <div className={cn("w-full", className)}>
        <div className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white shadow-sm">
          {/* Left: Previous Day Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousDay}
                disabled={isLoading}
                className="h-10 w-10 rounded-l-lg rounded-r-none border-r border-slate-200 hover:bg-slate-100"
                aria-label="Previous Day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Previous Day (←)</p>
            </TooltipContent>
          </Tooltip>

          {/* Center: Date Information with Go to Today */}
          <div className="flex flex-1 items-center justify-center gap-3 px-4">
            <Calendar className="h-4 w-4 text-slate-400" />
            <div className="flex flex-col items-center leading-none">
              <span className="text-sm font-semibold text-slate-900">
                {formatDateDisplay(currentDate)}
              </span>
              {!isCurrentDateToday && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={goToToday}
                      disabled={isLoading}
                      className="text-xs text-slate-500 underline-offset-2 transition-colors hover:text-[#31aba3] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Go to Today
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Jump to Today (T)</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Right: Next Day Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextDay}
                className="h-10 w-10 rounded-l-none rounded-r-lg border-l border-slate-200 hover:bg-slate-100"
                disabled={isCurrentDateToday || isLoading}
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
      </div>
    </TooltipProvider>
  );
}

/**
 * Helper function to get start and end of day for a given date
 */
export function getDayDateRange(date: Date): {
  startDate: Date;
  endDate: Date;
} {
  return {
    startDate: startOfDay(date),
    endDate: endOfDay(date),
  };
}
