/**
 * Add Task Command Handler
 *
 * Creates a new recurring task for the channel.
 * Format: `/checklist add HH:MM Task title here`
 */

import { createServiceClient } from "@odis-ai/db";
import type { CommandContext, CommandResponse } from "../types";

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
 * Handle `/checklist add` command
 *
 * Creates a new recurring task for the channel.
 * Format: /checklist add HH:MM Task title
 *
 * @param args - Command arguments [time, ...title words]
 * @param context - Command context
 * @returns Ephemeral confirmation message
 */
export async function handleAdd(
  args: string[],
  context: CommandContext,
): Promise<CommandResponse> {
  // Check for required arguments
  if (args.length < 2) {
    return {
      responseType: "ephemeral",
      text: "❌ *Invalid format*\n\nUsage: `/checklist add HH:MM Task title`\n\nExample: `/checklist add 09:00 Morning team sync`",
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

  // Ensure channel is registered for reminders
  const { data: existingChannel } = await supabase
    .from("slack_reminder_channels")
    .select("id")
    .eq("team_id", context.teamId)
    .eq("channel_id", context.channelId)
    .single();

  let channelId = existingChannel?.id;

  if (!channelId) {
    // Register this channel for reminders
    const { data: newChannel, error: channelError } = await supabase
      .from("slack_reminder_channels")
      .insert({
        team_id: context.teamId,
        channel_id: context.channelId,
        channel_name: context.channelName || "unknown",
        reminder_time: reminderTime,
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

    channelId = newChannel.id;
  }

  // Create the task
  const { error: taskError } = await supabase.from("slack_tasks").insert({
    channel_id: channelId,
    title,
    reminder_time: reminderTime,
    is_active: true,
    created_by: context.userId,
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
