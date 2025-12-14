/**
 * Add Task Modal Block
 *
 * Modal for adding new tasks to the checklist.
 */

import type { KnownBlock } from "@slack/types";
import type { SlackModalView } from "../types";

/**
 * Build the "Add Task" modal view
 *
 * Collects task title, description, and reminder time.
 *
 * @param channelId - Channel ID to store in private metadata
 * @returns Modal view definition
 */
export function buildAddTaskModal(channelId: string): SlackModalView {
  const blocks: KnownBlock[] = [
    {
      type: "input",
      block_id: "task_title_block",
      element: {
        type: "plain_text_input",
        action_id: "task_title_input",
        placeholder: {
          type: "plain_text",
          text: "Enter task title",
        },
        max_length: 200,
      },
      label: {
        type: "plain_text",
        text: "Task Title",
      },
    },
    {
      type: "input",
      block_id: "task_description_block",
      element: {
        type: "plain_text_input",
        action_id: "task_description_input",
        placeholder: {
          type: "plain_text",
          text: "Enter task description (optional)",
        },
        multiline: true,
        max_length: 1000,
      },
      label: {
        type: "plain_text",
        text: "Description",
      },
      optional: true,
    },
    {
      type: "input",
      block_id: "task_time_block",
      element: {
        type: "plain_text_input",
        action_id: "task_time_input",
        placeholder: {
          type: "plain_text",
          text: "e.g., 9:00, 14:30, 3:00pm",
        },
      },
      label: {
        type: "plain_text",
        text: "Reminder Time",
      },
      hint: {
        type: "plain_text",
        text: "Use 24-hour format (HH:MM) or 12-hour with am/pm",
      },
    },
  ];

  return {
    type: "modal",
    callbackId: "add_task_modal",
    privateMetadata: JSON.stringify({ channelId }),
    title: {
      type: "plain_text",
      text: "Add New Task",
    },
    submit: {
      type: "plain_text",
      text: "Create",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    blocks,
  };
}
