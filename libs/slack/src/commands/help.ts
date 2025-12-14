/**
 * Help Command Handler
 *
 * Shows usage instructions for the checklist bot.
 */

import type { CommandResponse } from "../types";
import { buildHelpMessage } from "../blocks/help-message";

/**
 * Handle `/checklist help` command
 *
 * @returns Help message with command usage
 */
export function handleHelp(): CommandResponse {
  return {
    responseType: "ephemeral",
    blocks: buildHelpMessage(),
    text: "Checklist Bot Help - Available commands: add, list, status, delete, help",
  };
}
