"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addDays, subDays, isToday, isYesterday } from "date-fns";
import { cn } from "@odis-ai/utils";

interface OutboundDateNavProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  isLoading?: boolean;
}

/**
 * Date Navigator - Glassmorphism Theme
 *
 * Layout: [<] [>] Mon, Dec 9 · 78 items · Today
 */
export function OutboundDateNav({
  currentDate,
  onDateChange,
  isLoading = false,
}: OutboundDateNavProps) {
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        isLoading ||
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
  }, [currentDate, isLoading]);

  const dateLabel = useMemo(() => {
    if (isToday(currentDate)) return "Today";
    if (isYesterday(currentDate)) return "Yesterday";
    return format(currentDate, "EEE, MMM d");
  }, [currentDate]);

  const isAtToday = isToday(currentDate);

  return (
    <div className="flex items-center gap-4">
      {/* Arrow buttons grouped */}
      <div className="flex items-center rounded-lg border border-teal-200/50 bg-white/60">
        <button
          onClick={goToPreviousDay}
          disabled={isLoading}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-l-lg text-slate-600 transition-all duration-200",
            isLoading
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-teal-50 hover:text-teal-700",
          )}
          aria-label="Previous day"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="h-5 w-px bg-teal-200/50" />
        <button
          onClick={goToNextDay}
          disabled={isAtToday || isLoading}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-r-lg text-slate-600 transition-all duration-200",
            isAtToday || isLoading
              ? "cursor-not-allowed opacity-40"
              : "hover:bg-teal-50 hover:text-teal-700",
          )}
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Date info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-teal-600" />
          <span className="text-lg font-semibold text-slate-800">
            {dateLabel}
          </span>
        </div>
        {!isAtToday && (
          <>
            <span className="text-slate-300">·</span>
            <button
              onClick={goToToday}
              disabled={isLoading}
              className={cn(
                "text-base font-medium text-teal-600 transition-colors",
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
