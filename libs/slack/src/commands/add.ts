/**
 * Add Task Command Handler
 *
 * Opens a modal to add a new task to the checklist.
 * Format: `/checklist add`
 */

import type { CommandContext, CommandResponse } from "../types";

/**
 * Handle `/checklist add` command
 *
 * For Phase 3, we just return a placeholder message.
 * Phase 4 will implement the modal opening.
 *
 * @param args - Command arguments (unused for now)
 * @param context - Command context
 * @returns Ephemeral message
 */
export async function handleAdd(
  _args: string[],
  _context: CommandContext,
): Promise<CommandResponse> {
  // TODO: Phase 4 - Open modal with slackClient.openModal()
  // For now, just acknowledge the command
  return {
    responseType: "ephemeral",
    text: "Opening task creation modal...\n\n_Note: Modal functionality will be implemented in Phase 4_",
  };
}
