/**
 * Delete Confirmation Modal Block
 *
 * Modal for confirming task deletion.
 */

import type { KnownBlock } from "@slack/types";
import type { SlackModalView } from "../types";

/**
 * Build the "Delete Task" confirmation modal
 *
 * Shows task details and confirms deletion.
 *
 * @param taskId - Task ID to delete
 * @param taskTitle - Task title to display
 * @returns Modal view definition
 */
export function buildDeleteConfirmModal(
  taskId: string,
  taskTitle: string,
): SlackModalView {
  const blocks: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Are you sure you want to delete the task:\n\n*${taskTitle}*\n\nThis action cannot be undone.`,
      },
    },
  ];

  return {
    type: "modal",
    callbackId: "delete_confirm_modal",
    privateMetadata: JSON.stringify({ taskId }),
    title: {
      type: "plain_text",
      text: "Delete Task",
    },
    submit: {
      type: "plain_text",
      text: "Delete",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    blocks,
  };
}
