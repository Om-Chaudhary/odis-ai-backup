/**
 * Scheduler Manager - Singleton accessor for scheduler instance
 *
 * Used to share scheduler instance between main.ts and health routes
 */

import type { SyncScheduler } from "../scheduler";

let schedulerInstance: SyncScheduler | null = null;

export function setSchedulerInstance(scheduler: SyncScheduler | null): void {
  schedulerInstance = scheduler;
}

export function getSchedulerInstance(): SyncScheduler | null {
  return schedulerInstance;
}
