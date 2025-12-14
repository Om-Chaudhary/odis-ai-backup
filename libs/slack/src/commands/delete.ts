/**
 * Delete Task Command Handler
 *
 * Shows tasks with delete buttons (interactive components).
 * Format: `/checklist delete`
 */

import type { CommandContext, CommandResponse } from "../types";

/**
 * Handle `/checklist delete` command
 *
 * For Phase 3, we just return a placeholder message.
 * Phase 4 will implement the interactive delete UI.
 *
 * @param context - Command context
 * @returns Ephemeral message
 */
export async function handleDelete(
  _context: CommandContext,
): Promise<CommandResponse> {
  // TODO: Phase 4 - Build interactive message with delete buttons
  // Will use Block Kit actions and handle via interactions webhook
  return {
    responseType: "ephemeral",
    text: "Opening task deletion interface...\n\n_Note: Interactive delete UI will be implemented in Phase 4_",
  };
}
