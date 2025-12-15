/**
 * Add Task Command Handler
 *
 * Creates a new recurring task for the channel.
 * Format: `/checklist add HH:MM Task title here`
 * Or: `/checklist add` (opens modal)
 */

import { createServiceClient } from "@odis-ai/db";
import type { CommandContext, CommandResponse } from "../types";
import { slackClient } from "../client";
import { buildAddTaskModal } from "../blocks";

/**
 * Parse time string in HH:MM format
 */
function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr);
  if (!match?.[1] || !match[2]) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

/**
 * Ensure a reminder channel exists for this workspace/channel combination.
 * Creates one if it doesn't exist.
 */
async function ensureReminderChannel(
  context: CommandContext,
): Promise<{ id: string } | null> {
  const supabase = await createServiceClient();

  // Get workspace ID from team_id
  const { data: workspace, error: workspaceError } = await supabase
    .from("slack_workspaces")
    .select("id")
    .eq("team_id", context.teamId)
    .single();

  if (workspaceError || !workspace) {
    console.error("[SLACK_ADD] Workspace not found:", workspaceError);
    return null;
  }

  // Check if channel is already registered
  const { data: existingChannel } = await supabase
    .from("slack_reminder_channels")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("channel_id", context.channelId)
    .single();

  if (existingChannel) {
    return existingChannel;
  }

  // Register this channel for reminders
  const { data: newChannel, error: channelError } = await supabase
    .from("slack_reminder_channels")
    .insert({
      workspace_id: workspace.id,
      channel_id: context.channelId,
      channel_name: context.channelName || "unknown",
      added_by_user_id: context.userId,
      is_active: true,
    })
    .select("id")
    .single();

  if (channelError || !newChannel) {
    console.error("[SLACK_ADD] Failed to register channel:", channelError);
    return null;
  }

  return newChannel;
}

/**
 * Handle `/checklist add` command
 *
 * Creates a new recurring task for the channel.
 * - No arguments: Opens modal form
 * - With arguments: Format: /checklist add HH:MM Task title
 *
 * @param args - Command arguments [time, ...title words]
 * @param context - Command context
 * @returns Ephemeral confirmation message or opens modal
 */
export async function handleAdd(
  args: string[],
  context: CommandContext,
): Promise<CommandResponse> {
  // If no arguments, open modal form
  if (args.length === 0) {
    // First ensure the reminder channel exists
    const reminderChannel = await ensureReminderChannel(context);
    if (!reminderChannel) {
      return {
        responseType: "ephemeral",
        text: "❌ Workspace not found. Please reinstall the app.",
      };
    }

    // Open the modal
    const result = await slackClient.openModal(context.teamId, {
      triggerId: context.triggerId,
      view: buildAddTaskModal({
        slackChannelId: context.channelId,
        reminderChannelId: reminderChannel.id,
      }),
    });

    if (!result.ok) {
      console.error("[SLACK_ADD] Failed to open modal:", result.error);
      return {
        responseType: "ephemeral",
        text: "❌ Failed to open the add task form. Please try again.",
      };
    }

    // Modal opened successfully - no response needed
    return {};
  }

  // Check for required arguments (inline format)
  if (args.length < 2) {
    return {
      responseType: "ephemeral",
      text: "❌ *Invalid format*\n\nUsage:\n• `/checklist add` - Opens a form\n• `/checklist add HH:MM Task title`\n\nExample: `/checklist add 09:00 Morning team sync`",
    };
  }

  const timeArg = args[0];
  const titleParts = args.slice(1);
  const title = titleParts.join(" ");

  // Parse and validate time
  if (!timeArg) {
    return {
      responseType: "ephemeral",
      text: "❌ *Invalid format*\n\nUsage: `/checklist add HH:MM Task title`\n\nExample: `/checklist add 09:00 Morning team sync`",
    };
  }

  const parsedTime = parseTime(timeArg);
  if (!parsedTime) {
    return {
      responseType: "ephemeral",
      text: `❌ *Invalid time format*\n\nPlease use HH:MM format (24-hour).\n\nExample: \`09:00\` or \`14:30\``,
    };
  }

  // Format time for database (HH:MM:SS)
  const reminderTime = `${String(parsedTime.hours).padStart(2, "0")}:${String(parsedTime.minutes).padStart(2, "0")}:00`;

  const supabase = await createServiceClient();

  // Get workspace ID from team_id
  const { data: workspace, error: workspaceError } = await supabase
    .from("slack_workspaces")
    .select("id")
    .eq("team_id", context.teamId)
    .single();

  if (workspaceError || !workspace) {
    console.error("[SLACK_ADD] Workspace not found:", workspaceError);
    return {
      responseType: "ephemeral",
      text: "❌ Workspace not found. Please reinstall the app.",
    };
  }

  // Ensure channel is registered for reminders
  const { data: existingChannel } = await supabase
    .from("slack_reminder_channels")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("channel_id", context.channelId)
    .single();

  let reminderChannelId = existingChannel?.id;

  if (!reminderChannelId) {
    // Register this channel for reminders
    const { data: newChannel, error: channelError } = await supabase
      .from("slack_reminder_channels")
      .insert({
        workspace_id: workspace.id,
        channel_id: context.channelId,
        channel_name: context.channelName || "unknown",
        added_by_user_id: context.userId,
        is_active: true,
      })
      .select("id")
      .single();

    if (channelError || !newChannel) {
      console.error("[SLACK_ADD] Failed to register channel:", channelError);
      return {
        responseType: "ephemeral",
        text: "❌ Failed to register channel for reminders. Please try again.",
      };
    }

    reminderChannelId = newChannel.id;
  }

  // Create the task
  const { error: taskError } = await supabase.from("slack_tasks").insert({
    channel_id: reminderChannelId,
    title,
    reminder_time: reminderTime,
    is_active: true,
    created_by_user_id: context.userId,
  });

  if (taskError) {
    console.error("[SLACK_ADD] Failed to create task:", taskError);
    return {
      responseType: "ephemeral",
      text: "❌ Failed to create task. Please try again.",
    };
  }

  // Format time for display (12-hour format)
  const displayHour = parsedTime.hours % 12 || 12;
  const amPm = parsedTime.hours >= 12 ? "PM" : "AM";
  const displayTime = `${displayHour}:${String(parsedTime.minutes).padStart(2, "0")} ${amPm}`;

  return {
    responseType: "ephemeral",
    text: `✅ *Task added!*\n\n📋 *${title}*\n⏰ Daily at ${displayTime}\n\nThis task will be posted to this channel at the scheduled time. Use \`/checklist list\` to see all tasks.`,
  };
}
