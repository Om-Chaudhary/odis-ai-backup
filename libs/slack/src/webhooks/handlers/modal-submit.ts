/**
 * Modal Submit Handler
 *
 * Handles modal form submissions from Slack.
 */

import type { SlackInteractionPayload } from "../../types";
import { addTaskInputSchema, parseTimeToDbFormat } from "../../validators";
import { slackClient } from "../../client";
import {
  buildReminderMessageBlocks,
  getReminderMessageText,
} from "../../blocks";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ModalSubmitResult {
  ok: boolean;
  error?: string;
  /**
   * Optional response errors to show in the modal
   * Key is block_id, value is error message
   */
  responseErrors?: Record<string, string>;
}

/**
 * Handle modal submission interactions
 *
 * Routes modal submissions to appropriate handlers based on callback_id.
 *
 * @param payload - Slack interaction payload
 * @param supabase - Supabase client for database operations
 * @returns Submit result
 */
export async function handleModalSubmit(
  payload: SlackInteractionPayload,
  supabase: SupabaseClient,
): Promise<ModalSubmitResult> {
  const view = payload.view;
  if (!view) {
    return { ok: false, error: "No view in payload" };
  }

  const { callbackId } = view;

  // Route to specific handler based on callback_id
  if (callbackId === "add_task_modal") {
    return handleAddTaskSubmit(payload, supabase);
  }

  if (callbackId === "delete_confirm_modal") {
    return handleDeleteConfirmSubmit(payload, supabase);
  }

  return { ok: false, error: `Unknown callback_id: ${callbackId}` };
}

/**
 * Handle "Add Task" modal submission
 */
async function handleAddTaskSubmit(
  payload: SlackInteractionPayload,
  supabase: SupabaseClient,
): Promise<ModalSubmitResult> {
  const view = payload.view;
  if (!view) {
    return { ok: false, error: "No view in payload" };
  }

  // Extract form values
  const values = view.state.values;

  const titleValue =
    values.task_title_block?.task_title_input?.value?.trim() ?? "";
  const descriptionValue =
    values.task_description_block?.task_description_input?.value?.trim() ?? "";
  const timeValue =
    values.task_time_block?.task_time_input?.value?.trim() ?? "";

  // Parse and validate input
  const validation = addTaskInputSchema.safeParse({
    title: titleValue,
    description: descriptionValue || undefined,
    time: timeValue,
  });

  if (!validation.success) {
    // Map validation errors to block IDs
    const errors: Record<string, string> = {};
    validation.error.issues.forEach((issue) => {
      const field = issue.path[0];
      if (field === "title") {
        errors.task_title_block = issue.message;
      } else if (field === "description") {
        errors.task_description_block = issue.message;
      } else if (field === "time") {
        errors.task_time_block = issue.message;
      }
    });

    return { ok: false, responseErrors: errors };
  }

  const { title, description, time } = validation.data;

  // Parse metadata to get channel IDs
  let slackChannelId: string;
  let reminderChannelId: string;
  try {
    const metadata = JSON.parse(view.privateMetadata ?? "{}");
    slackChannelId = metadata.slackChannelId;
    reminderChannelId = metadata.reminderChannelId;
    if (!slackChannelId || !reminderChannelId) {
      throw new Error("Missing channel IDs in metadata");
    }
  } catch (error) {
    console.error("[SLACK_MODAL] Failed to parse private metadata", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: "Invalid modal metadata" };
  }

  // Convert time to database format
  let dbTime: string;
  try {
    dbTime = parseTimeToDbFormat(time);
  } catch (error) {
    return {
      ok: false,
      responseErrors: {
        task_time_block:
          error instanceof Error ? error.message : "Invalid time format",
      },
    };
  }

  // Insert task into database
  try {
    const { data: task, error: insertError } = await supabase
      .from("slack_tasks")
      .insert({
        channel_id: reminderChannelId, // Use reminder channel UUID for database FK
        title,
        description: description ?? null,
        reminder_time: dbTime,
        created_by_user_id: payload.user.id,
      })
      .select()
      .single();

    if (insertError || !task) {
      console.error("[SLACK_MODAL] Failed to insert task", {
        error: insertError?.message,
      });
      return { ok: false, error: "Failed to create task" };
    }

    // Send confirmation message to channel using Slack channel ID
    const blocks = buildReminderMessageBlocks({
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
    });

    await slackClient.postMessage(payload.team.id, {
      channel: slackChannelId, // Use Slack channel ID for posting messages
      text: getReminderMessageText({
        id: task.id,
        channelId: task.channel_id,
        title: task.title,
        description: task.description,
        reminderTime: task.reminder_time,
        isActive: task.is_active,
        createdByUserId: task.created_by_user_id,
        createdAt: new Date(task.created_at),
      }),
      blocks,
    });

    return { ok: true };
  } catch (error) {
    console.error("[SLACK_MODAL] Unexpected error in handleAddTaskSubmit", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: "Unexpected error creating task" };
  }
}

/**
 * Handle "Delete Confirmation" modal submission
 */
async function handleDeleteConfirmSubmit(
  payload: SlackInteractionPayload,
  supabase: SupabaseClient,
): Promise<ModalSubmitResult> {
  const view = payload.view;
  if (!view) {
    return { ok: false, error: "No view in payload" };
  }

  // Parse metadata to get task ID
  let taskId: string;
  try {
    const metadata = JSON.parse(view.privateMetadata ?? "{}");
    taskId = metadata.taskId;
    if (!taskId) {
      throw new Error("No taskId in metadata");
    }
  } catch (error) {
    console.error("[SLACK_MODAL] Failed to parse private metadata", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: "Invalid modal metadata" };
  }

  // Soft delete the task
  try {
    const { error: deleteError } = await supabase
      .from("slack_tasks")
      .update({ is_active: false })
      .eq("id", taskId);

    if (deleteError) {
      console.error("[SLACK_MODAL] Failed to delete task", {
        taskId,
        error: deleteError.message,
      });
      return { ok: false, error: "Failed to delete task" };
    }

    return { ok: true };
  } catch (error) {
    console.error(
      "[SLACK_MODAL] Unexpected error in handleDeleteConfirmSubmit",
      {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      },
    );
    return { ok: false, error: "Unexpected error deleting task" };
  }
}
