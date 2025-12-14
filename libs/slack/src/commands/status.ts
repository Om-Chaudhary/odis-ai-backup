/**
 * Status Command Handler
 *
 * Shows today's task completion status.
 * Format: `/checklist status`
 */

import type { CommandContext, CommandResponse } from "../types";
import { createServiceClient } from "@odis-ai/db/server";
import type { SlackTask, SlackTaskCompletion } from "../types";
import { buildStatusMessage } from "../blocks/status-message";

/**
 * Task with optional completion info
 */
interface TaskWithCompletion extends SlackTask {
  completion?: SlackTaskCompletion;
}

/**
 * Fetch tasks with today's completion status
 */
async function fetchTasksWithStatus(
  channelId: string,
): Promise<TaskWithCompletion[]> {
  const supabase = await createServiceClient();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Fetch all active tasks for the channel
  const { data: tasks, error: tasksError } = await supabase
    .from("slack_tasks")
    .select("*")
    .eq("channel_id", channelId)
    .eq("is_active", true)
    .order("reminder_time", { ascending: true });

  if (tasksError) {
    console.error("[SLACK_COMMANDS] Failed to fetch tasks", {
      channelId,
      error: tasksError.message,
    });
    throw new Error("Failed to fetch tasks from database");
  }

  if (!tasks || tasks.length === 0) {
    return [];
  }

  // Fetch today's completions for these tasks
  const taskIds = tasks.map((t) => t.id);
  const { data: completions, error: completionsError } = await supabase
    .from("slack_task_completions")
    .select("*")
    .in("task_id", taskIds)
    .eq("completion_date", today);

  if (completionsError) {
    console.error("[SLACK_COMMANDS] Failed to fetch completions", {
      channelId,
      error: completionsError.message,
    });
    // Don't throw - just show tasks as incomplete
  }

  // Map completions by task_id
  const completionMap = new Map<string, SlackTaskCompletion>();
  (completions ?? []).forEach((c) => {
    completionMap.set(c.task_id, {
      id: c.id,
      taskId: c.task_id,
      completionDate: c.completion_date,
      completedByUserId: c.completed_by_user_id,
      completedByUsername: c.completed_by_username,
      completedAt: new Date(c.completed_at),
      messageTs: c.message_ts,
    });
  });

  // Combine tasks with completions
  return tasks.map((t) => ({
    id: t.id,
    channelId: t.channel_id,
    title: t.title,
    description: t.description,
    reminderTime: t.reminder_time,
    isActive: t.is_active,
    createdByUserId: t.created_by_user_id,
    createdAt: new Date(t.created_at),
    completion: completionMap.get(t.id),
  }));
}

/**
 * Handle `/checklist status` command
 *
 * @param context - Command context
 * @returns Daily status message
 */
export async function handleStatus(
  context: CommandContext,
): Promise<CommandResponse> {
  try {
    const tasksWithStatus = await fetchTasksWithStatus(context.channelId);

    if (tasksWithStatus.length === 0) {
      return {
        responseType: "ephemeral",
        text: `No tasks configured for #${context.channelName}. Use \`/checklist add\` to create your first task!`,
      };
    }

    const completed = tasksWithStatus.filter((t) => t.completion).length;
    const total = tasksWithStatus.length;

    return {
      responseType: "in_channel",
      blocks: buildStatusMessage(tasksWithStatus, context.channelName),
      text: `Daily Checklist Status: ${completed}/${total} tasks completed`,
    };
  } catch (error) {
    console.error("[SLACK_COMMANDS] Error in status command", {
      channelId: context.channelId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      responseType: "ephemeral",
      text: "Failed to fetch status. Please try again.",
    };
  }
}
