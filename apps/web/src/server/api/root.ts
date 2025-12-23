import { waitlistRouter } from "~/server/api/routers/waitlist";
import { casesRouter } from "~/server/api/routers/cases";
import { dashboardRouter } from "~/server/api/routers/dashboard";
import { inboundCallsRouter } from "~/server/api/routers/inbound-calls";
import { inboundRouter } from "~/server/api/routers/inbound";
import { outboundRouter } from "~/server/api/routers/outbound";
import { adminRouter } from "~/server/api/routers/admin";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  waitlist: waitlistRouter,
  cases: casesRouter,
  dashboard: dashboardRouter,
  inboundCalls: inboundCallsRouter,
  inbound: inboundRouter,
  outbound: outboundRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
