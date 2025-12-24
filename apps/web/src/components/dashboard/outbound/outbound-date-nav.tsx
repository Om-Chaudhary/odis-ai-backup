"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  format,
  addDays,
  subDays,
  isToday,
  isYesterday,
  startOfDay,
} from "date-fns";
import { cn } from "@odis-ai/shared/util";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@odis-ai/shared/ui/popover";
import { Calendar } from "@odis-ai/shared/ui/calendar";

interface OutboundDateNavProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  isLoading?: boolean;
}

/**
 * Date Navigator - Glassmorphism Theme
 *
 * Layout: [<] [>] [Calendar Icon] Mon, Dec 9 · Today
 *
 * The calendar icon opens a date picker modal for quick date selection.
 */
export function OutboundDateNav({
  currentDate,
  onDateChange,
  isLoading = false,
}: OutboundDateNavProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const onDateChangeRef = useRef(onDateChange);
  useEffect(() => {
    onDateChangeRef.current = onDateChange;
  }, [onDateChange]);

  const goToPreviousDay = useCallback(() => {
    onDateChange(subDays(currentDate, 1));
  }, [currentDate, onDateChange]);

  const goToNextDay = useCallback(() => {
    onDateChange(addDays(currentDate, 1));
  }, [currentDate, onDateChange]);

  const goToToday = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    onDateChange(today);
  }, [onDateChange]);

  const handleCalendarSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        onDateChange(startOfDay(date));
        setIsCalendarOpen(false);
      }
    },
    [onDateChange],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        isLoading ||
        isCalendarOpen ||
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          onDateChangeRef.current(subDays(currentDate, 1));
          break;
        case "ArrowRight":
          if (!isToday(currentDate)) {
            onDateChangeRef.current(addDays(currentDate, 1));
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
  }, [currentDate, isLoading, isCalendarOpen]);

  const dateLabel = useMemo(() => {
    if (isToday(currentDate)) return "Today";
    if (isYesterday(currentDate)) return "Yesterday";
    return format(currentDate, "EEE, MMM d");
  }, [currentDate]);

  const isAtToday = isToday(currentDate);

  return (
    <div className="flex items-center gap-3">
      {/* Arrow buttons grouped */}
      <div className="flex items-center rounded-md border border-teal-200/50 bg-white/60">
        <button
          onClick={goToPreviousDay}
          disabled={isLoading}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-l-md text-slate-600 transition-all duration-200",
            isLoading
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-teal-50 hover:text-teal-700",
          )}
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="h-4 w-px bg-teal-200/50" />
        <button
          onClick={goToNextDay}
          disabled={isAtToday || isLoading}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-r-md text-slate-600 transition-all duration-200",
            isAtToday || isLoading
              ? "cursor-not-allowed opacity-40"
              : "hover:bg-teal-50 hover:text-teal-700",
          )}
          aria-label="Next day"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Date info with clickable calendar */}
      <div className="flex items-center gap-2">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={isLoading}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-200",
                isLoading
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-teal-50/50",
              )}
              aria-label="Open date picker"
            >
              <CalendarIcon className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-semibold text-slate-800">
                {dateLabel}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={handleCalendarSelect}
              disabled={(date) => date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {!isAtToday && (
          <>
            <span className="text-slate-300">·</span>
            <button
              onClick={goToToday}
              disabled={isLoading}
              className={cn(
                "text-sm font-medium text-teal-600 transition-colors",
                "hover:text-teal-700 hover:underline",
              )}
            >
              Today
            </button>
          </>
        )}
      </div>
    </div>
  );
}
