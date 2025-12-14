/**
 * Daily Trigger for Slack Task Reminders
 *
 * Sends reminder messages for tasks scheduled in the current time window.
 * Designed to be called by QStash cron every 15 minutes.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { slackClient } from "../client";
import {
  buildReminderMessageBlocks,
  getReminderMessageText,
} from "../blocks/reminder-message";
import type {
  SlackReminderChannel,
  SlackTask,
  SlackTaskCompletionInsert,
} from "../types";

/**
 * Result of a daily reminder trigger
 */
export interface DailyTriggerResult {
  success: boolean;
  channelsProcessed: number;
  tasksProcessed: number;
  messagesSent: number;
  errors: string[];
}

/**
 * Channel with active tasks for the current time window
 */
interface ChannelWithTasks {
  channel: SlackReminderChannel & { team_id: string };
  tasks: SlackTask[];
}

/**
 * Send daily reminders for tasks scheduled in the current time window
 *
 * Logic:
 * 1. Calculate current time window (15 min intervals)
 * 2. Query channels with tasks due in this window (considering timezone)
 * 3. For each channel, check if tasks are already completed today
 * 4. Send reminder message for incomplete tasks
 * 5. Track message_ts for future updates
 *
 * @param supabase - Service client (bypasses RLS)
 * @returns Result summary
 */
export async function sendDailyReminders(
  supabase: SupabaseClient,
): Promise<DailyTriggerResult> {
  const result: DailyTriggerResult = {
    success: true,
    channelsProcessed: 0,
    tasksProcessed: 0,
    messagesSent: 0,
    errors: [],
  };

  try {
    console.log("[SLACK_SCHEDULER] Starting daily reminder trigger");

    // Get current time window (15-minute intervals)
    const { startTime, endTime } = getCurrentTimeWindow();
    const completionDate = getTodayDateString();

    console.log("[SLACK_SCHEDULER] Time window", {
      startTime,
      endTime,
      completionDate,
    });

    // Query channels with tasks due in this window
    const channelsWithTasks = await getChannelsWithDueTasks(
      supabase,
      startTime,
      endTime,
    );

    console.log(
      `[SLACK_SCHEDULER] Found ${channelsWithTasks.length} channels with tasks`,
    );

    // Process each channel
    for (const { channel, tasks } of channelsWithTasks) {
      result.channelsProcessed++;

      try {
        // Get today's completions for this channel
        const completedTaskIds = await getTodayCompletions(
          supabase,
          tasks.map((t) => t.id),
          completionDate,
        );

        // Filter out already-completed tasks
        const incompleteTasks = tasks.filter(
          (t) => !completedTaskIds.has(t.id),
        );

        console.log(
          `[SLACK_SCHEDULER] Channel ${channel.channelName}: ${incompleteTasks.length} incomplete tasks`,
          {
            total: tasks.length,
            completed: completedTaskIds.size,
            incomplete: incompleteTasks.length,
          },
        );

        // Send reminder for each incomplete task
        for (const task of incompleteTasks) {
          result.tasksProcessed++;

          try {
            const blocks = buildReminderMessageBlocks({ task });
            const text = getReminderMessageText(task);

            const response = await slackClient.postMessage(channel.team_id, {
              channel: channel.channelId,
              blocks,
              text,
            });

            if (response.ok && response.ts) {
              result.messagesSent++;

              // Store the message_ts for future updates
              await storeReminderMessage(
                supabase,
                task.id,
                completionDate,
                response.ts,
              );

              console.log(
                `[SLACK_SCHEDULER] Sent reminder for task ${task.id}`,
                {
                  taskTitle: task.title,
                  messageTs: response.ts,
                },
              );
            } else {
              const error = `Failed to send reminder for task ${task.id}: ${response.error}`;
              result.errors.push(error);
              console.error(`[SLACK_SCHEDULER] ${error}`);
            }
          } catch (taskError) {
            const error = `Error sending task ${task.id}: ${taskError instanceof Error ? taskError.message : String(taskError)}`;
            result.errors.push(error);
            console.error(`[SLACK_SCHEDULER] ${error}`);
          }
        }
      } catch (channelError) {
        const error = `Error processing channel ${channel.channelName}: ${channelError instanceof Error ? channelError.message : String(channelError)}`;
        result.errors.push(error);
        console.error(`[SLACK_SCHEDULER] ${error}`);
      }
    }

    result.success = result.errors.length === 0;

    console.log("[SLACK_SCHEDULER] Daily reminder trigger complete", result);

    return result;
  } catch (error) {
    console.error("[SLACK_SCHEDULER] Fatal error in daily trigger", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : "Unknown error",
    );

    return result;
  }
}

