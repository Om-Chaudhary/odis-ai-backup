/**
 * Help Message Block Builder
 *
 * Formats help text with command usage instructions.
 */

import type { KnownBlock } from "@slack/types";

/**
 * Build help message blocks
 *
 * @returns Slack Block Kit blocks for help message
 */
export function buildHelpMessage(): KnownBlock[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Checklist Bot Help",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Manage your daily clinic checklist with these commands:",
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Available Commands:*",
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: "`/checklist add`",
        },
        {
          type: "mrkdwn",
          text: "Add a new task to the checklist",
        },
        {
          type: "mrkdwn",
          text: "`/checklist list`",
        },
        {
          type: "mrkdwn",
          text: "View all configured tasks",
        },
        {
          type: "mrkdwn",
          text: "`/checklist status`",
        },
        {
          type: "mrkdwn",
          text: "Show today's completion status",
        },
        {
          type: "mrkdwn",
          text: "`/checklist delete`",
        },
        {
          type: "mrkdwn",
          text: "Remove a task from the checklist",
        },
        {
          type: "mrkdwn",
          text: "`/checklist help`",
        },
        {
          type: "mrkdwn",
          text: "Show this help message",
        },
      ],
    },
    {
      type: "divider",
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Tasks are sent to this channel at their scheduled time each morning. Team members can check them off as they're completed.",
        },
      ],
    },
  ];
}
