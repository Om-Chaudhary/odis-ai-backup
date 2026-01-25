/**
 * useCronConverter Hook
 *
 * Converts between cron expressions and UI state
 */

import { useCallback } from "react";
import { buildCron } from "../utils/cron-builder";
import { parseCron } from "../utils/cron-parser";
import type { ScheduleState, CronParseResult } from "../types";

export function useCronConverter() {
  /**
   * Parse a cron expression into schedule state
   */
  const parse = useCallback((cron: string): CronParseResult => {
    return parseCron(cron);
  }, []);

  /**
   * Build a cron expression from schedule state
   */
  const build = useCallback((schedule: ScheduleState): string => {
    return buildCron(schedule);
  }, []);

  return {
    parse,
    build,
  };
}
