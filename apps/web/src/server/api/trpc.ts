import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import {
  createClient,
  createServiceClient,
} from "@odis-ai/data-access/db/server";
import { auth } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";

type CreateContextOptions = {
  headers: Headers;
  req?: Request;
};

/**
 * Enhanced tRPC context with hybrid auth support (Clerk + Supabase)
 *
 * For Clerk users:
 * - `supabase` is a service client that bypasses RLS (Clerk users have no Supabase session)
 * - `isClerkAuth` is true
 *
 * For Supabase Auth users (iOS):
 * - `supabase` is an RLS-enabled client with the user's session
 * - `isClerkAuth` is false
 */
export const createTRPCContext = async (opts: CreateContextOptions) => {
  try {
    // Try Clerk auth first (for web users)
    const clerkAuth = await auth();
    const isClerkAuth = !!clerkAuth?.userId;

    // Determine which Supabase client to use based on auth type
    // For Clerk users, we need the service client since they don't have a Supabase session
    // For Supabase Auth users, we use the regular client with RLS
    let supabase: SupabaseClient<Database>;

    if (isClerkAuth) {
      // Clerk users get service client (bypasses RLS)
      supabase = await createServiceClient();
    } else {
      // Supabase Auth users get RLS-enabled client
      supabase = await createClient();
    }

    // Determine user info based on auth type
    let userId: string | null = null;
    let user: {
      id: string;
      email: string;
      created_at: string;
      updated_at: string | null;
      aud: string;
      role: string;
      app_metadata: Record<string, unknown>;
      user_metadata: Record<string, unknown>;
    } | null = null;

    if (isClerkAuth) {
      // Clerk user - look up corresponding Supabase user record
      const { data: clerkUser } = await supabase
        .from("users")
        .select("id, email, created_at, updated_at")
        .eq("clerk_user_id", clerkAuth.userId)
        .single();

      if (clerkUser) {
        userId = clerkUser.id; // Use Supabase user ID for queries
        // Map to Supabase User shape for backward compatibility
        user = {
          id: clerkUser.id,
          email: clerkUser.email ?? "",
          created_at: clerkUser.created_at,
          updated_at: clerkUser.updated_at,
          aud: "authenticated",
          role: "authenticated",
          app_metadata: {},
          user_metadata: {},
        };
      }
    } else {
      // Supabase Auth user (iOS)
      const {
        data: { user: supabaseUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("[tRPC Context] Supabase auth error:", {
          code: authError.code,
          message: authError.message,
          status: authError.status,
        });
      }

      if (supabaseUser) {
        userId = supabaseUser.id;
        user = {
          id: supabaseUser.id,
          email: supabaseUser.email ?? "",
          created_at: supabaseUser.created_at ?? new Date().toISOString(),
          updated_at: supabaseUser.updated_at ?? null,
          aud: supabaseUser.aud ?? "authenticated",
          role: supabaseUser.role ?? "authenticated",
          app_metadata: supabaseUser.app_metadata ?? {},
          user_metadata: supabaseUser.user_metadata ?? {},
        };
      }
    }

    // Extract org info from Clerk JWT if available
    const orgId = clerkAuth?.orgId ?? null;
    const orgRole = clerkAuth?.orgRole ?? null;

    return {
      headers: opts.headers,
      supabase,

      // Auth info
      userId,
      user,
      isClerkAuth,

      // Organization context (Clerk only)
      orgId,
      orgRole,

      // Raw Clerk auth for advanced use cases
      clerkAuth,
    };
  } catch (error) {
    console.error("Failed to create tRPC context:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to initialize database connection",
    });
  }
};

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    // transformer: superjson, // Temporarily disable transformer
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

export const createCallerFactory = t.createCallerFactory;

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.userId` and `ctx.user` are not null.
 *
 * Works with both Clerk (web) and Supabase Auth (iOS).
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  // Extract to local constants after guard - TypeScript narrows these
  const userId = ctx.userId;
  const user = ctx.user;
  return next({
    ctx: {
      headers: ctx.headers,
      supabase: ctx.supabase,
      isClerkAuth: ctx.isClerkAuth,
      orgId: ctx.orgId,
      orgRole: ctx.orgRole,
      clerkAuth: ctx.clerkAuth,
      userId,
      user,
    },
  });
});

/**
 * Organization-protected procedure
 *
 * Requires user to be authenticated AND part of a Clerk organization.
 * Use this for organization-scoped features.
 */
export const orgProtectedProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.orgId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization membership required",
    });
  }
  return next({
    ctx: {
      ...ctx,
      orgId: ctx.orgId,
      orgRole: ctx.orgRole,
    },
  });
});

/**
 * Organization owner procedure
 *
 * Requires org:owner role in Clerk organization.
 */
export const orgOwnerProcedure = orgProtectedProcedure.use(({ ctx, next }) => {
  if (ctx.orgRole !== "org:owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization owner access required",
    });
  }
  return next({ ctx });
});

/**
 * Organization admin procedure
 *
 * Requires org:owner or org:admin role.
 */
export const orgAdminProcedure = orgProtectedProcedure.use(({ ctx, next }) => {
  const allowedRoles = ["org:owner", "org:admin"];
  if (!ctx.orgRole || !allowedRoles.includes(ctx.orgRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization admin access required",
    });
  }
  return next({ ctx });
});

/**
 * Veterinarian procedure
 *
 * Requires org:veterinarian, org:admin, or org:owner role.
 */
export const vetProcedure = orgProtectedProcedure.use(({ ctx, next }) => {
  const allowedRoles = ["org:owner", "org:admin", "org:veterinarian"];
  if (!ctx.orgRole || !allowedRoles.includes(ctx.orgRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Veterinarian access required",
    });
  }
  return next({ ctx });
});

/**
 * Super admin procedure
 *
 * Requires system-level admin role (role='admin' in users table).
 * Super admins bypass org requirements and can access ANY clinic.
 *
 * Use this for ODIS staff administrative functions.
 */
export const superAdminProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    let userId: string | null = null;

    // Determine user ID based on auth type
    if (ctx.isClerkAuth && ctx.userId) {
      userId = ctx.userId;
    } else if (ctx.user) {
      userId = ctx.user.id;
    }

    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    // Check if user is super admin via direct query (works with both Clerk and Supabase Auth)
    const { data: adminCheck, error } = await ctx.supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[Super Admin] Error checking admin status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to verify admin access",
      });
    }

    if (adminCheck?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Super admin access required",
      });
    }

    return next({ ctx: { ...ctx, isSuperAdmin: true } });
  },
);

export const middleware = t.middleware;
