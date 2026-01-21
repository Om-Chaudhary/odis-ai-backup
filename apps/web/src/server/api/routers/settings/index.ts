import { createTRPCRouter } from "~/server/api/trpc";
import { scheduleRouter } from "./schedule";

/**
 * Settings Router
 *
 * Aggregates all settings-related sub-routers
 */
export const settingsRouter = createTRPCRouter({
  schedule: scheduleRouter,
});
