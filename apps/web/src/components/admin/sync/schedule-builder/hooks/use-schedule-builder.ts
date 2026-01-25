/**
 * useScheduleBuilder Hook
 *
 * Main state management hook for schedule builder
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { ScheduleState, ScheduleMode } from "../types";
import { useCronConverter } from "./use-cron-converter";
import { validateSchedule } from "../utils/schedule-validator";

interface UseScheduleBuilderOptions {
  /** Initial cron expression */
  initialCron: string;
  /** Callback when cron changes */
  onChange: (cron: string) => void;
}

export function useScheduleBuilder({
  initialCron,
  onChange,
}: UseScheduleBuilderOptions) {
  const { parse, build } = useCronConverter();

  // Determine initial mode based on whether cron can be parsed
  const initialParseResult = parse(initialCron);
  const [mode, setMode] = useState<ScheduleMode>(
    initialParseResult.success && !initialParseResult.isComplex
      ? "simple"
      : "advanced",
  );

  // Schedule state (for simple mode)
  const [schedule, setSchedule] = useState<ScheduleState>(() => {
    if (initialParseResult.success && initialParseResult.schedule) {
      return initialParseResult.schedule;
    }
    // Default: weekdays, 9 AM
    return {
      days: [1, 2, 3, 4, 5],
      times: ["09:00"],
    };
  });

  // Cron string (for advanced mode)
  const [cronString, setCronString] = useState(initialCron);

  // Track last emitted cron to prevent infinite loops
  const lastEmittedCronRef = useRef(initialCron);

  // Sync with external value changes (e.g., from parent component)
  useEffect(() => {
    if (initialCron !== lastEmittedCronRef.current) {
      lastEmittedCronRef.current = initialCron;
      setCronString(initialCron);

      // If in simple mode, try to parse the new cron
      if (mode === "simple") {
        const parseResult = parse(initialCron);
        if (parseResult.success && parseResult.schedule) {
          setSchedule(parseResult.schedule);
        }
      }
    }
  }, [initialCron, mode, parse]);

  // Update cron when schedule changes (simple mode)
  useEffect(() => {
    if (mode === "simple") {
      try {
        const newCron = build(schedule);
        // Only call onChange if cron actually changed
        if (newCron !== lastEmittedCronRef.current) {
          lastEmittedCronRef.current = newCron;
          onChange(newCron);
        }
      } catch (error) {
        // Invalid schedule, don't update cron
        console.error("Failed to build cron:", error);
      }
    }
  }, [schedule, mode, build]);

  // Update cron when cron string changes (advanced mode)
  useEffect(() => {
    if (mode === "advanced") {
      // Only call onChange if cron actually changed
      if (cronString !== lastEmittedCronRef.current) {
        lastEmittedCronRef.current = cronString;
        onChange(cronString);
      }
    }
  }, [cronString, mode]);

  /**
   * Toggle a day in the schedule
   */
  const toggleDay = useCallback((day: number) => {
    setSchedule((prev) => {
      const newDays = prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day].sort((a, b) => a - b);

      return { ...prev, days: newDays };
    });
  }, []);

  /**
   * Add a time to the schedule
   */
  const addTime = useCallback((time: string) => {
    setSchedule((prev) => {
      // Prevent duplicates
      if (prev.times.includes(time)) return prev;

      return {
        ...prev,
        times: [...prev.times, time].sort(),
      };
    });
  }, []);

  /**
   * Remove a time from the schedule
   */
  const removeTime = useCallback((time: string) => {
    setSchedule((prev) => ({
      ...prev,
      times: prev.times.filter((t) => t !== time),
    }));
  }, []);

  /**
   * Set all times at once
   */
  const setTimes = useCallback((times: string[]) => {
    setSchedule((prev) => ({ ...prev, times }));
  }, []);

  /**
   * Set all days at once
   */
  const setDays = useCallback((days: number[]) => {
    setSchedule((prev) => ({ ...prev, days }));
  }, []);

  /**
   * Switch mode
   */
  const switchMode = useCallback(
    (newMode: ScheduleMode) => {
      if (newMode === mode) return;

      if (newMode === "simple") {
        // Switching to simple mode: parse current cron
        const parseResult = parse(cronString);
        if (parseResult.success && parseResult.schedule) {
          setSchedule(parseResult.schedule);
        }
        // If parse fails, keep current schedule state
      } else {
        // Switching to advanced mode: build cron from schedule
        try {
          const newCron = build(schedule);
          setCronString(newCron);
        } catch (error) {
          // If build fails, keep current cron string
          console.error("Failed to build cron:", error);
        }
      }

      setMode(newMode);
    },
    [mode, cronString, schedule, parse, build],
  );

  /**
   * Validate current schedule
   */
  const validation = validateSchedule(schedule);

  return {
    // Mode
    mode,
    switchMode,

    // Simple mode state
    schedule,
    toggleDay,
    addTime,
    removeTime,
    setTimes,
    setDays,

    // Advanced mode state
    cronString,
    setCronString,

    // Utilities
    validation,
  };
}
