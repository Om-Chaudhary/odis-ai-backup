/**
 * Button Action Handler
 *
 * Handles button click interactions from Slack messages.
 */

import type { SlackInteractionPayload, SlackBlockAction } from "../../types";
import { slackClient } from "../../client";
import { buildReminderMessageBlocks } from "../../blocks";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ButtonActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Handle button action interactions
 *
 * Routes button clicks to appropriate handlers based on action_id.
 *
 * @param payload - Slack interaction payload
 * @param supabase - Supabase client for database operations
 * @returns Action result
 */
export async function handleButtonAction(
  payload: SlackInteractionPayload,
  supabase: SupabaseClient,
): Promise<ButtonActionResult> {
  const action = payload.actions?.[0];
  if (!action) {
    return { ok: false, error: "No action found" };
  }

  const { actionId } = action;

  // Route to specific handler based on action_id prefix
  if (actionId.startsWith("complete_task_")) {
    return handleCompleteTask(payload, action, supabase);
  }

  if (actionId.startsWith("delete_task_")) {
    return handleDeleteTask(payload, action, supabase);
  }

  if (actionId === "view_status") {
    return handleViewStatus(payload, supabase);
  }

  return { ok: false, error: `Unknown action: ${actionId}` };
}

/**
 * Handle "Mark Complete" button click
 */
async function handleCompleteTask(
  payload: SlackInteractionPayload,
  action: SlackBlockAction,
  supabase: SupabaseClient,
): Promise<ButtonActionResult> {
  const taskId = action.value;
  if (!taskId) {
    return { ok: false, error: "No task ID in action value" };
  }

  const { user, message, channel } = payload;
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    // Try to insert completion record directly
    // The unique constraint (task_id, completion_date) handles race conditions
    const { error: insertError } = await supabase
      .from("slack_task_completions")
      .insert({
        task_id: taskId,
        completion_date: today,
        completed_by_user_id: user.id,
        completed_by_username: user.username,
        message_ts: message?.ts ?? null,
      });

    if (insertError) {
      // Handle unique constraint violation (task already completed)
      if (insertError.code === "23505") {
        return { ok: false, error: "Task already completed today" };
      }
      console.error("[SLACK_BUTTON] Failed to insert completion", {
        taskId,
        error: insertError.message,
        code: insertError.code,
      });
      return { ok: false, error: "Failed to mark task complete" };
    }

    // Fetch task details to update message
    const { data: task, error: taskError } = await supabase
      .from("slack_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      console.error("[SLACK_BUTTON] Failed to fetch task", {
        taskId,
        error: taskError?.message,
      });
      // Completion was saved, but we can't update the message
      return { ok: true };
    }

    // Update message to show completion
    if (message?.ts && channel?.id) {
      const updatedBlocks = buildReminderMessageBlocks({
        task: {
          id: task.id,
          channelId: task.channel_id,
          title: task.title,
          description: task.description,
          reminderTime: task.reminder_time,
          isActive: task.is_active,
          createdByUserId: task.created_by_user_id,
          createdAt: new Date(task.created_at),
        },
        isCompleted: true,
        completedBy: `<@${user.id}>`,
      });

      await slackClient.updateMessage(
        payload.team.id,
        channel.id,
        message.ts,
        updatedBlocks,
        `Task completed: ${task.title}`,
      );
    }

    return { ok: true };
  } catch (error) {
    console.error("[SLACK_BUTTON] Unexpected error in handleCompleteTask", {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: "Unexpected error" };
  }
}

/**
 * Handle "Delete Task" button click
 */
async function handleDeleteTask(
  payload: SlackInteractionPayload,
  action: SlackBlockAction,
  supabase: SupabaseClient,
): Promise<ButtonActionResult> {
  const taskId = action.value;
  if (!taskId) {
    return { ok: false, error: "No task ID in action value" };
  }

  try {
    // Soft delete the task (set is_active = false)
    const { error: deleteError } = await supabase
      .from("slack_tasks")
      .update({ is_active: false })
      .eq("id", taskId);

    if (deleteError) {
      console.error("[SLACK_BUTTON] Failed to delete task", {
        taskId,
        error: deleteError.message,
      });
      return { ok: false, error: "Failed to delete task" };
    }

    // Update message to show deletion
    const { message, channel } = payload;
    if (message?.ts && channel?.id) {
      const updatedBlocks = [
        {
          type: "section" as const,
          text: {
            type: "mrkdwn" as const,
            text: ":wastebasket: *Task deleted*",
          },
        },
      ];

      await slackClient.updateMessage(
        payload.team.id,
        channel.id,
        message.ts,
        updatedBlocks,
        "Task deleted",
      );
    }

    return { ok: true };
  } catch (error) {
    console.error("[SLACK_BUTTON] Unexpected error in handleDeleteTask", {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: "Unexpected error" };
  }
}

/**
 * Handle "View Status" button click
 */
async function handleViewStatus(
  payload: SlackInteractionPayload,
  supabase: SupabaseClient,
): Promise<ButtonActionResult> {
  const { channel } = payload;
  if (!channel?.id) {
    return { ok: false, error: "No channel ID" };
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    // Fetch all active tasks for this channel
    const { data: tasks, error: tasksError } = await supabase
      .from("slack_tasks")
      .select("*")
      .eq("channel_id", channel.id)
      .eq("is_active", true)
      .order("reminder_time");

    if (tasksError) {
      console.error("[SLACK_BUTTON] Failed to fetch tasks", {
        channelId: channel.id,
        error: tasksError.message,
      });
      return { ok: false, error: "Failed to fetch tasks" };
    }

    if (!tasks || tasks.length === 0) {
      return { ok: true }; // No tasks to show status for
    }

    // Fetch completions for today
    const taskIds = tasks.map((t) => t.id);
    const { data: completions, error: completionsError } = await supabase
      .from("slack_task_completions")
      .select("task_id, completed_by_username")
      .in("task_id", taskIds)
      .eq("completion_date", today);

    if (completionsError) {
      console.error("[SLACK_BUTTON] Failed to fetch completions", {
        channelId: channel.id,
        error: completionsError.message,
      });
      return { ok: false, error: "Failed to fetch completions" };
    }

    // Build status message
    const completionMap = new Map(
      completions?.map((c) => [c.task_id, c.completed_by_username]) ?? [],
    );

    const statusLines = tasks.map((task) => {
      const isCompleted = completionMap.has(task.id);
      const icon = isCompleted ? ":white_check_mark:" : ":white_circle:";
      const completedBy = completionMap.get(task.id);
      const byText = completedBy ? ` (by ${completedBy})` : "";
      return `${icon} ${task.title}${byText}`;
    });

    const statusText = ["*Today's Checklist Status*\n", ...statusLines].join(
      "\n",
    );

    // Post ephemeral message (only visible to user)
    await slackClient.postMessage(payload.team.id, {
      channel: channel.id,
      text: statusText,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: statusText,
          },
        },
      ],
    });

    return { ok: true };
  } catch (error) {
    console.error("[SLACK_BUTTON] Unexpected error in handleViewStatus", {
      channelId: channel?.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: "Unexpected error" };
  }
}
