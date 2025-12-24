/**
 * Status Message Block Builder
 *
 * Formats daily completion status with task checkboxes.
 */

import type { KnownBlock } from "@slack/types";
import type { SlackTask, SlackTaskCompletion } from "../types";
import { formatTimeForDisplay } from "../validators";

/**
 * Task with optional completion info
 */
interface TaskWithCompletion extends SlackTask {
  completion?: SlackTaskCompletion;
}

/**
 * Build status message blocks
 *
 * @param tasks - Array of tasks with completion status
 * @param channelName - Channel name for header
 * @returns Slack Block Kit blocks for status message
 */
export function buildStatusMessage(
  tasks: TaskWithCompletion[],
  channelName: string,
): KnownBlock[] {
  const completed = tasks.filter((t) => t.completion).length;
  const total = tasks.length;
  const percentage = Math.round((completed / total) * 100);

  // Determine status emoji and color
  let statusEmoji = ":hourglass_flowing_sand:";
  let statusText = "In Progress";

  if (completed === total) {
    statusEmoji = ":white_check_mark:";
    statusText = "All Complete!";
  } else if (completed === 0) {
    statusEmoji = ":clipboard:";
    statusText = "Not Started";
  }

  // Get today's date in readable format
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${statusEmoji} Daily Checklist - ${today}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${statusText}* • ${completed} of ${total} tasks completed (${percentage}%)`,
      },
    },
    {
      type: "divider",
    },
  ];

  // Add each task with completion status
  tasks.forEach((task) => {
    const isCompleted = !!task.completion;
    const checkbox = isCompleted ? ":white_check_mark:" : ":white_square:";
    const displayTime = formatTimeForDisplay(task.reminderTime);

    let text = `${checkbox} *${task.title}*\n:clock3: ${displayTime}`;

    if (task.description) {
      text += `\n${task.description}`;
    }

    if (isCompleted && task.completion) {
      const completedBy = task.completion.completedByUsername ?? "Someone";
      const completedTime = new Date(
        task.completion.completedAt,
      ).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      text += `\n_Completed by ${completedBy} at ${completedTime}_`;
    }

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text,
      },
    });
  });

  // Add footer context
  blocks.push(
    {
      type: "divider",
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Channel: #${channelName} • Use \`/checklist list\` to view all tasks`,
        },
      ],
    },
  );

  return blocks;
}
