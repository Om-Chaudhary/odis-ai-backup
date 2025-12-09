import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { createServiceClient } from "@odis/db/server";
import PostHogClient from "~/lib/posthog";
import type { Database } from "~/database.types";

type WaitlistSignup = Database["public"]["Tables"]["waitlist_signups"]["Row"];
type WaitlistInsert =
  Database["public"]["Tables"]["waitlist_signups"]["Insert"];
type WaitlistUpdate =
  Database["public"]["Tables"]["waitlist_signups"]["Update"];

export const waitlistRouter = createTRPCRouter({
  join: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        practiceName: z.string().optional(),
        role: z.string().optional(),
        campaign: z.string().default("landing"),
        source: z.string().default("navigation"),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const supabase = await createServiceClient();
        const posthog = PostHogClient();

        const ipHeader =
          ctx.headers.get("x-forwarded-for") ??
          ctx.headers.get("x-real-ip") ??
          null;
        const userAgent = ctx.headers.get("user-agent") ?? undefined;

        const insertData: WaitlistInsert = {
          email: input.email,
          full_name: input.name,
          source: input.source,
          campaign: input.campaign,
          ip: ipHeader ?? undefined,
          user_agent: userAgent,
          status: "waiting",
          metadata: {
            practiceName: input.practiceName ?? null,
            role: input.role ?? null,
            ...(input.metadata ?? {}),
          },
        };

        const { data, error } = await supabase
          .from("waitlist_signups")
          .insert(insertData)
          .select("id, created_at")
          .single<{ id: string; created_at: string }>();

        if (error) {
          // Unique violation: surface a friendly message
          if (error.code === "23505") {
            // Fire a server-side analytics event for idempotent joins
            posthog.capture({
              distinctId: input.email,
              event: "waitlist_signup_duplicate",
              properties: {
                campaign: input.campaign,
                source: input.source,
              },
            });
            // best-effort flush without blocking
            try {
              await posthog.flush();
            } catch {}
            return { ok: true, alreadyExists: true } as const;
          }
          posthog.capture({
            distinctId: input.email,
            event: "waitlist_signup_failed",
            properties: {
              campaign: input.campaign,
              source: input.source,
              error: error.message,
              code: error.code,
            },
          });
          try {
            await posthog.flush();
          } catch {}
          throw error;
        }

        posthog.capture({
          distinctId: input.email,
          event: "waitlist_signup_success_server",
          properties: {
            campaign: input.campaign,
            source: input.source,
            id: data.id,
          },
        });
        try {
          await posthog.flush();
        } catch {}
        return { ok: true, id: data.id, createdAt: data.created_at } as const;
      } catch (error) {
        console.error("Waitlist mutation error:", error);
        throw error;
      }
    }),

  // Example protected procedure - requires authentication
  getMyWaitlistStatus: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("waitlist_signups")
      .select("*")
      .eq("email", ctx.user.email)
      .single<WaitlistSignup>();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return {
      isOnWaitlist: !!data,
      status: data?.status ?? null,
      joinedAt: data?.created_at ?? null,
      // Note: position field doesn't exist in the schema, removing it
    };
  }),

  // Another example protected procedure
  updateWaitlistProfile: protectedProcedure
    .input(
      z.object({
        practiceName: z.string().optional(),
        role: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const updateData: WaitlistUpdate = {
        metadata: {
          practiceName: input.practiceName,
          role: input.role,
          ...(input.metadata ?? {}),
        },
      };

      const { data, error } = await ctx.supabase
        .from("waitlist_signups")
        .update(updateData)
        .eq("email", ctx.user.email)
        .select()
        .single<WaitlistSignup>();

      if (error) {
        throw error;
      }

      return { ok: true, updated: data };
    }),
});
