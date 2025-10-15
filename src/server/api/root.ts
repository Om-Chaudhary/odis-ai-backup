import { waitlistRouter } from "~/server/api/routers/waitlist";
import { createCallerFactory, router } from "~/server/api/trpc";

export const appRouter = router({
  waitlist: waitlistRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
