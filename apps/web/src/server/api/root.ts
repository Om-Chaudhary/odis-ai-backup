import { waitlistRouter } from "~/server/api/routers/waitlist";
import { templatesRouter } from "~/server/api/routers/templates";
import { playgroundRouter } from "~/server/api/routers/playground";
import { casesRouter } from "~/server/api/routers/cases";
import { sharingRouter } from "~/server/api/routers/sharing";
import { usersRouter } from "~/server/api/routers/users";
import { dashboardRouter } from "~/server/api/routers/dashboard";
import { inboundCallsRouter } from "~/server/api/routers/inbound-calls";
import { inboundRouter } from "~/server/api/routers/inbound";
import { adminDischargeCallsRouter } from "~/server/api/routers/admin-discharge-calls";
import { outboundRouter } from "~/server/api/routers/outbound";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  waitlist: waitlistRouter,
  templates: templatesRouter,
  playground: playgroundRouter,
  cases: casesRouter,
  sharing: sharingRouter,
  users: usersRouter,
  dashboard: dashboardRouter,
  inboundCalls: inboundCallsRouter,
  inbound: inboundRouter,
  adminDischargeCalls: adminDischargeCallsRouter,
  outbound: outboundRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