/**
 * Get current 15-minute time window
 *
 * QStash runs every 15 minutes, so we match tasks within the current window.
 * Example: If now is 9:07, window is 9:00-9:14
 */
function getCurrentTimeWindow(): { startTime: string; endTime: string } {
  const now = new Date();

  // Round down to nearest 15-minute interval
  const minutes = now.getUTCMinutes();
  const roundedMinutes = Math.floor(minutes / 15) * 15;

  const start = new Date(now);
  start.setUTCMinutes(roundedMinutes, 0, 0);

  const end = new Date(start);
  end.setUTCMinutes(roundedMinutes + 14, 59, 999);

  // Format as HH:MM:SS for TIME comparison
  const startTime = start.toISOString().substring(11, 19);
  const endTime = end.toISOString().substring(11, 19);

  return { startTime, endTime };
}

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
function getTodayDateString(): string {
  return new Date().toISOString().substring(0, 10);
}

/**
 * Query channels with tasks due in the current time window
 *
 * Note: For MVP, we compare against UTC time. Future enhancement:
 * Convert reminder_time to channel's timezone before comparison.
 */
async function getChannelsWithDueTasks(
  supabase: SupabaseClient,
  startTime: string,
  endTime: string,
): Promise<ChannelWithTasks[]> {
  // Query using raw SQL for time window matching
  const { data, error } = await supabase.rpc("get_channels_with_due_tasks", {
    p_start_time: startTime,
    p_end_time: endTime,
  });

  if (error) {
    console.error(
      "[SLACK_SCHEDULER] Failed to query channels with due tasks",
      error,
    );
    throw new Error(`Database query failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Group tasks by channel
  const channelMap = new Map<string, ChannelWithTasks>();

  for (const row of data) {
    const channelId = row.channel_db_id;

    if (!channelMap.has(channelId)) {
      channelMap.set(channelId, {
        channel: {
          id: row.channel_db_id,
          workspaceId: row.workspace_id,
          channelId: row.channel_id,
          channelName: row.channel_name,
          reminderTime: row.channel_reminder_time,
          timezone: row.timezone,
          isActive: row.channel_is_active,
          addedByUserId: row.added_by_user_id,
          createdAt: new Date(row.channel_created_at),
          team_id: row.team_id,
        },
        tasks: [],
      });
    }

    channelMap.get(channelId)!.tasks.push({
      id: row.task_id,
      channelId: row.channel_db_id,
      title: row.task_title,
      description: row.task_description,
      reminderTime: row.task_reminder_time,
      isActive: row.task_is_active,
      createdByUserId: row.task_created_by_user_id,
      createdAt: new Date(row.task_created_at),
    });
  }

  return Array.from(channelMap.values());
}

/**
 * Get task IDs that have already been completed today
 */
async function getTodayCompletions(
  supabase: SupabaseClient,
  taskIds: string[],
  completionDate: string,
): Promise<Set<string>> {
  if (taskIds.length === 0) {
    return new Set();
  }

  const { data, error } = await supabase
    .from("slack_task_completions")
    .select("task_id")
    .in("task_id", taskIds)
    .eq("completion_date", completionDate);

  if (error) {
    console.error("[SLACK_SCHEDULER] Failed to query task completions", error);
    // Don't throw - better to send duplicate reminders than none
    return new Set();
  }

  return new Set((data || []).map((row) => row.task_id));
}

/**
 * Store reminder message timestamp for future updates
 *
 * Creates a completion record with message_ts but without completed_at.
 * This allows us to update the message when the task is marked complete.
 */
async function storeReminderMessage(
  supabase: SupabaseClient,
  taskId: string,
  completionDate: string,
  messageTs: string,
): Promise<void> {
  // Insert or update the reminder message timestamp
  // We'll use a "placeholder" completion record that gets updated when marked complete
  const { error } = await supabase.from("slack_task_completions").upsert(
    {
      task_id: taskId,
      completion_date: completionDate,
      message_ts: messageTs,
      completed_by_user_id: "system", // Placeholder - will be updated when user completes
      completed_by_username: null,
      completed_at: null, // Not completed yet
    },
    {
      onConflict: "task_id,completion_date",
    },
  );

  if (error) {
    console.error(
      "[SLACK_SCHEDULER] Failed to store reminder message_ts",
      error,
    );
    // Don't throw - message was sent successfully
  }
}
