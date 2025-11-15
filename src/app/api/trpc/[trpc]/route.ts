import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { env } from "~/env";

const handler = (request: Request) => {
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
        message: "Missing required environment variables" 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: async () => createTRPCContext({ headers: request.headers }),
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
    },
  });
};

export { handler as GET, handler as POST };
