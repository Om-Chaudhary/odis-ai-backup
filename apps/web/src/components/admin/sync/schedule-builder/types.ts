/**
 * Schedule Builder Types
 *
 * Type definitions for the schedule builder components
 */

export interface ScheduleState {
  /** Selected days of week (0-6, where 0 = Sunday) */
  days: number[];
  /** Selected times in HH:mm format (24-hour) */
  times: string[];
}

export interface ScheduleBuilderProps {
  /** Current cron expression */
  value: string;
  /** Callback when schedule changes (returns new cron expression) */
  onChange: (cron: string) => void;
  /** Whether the schedule is enabled */
  enabled?: boolean;
  /** Timezone for displaying schedule times */
  timezone?: string;
  /** Schedule type label */
  label?: string;
  /** Schedule description */
  description?: string;
}

export interface CronParseResult {
  /** Whether the cron was successfully parsed */
  success: boolean;
  /** Parsed schedule state (if successful) */
  schedule?: ScheduleState;
  /** Error message (if failed) */
  error?: string;
  /** Whether this cron is too complex for simple mode */
  isComplex?: boolean;
}

export interface SchedulePreviewItem {
  /** Formatted date string */
  date: string;
  /** ISO timestamp */
  timestamp: Date;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

export const DAY_LABELS_FULL: Record<DayOfWeek, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export type ScheduleMode = "simple" | "advanced";

export interface SchedulePreset {
  label: string;
  description: string;
  cron: string;
}

export const SCHEDULE_PRESETS: SchedulePreset[] = [
  {
    label: "Business Hours",
    description: "9 AM, 2 PM, 5 PM on weekdays",
    cron: "0 9,14,17 * * 1-5",
  },
  {
    label: "Every 4 Hours",
    description: "8 AM, 12 PM, 4 PM daily",
    cron: "0 8,12,16 * * *",
  },
  {
    label: "Once Daily",
    description: "9 AM every day",
    cron: "0 9 * * *",
  },
  {
    label: "Twice Daily",
    description: "9 AM and 5 PM every day",
    cron: "0 9,17 * * *",
  },
];
