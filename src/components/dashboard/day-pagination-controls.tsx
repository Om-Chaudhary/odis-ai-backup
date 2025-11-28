import { useEffect, useCallback, useMemo, useRef } from "react";
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
  /** Current selected date */
  currentDate: Date;
  /** Callback when date changes */
  onDateChange: (date: Date) => void;
  /** Total number of items for the current date */
  totalItems: number;
  /** Whether data is currently loading */
  isLoading?: boolean;
}

/**
 * DayPaginationControls - Date navigation component with keyboard shortcuts
 *
 * Provides day-by-day navigation with previous/next buttons and keyboard shortcuts.
 * Supports "Today", "Yesterday", and "Tomorrow" labels for better UX.
 *
 * Keyboard shortcuts:
 * - ArrowLeft: Previous day
 * - ArrowRight: Next day (disabled if already at today)
 * - T: Jump to today
 *
 * @example
 * ```tsx
 * <DayPaginationControls
 *   currentDate={new Date()}
 *   onDateChange={(date) => setDate(date)}
 *   totalItems={10}
 *   isLoading={false}
 * />
 * ```
 */
export function DayPaginationControls({
  currentDate,
  onDateChange,
  totalItems,
  isLoading = false,
}: DayPaginationControlsProps) {
  // Use ref to avoid including onDateChange in useEffect dependencies
  // This prevents unnecessary re-registration of event listeners
  const onDateChangeRef = useRef(onDateChange);
  useEffect(() => {
    onDateChangeRef.current = onDateChange;
  }, [onDateChange]);

  const goToPreviousDay = useCallback(() => {
    const previousDay = subDays(currentDate, 1);
    onDateChange(previousDay);
  }, [currentDate, onDateChange]);

  const goToNextDay = useCallback(() => {
    const nextDay = addDays(currentDate, 1);
    onDateChange(nextDay);
  }, [currentDate, onDateChange]);

  const goToToday = useCallback(() => {
    const today = new Date();
    // Reset time to start of day for consistency
    today.setHours(0, 0, 0, 0);
    onDateChange(today);
  }, [onDateChange]);

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
        case "ArrowLeft": {
          const previousDay = subDays(currentDate, 1);
          onDateChangeRef.current(previousDay);
          break;
        }
        case "ArrowRight":
          if (!isToday(currentDate)) {
            const nextDay = addDays(currentDate, 1);
            onDateChangeRef.current(nextDay);
          }
          break;
        case "t":
        case "T":
          if (!isToday(currentDate)) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            onDateChangeRef.current(today);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentDate, isLoading]);

  const formatDateDisplay = useMemo(() => {
    if (isToday(currentDate)) return "Today";
    if (isYesterday(currentDate)) return "Yesterday";
    if (isTomorrow(currentDate)) return "Tomorrow";
    return format(currentDate, "EEE, MMM d, yyyy");
  }, [currentDate]);

  // Glassmorphism styling constants for maintainability
  const GLASSMORPHISM_CLASSES =
    "rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md transition-all hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10";

  return (
    <TooltipProvider>
      <div className="w-full py-2">
        <div
          className={`flex w-full items-center justify-between ${GLASSMORPHISM_CLASSES}`}
        >
          {/* Left: Previous Day Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousDay}
                disabled={isLoading}
                className="hover:bg-muted h-9 w-9 rounded-l-md rounded-r-none border-r focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
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
          <div className="flex flex-1 items-center justify-center gap-2 px-2 sm:px-4">
            <Calendar className="text-muted-foreground hidden h-4 w-4 sm:block" />
            <div className="flex flex-col items-center leading-none">
              <span className="text-xs font-medium sm:text-sm">
                {formatDateDisplay}
              </span>
              <div className="flex items-center gap-1.5">
                {isLoading ? (
                  <span className="text-muted-foreground text-[10px]">
                    Loading...
                  </span>
                ) : (
                  <>
                    <span className="text-muted-foreground text-[10px]">
                      {totalItems} {totalItems === 1 ? "case" : "cases"}
                    </span>
                    {!isToday(currentDate) && (
                      <>
                        <span className="text-muted-foreground/50 text-[10px]">
                          •
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={goToToday}
                              disabled={isLoading}
                              className="text-muted-foreground hover:text-foreground text-[10px] underline-offset-2 transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Go to Today
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Jump to Today (T)</p>
                          </TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Next Day Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextDay}
                className="hover:bg-muted h-9 w-9 rounded-l-none rounded-r-md border-l focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                disabled={isToday(currentDate) || isLoading}
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
