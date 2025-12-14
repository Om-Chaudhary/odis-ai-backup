/**
 * Slack Interaction Webhooks
 *
 * Central dispatcher for Slack interactive component webhooks.
 */

import type { SlackInteractionPayload } from "../types";
import { interactionPayloadSchema } from "../validators";
import { handleButtonAction } from "./handlers/button-action";
import { handleModalSubmit } from "./handlers/modal-submit";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { KnownBlock } from "@slack/types";

export interface InteractionHandlerResult {
  ok: boolean;
  error?: string;
  /**
   * Optional response for modal validation errors
   */
  response?: {
    response_action: "errors";
    errors: Record<string, string>;
  };
}

/**
 * Handle Slack interaction webhook
 *
 * Routes interactions to appropriate handlers based on type.
 *
 * @param payload - Raw interaction payload from Slack
 * @param supabase - Supabase client for database operations
 * @returns Handler result
 */
export async function handleInteraction(
  payload: unknown,
  supabase: SupabaseClient,
): Promise<InteractionHandlerResult> {
  // Validate payload schema
  const validation = interactionPayloadSchema.safeParse(payload);
  if (!validation.success) {
    console.error("[SLACK_WEBHOOK] Invalid interaction payload", {
      errors: validation.error.issues,
    });
    return { ok: false, error: "Invalid payload format" };
  }

  const interaction = normalizeInteractionPayload(validation.data);

  console.log("[SLACK_WEBHOOK] Processing interaction", {
    type: interaction.type,
    teamId: interaction.team.id,
    userId: interaction.user.id,
  });

  try {
    // Route based on interaction type
    switch (interaction.type) {
      case "block_actions": {
        const result = await handleButtonAction(interaction, supabase);
        return result;
      }

      case "view_submission": {
        const result = await handleModalSubmit(interaction, supabase);
        if (!result.ok && result.responseErrors) {
          // Return validation errors to show in modal
          return {
            ok: false,
            response: {
              response_action: "errors",
              errors: result.responseErrors,
            },
          };
        }
        return result;
      }

      case "view_closed": {
        // User closed modal without submitting
        console.log("[SLACK_WEBHOOK] View closed", {
          callbackId: interaction.view?.callbackId,
        });
        return { ok: true };
      }

      default: {
        console.warn("[SLACK_WEBHOOK] Unknown interaction type", {
          type: interaction.type,
        });
        return { ok: false, error: "Unknown interaction type" };
      }
    }
  } catch (error) {
    console.error("[SLACK_WEBHOOK] Unexpected error handling interaction", {
      type: interaction.type,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: "Internal error processing interaction" };
  }
}

/**
 * Normalize Slack API payload to internal types
 *
 * Converts snake_case fields to camelCase for consistency.
 */
function normalizeInteractionPayload(
  input: Record<string, unknown>,
): SlackInteractionPayload {
  const user = input.user as Record<string, unknown>;
  const team = input.team as Record<string, unknown>;
  const channel = input.channel as Record<string, unknown> | undefined;
  const actions = input.actions as Array<Record<string, unknown>> | undefined;
  const view = input.view as Record<string, unknown> | undefined;
  const message = input.message as Record<string, unknown> | undefined;

  // Helper to safely extract string values from Slack payloads
  const toStr = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    return "";
  };

  return {
    type: input.type as "block_actions" | "view_submission" | "view_closed",
    user: {
      id: toStr(user.id),
      username: toStr(user.username),
      name: typeof user.name === "string" ? user.name : undefined,
      teamId: toStr(user.team_id),
    },
    team: {
      id: toStr(team.id),
      domain: toStr(team.domain),
    },
    channel: channel
      ? {
          id: toStr(channel.id),
          name: toStr(channel.name),
        }
      : undefined,
    triggerId: toStr(input.trigger_id),
    responseUrl:
      typeof input.response_url === "string" ? input.response_url : undefined,
    actions: actions?.map((a) => ({
      type: toStr(a.type),
      actionId: toStr(a.action_id),
      blockId: toStr(a.block_id),
      value: typeof a.value === "string" ? a.value : undefined,
      selectedOption: a.selected_option
        ? {
            value: toStr((a.selected_option as Record<string, unknown>).value),
          }
        : undefined,
    })),
    view: view
      ? {
          id: toStr(view.id),
          callbackId: toStr(view.callback_id),
          privateMetadata: toStr(view.private_metadata),
          state: {
            values: view.state
              ? ((view.state as Record<string, unknown>).values as Record<
                  string,
                  Record<
                    string,
                    {
                      type: string;
                      value?: string;
                      selectedOption?: { value: string };
                    }
                  >
                >)
              : {},
          },
        }
      : undefined,
    message: message
      ? {
          ts: String(message.ts),
          blocks: message.blocks as KnownBlock[],
        }
      : undefined,
  };
}

// Export handlers and types for direct use if needed
export { handleButtonAction } from "./handlers/button-action";
export type { ButtonActionResult } from "./handlers/button-action";
export { handleModalSubmit } from "./handlers/modal-submit";
export type { ModalSubmitResult } from "./handlers/modal-submit";
