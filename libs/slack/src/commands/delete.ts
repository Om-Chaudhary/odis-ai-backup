/**
 * Delete Task Command Handler
 *
 * Shows tasks with delete buttons (interactive components).
 * Format: `/checklist delete`
 */

import type { KnownBlock } from "@slack/types";
import { createServiceClient } from "@odis-ai/db/server";
import type { CommandContext, CommandResponse, SlackTask } from "../types";

/**
 * Fetch all active tasks for a channel
 */
async function fetchChannelTasks(
  teamId: string,
  slackChannelId: string,
): Promise<SlackTask[]> {
  const supabase = await createServiceClient();

  // Get workspace ID from team_id
  const { data: workspace } = await supabase
    .from("slack_workspaces")
    .select("id")
    .eq("team_id", teamId)
    .single();

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Get the reminder channel record
  const { data: channel } = await supabase
    .from("slack_reminder_channels")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("channel_id", slackChannelId)
    .single();

  if (!channel) {
    return [];
  }

  // Fetch tasks for this channel
  const { data, error } = await supabase
    .from("slack_tasks")
    .select("*")
    .eq("channel_id", channel.id)
    .eq("is_active", true)
    .order("reminder_time", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch tasks from database");
  }

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
 * Format time for display (12-hour format)
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours ?? "0", 10);
  const displayHour = h % 12 || 12;
  const amPm = h >= 12 ? "PM" : "AM";
  return `${displayHour}:${minutes} ${amPm}`;
}

/**
 * Build delete interface with buttons for each task
 */
function buildDeleteInterface(
  tasks: SlackTask[],
  channelName: string,
): KnownBlock[] {
  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🗑️ Delete Tasks",
        emoji: true,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Select a task to delete from #${channelName}`,
        },
      ],
    },
    {
      type: "divider",
    },
  ];

  // Add each task with a delete button
  for (const task of tasks) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${task.title}*\n⏰ ${formatTime(task.reminderTime)}`,
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Delete",
          emoji: true,
        },
        style: "danger",
        action_id: `delete_task_${task.id}`,
        value: task.id,
        confirm: {
          title: {
            type: "plain_text",
            text: "Delete Task",
          },
          text: {
            type: "mrkdwn",
            text: `Are you sure you want to delete "*${task.title}*"? This cannot be undone.`,
          },
          confirm: {
            type: "plain_text",
            text: "Delete",
          },
          deny: {
            type: "plain_text",
            text: "Cancel",
          },
          style: "danger",
        },
      },
    });
  }

  return blocks;
}

/**
 * Handle `/checklist delete` command
 *
 * Shows interactive interface with delete buttons for each task.
 *
 * @param context - Command context
 * @returns Ephemeral message with delete buttons
 */
export async function handleDelete(
  context: CommandContext,
): Promise<CommandResponse> {
  try {
    const tasks = await fetchChannelTasks(context.teamId, context.channelId);

    if (tasks.length === 0) {
      return {
        responseType: "ephemeral",
        text: `No tasks found for #${context.channelName}. Nothing to delete!`,
      };
    }

    return {
      responseType: "ephemeral",
      blocks: buildDeleteInterface(tasks, context.channelName),
      text: `${tasks.length} task(s) available to delete`,
    };
  } catch (error) {
    console.error("[SLACK_COMMANDS] Error in delete command", {
      channelId: context.channelId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      responseType: "ephemeral",
      text: "Failed to load tasks. Please try again.",
    };
  }
}
