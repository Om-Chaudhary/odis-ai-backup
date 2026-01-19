import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import { createClient } from "@odis-ai/data-access/db/server";
import { auth } from "@clerk/nextjs/server";

type CreateContextOptions = {
  headers: Headers;
  req?: Request;
};

/**
 * Enhanced tRPC context with hybrid auth support (Clerk + Supabase)
 */
export const createTRPCContext = async (opts: CreateContextOptions) => {
  try {
    const supabase = await createClient();

    // Try Clerk auth first (for web users)
    const clerkAuth = await auth();

    // Get Supabase user (for iOS users or if Clerk returns null)
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.getUser();

    // Log auth errors for debugging (but don't throw - let protectedProcedure handle it)
    if (authError && !clerkAuth?.userId) {
      // Only log if not a Clerk user
      console.error("[tRPC Context] Supabase auth error:", {
        code: authError.code,
        message: authError.message,
        status: authError.status,
      });
    }

    // Determine auth source and extract user info
    const isClerkAuth = !!clerkAuth?.userId;
    let userId: string | null = null;
    let user: typeof supabaseUser = null;

    if (isClerkAuth) {
      // Clerk user - look up corresponding Supabase user record
      userId = clerkAuth.userId;

      // Fetch user from Supabase by clerk_user_id
      const { data: clerkUser } = await supabase
        .from("users")
        .select("id, email, created_at, updated_at")
        .eq("clerk_user_id", clerkAuth.userId)
        .single();

      if (clerkUser) {
        // Map to Supabase User shape for backward compatibility
        user = {
          id: clerkUser.id,
          email: clerkUser.email ?? "",
          created_at: clerkUser.created_at,
          updated_at: clerkUser.updated_at,
          // Add minimal required fields
          aud: "authenticated",
          role: "authenticated",
          app_metadata: {},
          user_metadata: {},
        } as typeof supabaseUser;
      }
    } else if (supabaseUser) {
      // Supabase Auth user
      userId = supabaseUser.id;
      user = supabaseUser;
    }

    // Extract org info from Clerk JWT if available
    const orgId = clerkAuth?.orgId ?? null;
    const orgRole = clerkAuth?.orgRole ?? null;

    return {
      headers: opts.headers,
      supabase,

      // Auth info
      userId,
      user, // Populated for both Clerk and Supabase users
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
  return next({
    ctx: {
      ...ctx,
      // Infers both as non-nullable for backward compatibility
      userId: ctx.userId,
      user: ctx.user,
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

    // Check if user is super admin using SQL helper (supports both auth types)
    const { data, error } = await ctx.supabase.rpc("is_super_admin").single();

    if (error) {
      console.error("[Super Admin] Error checking admin status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to verify admin access",
      });
    }

    if (!data) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Super admin access required",
      });
    }

    return next({ ctx: { ...ctx, isSuperAdmin: true } });
  },
);

export const middleware = t.middleware;
