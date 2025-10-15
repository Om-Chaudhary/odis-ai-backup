import { z } from "zod";
import { publicProcedure, router } from "~/server/api/trpc";
import { createServiceClient } from "~/lib/supabase/server";
import PostHogClient from "~/lib/posthog";

export const waitlistRouter = router({
  join: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        practiceName: z.string().optional(),
        role: z.string().optional(),
        campaign: z.string().default("landing"),
        source: z
          .enum(["navigation", "hero", "cta_section"]) // align with UI triggerLocation
          .default("navigation"),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const supabase = await createServiceClient();
      const posthog = PostHogClient();

      const ipHeader =
        ctx.headers.get("x-forwarded-for") ??
        ctx.headers.get("x-real-ip") ??
        null;
      const userAgent = ctx.headers.get("user-agent") ?? undefined;

      type WaitlistInsertReturn = { id: string; created_at: string };
      const { data, error } = await supabase
        .from("waitlist_signups")
        .insert({
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
        })
        .select("id, created_at")
        .single<WaitlistInsertReturn>();

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
    }),
});
