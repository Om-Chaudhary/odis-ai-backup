/**
 * Task List Block Builder
 *
 * Formats task list for display.
 */

import type { KnownBlock } from "@slack/types";
import type { SlackTask } from "../types";
import { formatTimeForDisplay } from "../validators";

/**
 * Build task list blocks
 *
 * @param tasks - Array of tasks to display
 * @param channelName - Channel name for header
 * @returns Slack Block Kit blocks for task list
 */
export function buildTaskList(
  tasks: SlackTask[],
  channelName: string,
): KnownBlock[] {
  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Checklist Tasks for #${channelName}`,
        emoji: true,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${tasks.length} task${tasks.length === 1 ? "" : "s"} configured`,
        },
      ],
    },
    {
      type: "divider",
    },
  ];

  // Add each task
  tasks.forEach((task, index) => {
    const displayTime = formatTimeForDisplay(task.reminderTime);

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${index + 1}. ${task.title}*\n:clock3: ${displayTime}${
          task.description ? `\n${task.description}` : ""
        }`,
      },
    });
  });

  return blocks;
}
