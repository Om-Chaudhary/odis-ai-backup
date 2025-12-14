/**
 * List Tasks Command Handler
 *
 * Shows all active tasks for the channel.
 * Format: `/checklist list`
 */

import type { CommandContext, CommandResponse } from "../types";
import { createServerClient } from "@odis-ai/db";
import type { SlackTask } from "../types";
import { buildTaskList } from "../blocks/task-list";

/**
 * Fetch all active tasks for a channel
 */
async function fetchChannelTasks(channelId: string): Promise<SlackTask[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("slack_tasks")
    .select("*")
    .eq("channel_id", channelId)
    .eq("is_active", true)
    .order("reminder_time", { ascending: true });

  if (error) {
    console.error("[SLACK_COMMANDS] Failed to fetch tasks", {
      channelId,
      error: error.message,
    });
    throw new Error("Failed to fetch tasks from database");
  }

  // Map database rows to SlackTask type
  return (data ?? []).map((row) => ({
    id: row.id,
    channelId: row.channel_id,
    title: row.title,
    description: row.description,
    reminderTime: row.reminder_time,
    isActive: row.is_active,
    createdByUserId: row.created_by_user_id,
    createdAt: new Date(row.created_at),
  }));
}

/**
 * Handle `/checklist list` command
 *
 * @param context - Command context
 * @returns Task list or empty state message
 */
export async function handleList(
  context: CommandContext,
): Promise<CommandResponse> {
  try {
    const tasks = await fetchChannelTasks(context.channelId);

    if (tasks.length === 0) {
      return {
        responseType: "ephemeral",
        text: `No tasks found for #${context.channelName}. Use \`/checklist add\` to create your first task!`,
      };
    }

    return {
      responseType: "ephemeral",
      blocks: buildTaskList(tasks, context.channelName),
      text: `${tasks.length} task(s) configured for #${context.channelName}`,
    };
  } catch (error) {
    console.error("[SLACK_COMMANDS] Error in list command", {
      channelId: context.channelId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      responseType: "ephemeral",
      text: "Failed to fetch tasks. Please try again.",
    };
  }
}
