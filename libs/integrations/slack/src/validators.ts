/**
 * Slack Validators
 *
 * Zod schemas for validating Slack API responses.
 */

import { z } from "zod";

// ============================================================================
// OAuth Validators
// ============================================================================

export const oauthCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

export const oauthAccessResponseSchema = z.object({
  ok: z.boolean(),
  access_token: z.string().optional(),
  token_type: z.string().optional(),
  scope: z.string().optional(),
  bot_user_id: z.string().optional(),
  app_id: z.string().optional(),
  team: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  authed_user: z
    .object({
      id: z.string(),
    })
    .optional(),
  error: z.string().optional(),
});

export type OAuthAccessResponse = z.infer<typeof oauthAccessResponseSchema>;
