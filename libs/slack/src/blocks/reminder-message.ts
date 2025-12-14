/**
 * Reminder Message Block
 *
 * Generates the task reminder message with "Mark Complete" button.
 */

import type { KnownBlock } from "@slack/types";
import { formatTimeForDisplay } from "../validators";
import type { SlackTask } from "../types";

export interface ReminderMessageInput {
  task: SlackTask;
  isCompleted?: boolean;
  completedBy?: string;
}

/**
 * Build blocks for a task reminder message
 *
 * Shows task details with a button to mark complete (or completion status if already done).
 *
 * @param input - Task and completion details
 * @returns Block Kit blocks for the message
 */
export function buildReminderMessageBlocks(
  input: ReminderMessageInput,
): KnownBlock[] {
  const { task, isCompleted, completedBy } = input;

  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: task.title,
        emoji: true,
      },
    },
  ];

  // Add description if present
  if (task.description) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: task.description,
      },
    });
  }

  // Add reminder time
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Scheduled for: *${formatTimeForDisplay(task.reminderTime)}*`,
      },
    ],
  });

  // Add completion status or button
  if (isCompleted && completedBy) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:white_check_mark: *Completed* by ${completedBy}`,
      },
    });
  } else {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Mark Complete",
            emoji: true,
          },
          style: "primary",
          action_id: `complete_task_${task.id}`,
          value: task.id,
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Delete Task",
            emoji: true,
          },
          style: "danger",
          action_id: `delete_task_${task.id}`,
          value: task.id,
          confirm: {
            title: {
              type: "plain_text",
              text: "Delete Task?",
            },
            text: {
              type: "mrkdwn",
              text: `Are you sure you want to delete "${task.title}"? This cannot be undone.`,
            },
            confirm: {
              type: "plain_text",
              text: "Delete",
            },
            deny: {
              type: "plain_text",
              text: "Cancel",
            },
          },
        },
      ],
    });
  }

  return blocks;
}

/**
 * Get fallback text for the reminder message
 * Used for notifications and accessibility
 */
export function getReminderMessageText(task: SlackTask): string {
  return `Reminder: ${task.title} (${formatTimeForDisplay(task.reminderTime)})`;
}
