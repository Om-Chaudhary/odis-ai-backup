import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const handler = (request: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: async () => createTRPCContext({ headers: request.headers }),
    onError({ error, path }) {
      if (process.env.NODE_ENV === "development") {
        console.error(`tRPC failed on ${path ?? "<no-path>"}:`, error);
      }
    },
  });
};

export { handler as GET, handler as POST };
