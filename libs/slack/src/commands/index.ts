/**
 * Slack Command Router
 *
 * Parses `/checklist <subcommand>` and routes to appropriate handlers.
 */

import type {
  ChecklistCommand,
  CommandContext,
  CommandResponse,
} from "../types";
import { handleAdd } from "./add";
import { handleList } from "./list";
import { handleStatus } from "./status";
import { handleDelete } from "./delete";
import { handleHelp } from "./help";

/**
 * Parse command text to extract subcommand and arguments
 */
function parseCommand(text: string): {
  command: ChecklistCommand;
  args: string[];
} {
  const trimmed = text.trim();
  if (!trimmed) {
    return { command: "help", args: [] };
  }

  const parts = trimmed.split(/\s+/);
  const command = (parts[0] ?? "help").toLowerCase() as ChecklistCommand;
  const args = parts.slice(1);

  return { command, args };
}

/**
 * Validate that the command is a known subcommand
 */
function isValidCommand(cmd: string): cmd is ChecklistCommand {
  return ["add", "list", "status", "delete", "help"].includes(cmd);
}

/**
 * Route slash command to appropriate handler
 *
 * @param text - The text after `/checklist`
 * @param context - Command context from Slack
 * @returns Command response (ephemeral or in_channel)
 */
export async function routeCommand(
  text: string,
  context: CommandContext,
): Promise<CommandResponse> {
  const { command, args } = parseCommand(text);

  // Validate command
  if (!isValidCommand(command)) {
    const unknownCmd = command as string;
    return {
      responseType: "ephemeral",
      text: `Unknown command: \`${unknownCmd}\`. Type \`/checklist help\` for usage instructions.`,
    };
  }

  // Route to handler
  try {
    switch (command) {
      case "add":
        return await handleAdd(args, context);
      case "list":
        return await handleList(context);
      case "status":
        return await handleStatus(context);
      case "delete":
        return await handleDelete(context);
      case "help":
        return handleHelp();
      default:
        return handleHelp();
    }
  } catch (error) {
    console.error("[SLACK_COMMANDS] Error routing command", {
      command,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      responseType: "ephemeral",
      text: "An error occurred processing your command. Please try again.",
    };
  }
}
