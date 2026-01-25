import * as Sentry from "@sentry/nextjs";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { env } from "~/env";

const handler = async (request: Request) => {
  // Validate environment variables at runtime
  try {
    // This will throw if any required env vars are missing
    console.log("Environment validation passed:", {
      nodeEnv: env.NODE_ENV,
      appEnv: env.APP_ENV,
      hasSupabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
      hasPostHogKey: !!env.NEXT_PUBLIC_POSTHOG_KEY,
    });
  } catch (error) {
    console.error("Environment validation failed:", error);
    return new Response(
      JSON.stringify({
        error: "Server configuration error",
        message: "Missing required environment variables",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Capture per-request context so `onError` can tag Sentry events.
  // (The fetch adapter's `onError` args don't guarantee `ctx` is in scope here.)
  let ctx: Awaited<ReturnType<typeof createTRPCContext>> | undefined;

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: async () => (ctx = await createTRPCContext({ headers: request.headers })),
    onError({ error, path, type }) {
      console.error(`tRPC failed on ${path ?? "<no-path>"} (${type}):`, {
        error: error.message,
        code: error.code,
        stack: error.stack,
        path,
        type,
        timestamp: new Date().toISOString(),
      });

      // Log additional context for debugging
      if (error.code === "BAD_REQUEST") {
        console.error("Bad request details:", {
          zodError: error.cause,
        });
      }

      // Capture in Sentry
      if (process.env.NODE_ENV === "production") {
        Sentry.withScope((scope) => {
          scope.setTag("trpc_path", path ?? "unknown");
          scope.setTag("trpc_type", type);
          
          if (ctx) {
            scope.setTag("auth_type", ctx.isClerkAuth ? "clerk" : "supabase");
            if (ctx.orgId) scope.setTag("org_id", ctx.orgId);
            if (ctx.userId) {
              scope.setUser({ id: ctx.userId });
            }
          }
          
          Sentry.captureException(error);
        });
      }
    },
  });
};

export { handler as GET, handler as POST };
