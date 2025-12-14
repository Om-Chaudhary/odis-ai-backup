/**
 * Slack Validators
 *
 * Zod schemas for validating Slack webhook payloads and API responses.
 */

import { z } from "zod";

// ============================================================================
// Slash Command Validators
// ============================================================================

export const slashCommandPayloadSchema = z.object({
  command: z.string(),
  text: z.string(),
  response_url: z.string().url(),
  trigger_id: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  team_id: z.string(),
  team_domain: z.string(),
  channel_id: z.string(),
  channel_name: z.string(),
});

export type SlashCommandPayloadInput = z.infer<
  typeof slashCommandPayloadSchema
>;

// ============================================================================
// Interaction Validators
// ============================================================================

const slackUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string().optional(),
  team_id: z.string(),
});

const slackTeamSchema = z.object({
  id: z.string(),
  domain: z.string(),
});

const slackChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const blockActionSchema = z.object({
  type: z.string(),
  action_id: z.string(),
  block_id: z.string(),
  value: z.string().optional(),
  selected_option: z
    .object({
      value: z.string(),
    })
    .optional(),
});

const viewStateValueSchema = z.object({
  type: z.string(),
  value: z.string().optional().nullable(),
  selected_option: z
    .object({
      value: z.string(),
    })
    .optional()
    .nullable(),
});

const viewPayloadSchema = z.object({
  id: z.string(),
  callback_id: z.string(),
  private_metadata: z.string().optional().default(""),
  state: z.object({
    values: z.record(z.record(viewStateValueSchema)),
  }),
});

export const interactionPayloadSchema = z.object({
  type: z.enum(["block_actions", "view_submission", "view_closed"]),
  user: slackUserSchema,
  team: slackTeamSchema,
  channel: slackChannelSchema.optional(),
  trigger_id: z.string(),
  response_url: z.string().optional(),
  actions: z.array(blockActionSchema).optional(),
  view: viewPayloadSchema.optional(),
  message: z
    .object({
      ts: z.string(),
      blocks: z.array(z.unknown()),
    })
    .optional(),
});

export type InteractionPayloadInput = z.infer<typeof interactionPayloadSchema>;

// ============================================================================
// Task Input Validators
// ============================================================================

/**
 * Time format: HH:MM (24-hour) or H:MMam/pm
 */
const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])(am|pm)?$/i;

export const addTaskInputSchema = z.object({
  time: z
    .string()
    .regex(timeRegex, "Invalid time format. Use HH:MM or H:MMam/pm"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
});

export type AddTaskInput = z.infer<typeof addTaskInputSchema>;

/**
 * Parse time string to 24-hour format "HH:MM:SS"
 */
export function parseTimeToDbFormat(time: string): string {
  const match = /^(\d{1,2}):(\d{2})(am|pm)?$/i.exec(time);
  if (!match) {
    throw new Error(`Invalid time format: ${time}`);
  }

  let hours = parseInt(match[1]!, 10);
  const minutes = match[2]!;
  const period = match[3]?.toLowerCase();

  if (period === "pm" && hours < 12) {
    hours += 12;
  } else if (period === "am" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
}

/**
 * Format database time to display format
 */
export function formatTimeForDisplay(dbTime: string): string {
  const [hours, minutes] = dbTime.split(":");
  const hour = parseInt(hours!, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
}

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
