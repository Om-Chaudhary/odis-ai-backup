/**
 * Slack Notification Formatters
 *
 * Registry of formatter functions that convert notification payloads
 * into Slack Block Kit format.
 */

import type { KnownBlock } from "@slack/types";
import type {
  SlackNotificationType,
  AppointmentBookedPayload,
  EmergencyTriagePayload,
  CallFailedPayload,
  SyncErrorPayload,
  AdminAlertPayload,
} from "./types";

/**
 * Formatter function type
 */
export type NotificationFormatter<T = unknown> = (data: T) => KnownBlock[];

/**
 * Format appointment booked notification
 */
function formatAppointmentBooked(data: AppointmentBookedPayload): KnownBlock[] {
  const fields: string[] = [
    `*Clinic:* ${data.clinicName}`,
    `*Client:* ${data.clientName}`,
    `*Pet:* ${data.petName}${data.species ? ` (${data.species}${data.breed ? ` - ${data.breed}` : ""})` : ""}`,
    `*Date:* ${data.date}`,
    `*Time:* ${data.time}`,
    `*Phone:* ${data.phone}`,
  ];

  if (data.reason) {
    fields.push(`*Reason:* ${data.reason}`);
  }

  if (data.isNewClient) {
    fields.push(`*New Client:* Yes :sparkles:`);
  }

  const blocks: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:calendar: *New Appointment Booked*`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: fields.join("\n"),
      },
    },
  ];

  if (data.bookingId) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `_Booking ID: ${data.bookingId}_`,
        },
      ],
    });
  }

  return blocks;
}

/**
 * Format emergency triage notification
 */
function formatEmergencyTriage(data: EmergencyTriagePayload): KnownBlock[] {
  const urgencyEmoji =
    data.urgency === "critical"
      ? ":rotating_light:"
      : data.urgency === "urgent"
        ? ":warning:"
        : ":large_orange_diamond:";

  const fields: string[] = [
    `*Clinic:* ${data.clinicName}`,
    `*Urgency:* ${data.urgency.toUpperCase()}`,
  ];

  if (data.petName) {
    fields.push(
      `*Pet:* ${data.petName}${data.species ? ` (${data.species})` : ""}`,
    );
  }

  if (data.symptoms) {
    fields.push(`*Symptoms:* ${data.symptoms}`);
  }

  if (data.action) {
    fields.push(`*Action:* ${data.action}`);
  }

  if (data.phone) {
    fields.push(`*Phone:* ${data.phone}`);
  }

  const blocks: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${urgencyEmoji} *EMERGENCY TRIAGE ALERT*`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: fields.join("\n"),
      },
    },
  ];

  if (data.callId) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `_Call ID: ${data.callId}_`,
        },
      ],
    });
  }

  return blocks;
}

/**
 * Format call failed notification
 */
function formatCallFailed(data: CallFailedPayload): KnownBlock[] {
  const fields: string[] = [`*Call ID:* ${data.callId}`];

  if (data.clinicName) {
    fields.push(`*Clinic:* ${data.clinicName}`);
  }

  if (data.phone) {
    fields.push(`*Phone:* ${data.phone}`);
  }

  fields.push(`*Error:* ${data.errorMessage}`);

  if (data.errorCode) {
    fields.push(`*Error Code:* ${data.errorCode}`);
  }

  if (data.retryCount !== undefined) {
    fields.push(`*Retry Count:* ${data.retryCount}`);
  }

  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:x: *Call Failed*`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: fields.join("\n"),
      },
    },
  ];
}

/**
 * Format sync error notification
 */
function formatSyncError(data: SyncErrorPayload): KnownBlock[] {
  const fields: string[] = [`*Service:* ${data.service}`];

  if (data.clinicName) {
    fields.push(`*Clinic:* ${data.clinicName}`);
  }

  fields.push(`*Error:* ${data.errorMessage}`);

  if (data.errorCode) {
    fields.push(`*Error Code:* ${data.errorCode}`);
  }

  if (data.timestamp) {
    fields.push(`*Time:* ${data.timestamp}`);
  }

  const blocks: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:warning: *Sync Failed*`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: fields.join("\n"),
      },
    },
  ];

  if (data.logsUrl) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${data.logsUrl}|View Logs →>`,
      },
    });
  }

  return blocks;
}

/**
 * Format admin alert notification
 */
function formatAdminAlert(data: AdminAlertPayload): KnownBlock[] {
  const severityEmoji =
    data.severity === "critical"
      ? ":rotating_light:"
      : data.severity === "error"
        ? ":x:"
        : data.severity === "warning"
          ? ":warning:"
          : ":information_source:";

  const blocks: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${severityEmoji} *${data.title}*`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: data.message,
      },
    },
  ];

  if (data.metadata && Object.keys(data.metadata).length > 0) {
    const metadataLines = Object.entries(data.metadata).map(
      ([key, value]) => `*${key}:* ${value}`,
    );
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: metadataLines.join(" | "),
        },
      ],
    });
  }

  return blocks;
}

/**
 * Registry of formatters for each notification type
 */
export const formatters: Record<
  SlackNotificationType,
  NotificationFormatter<unknown>
> = {
  appointment_booked: formatAppointmentBooked as NotificationFormatter<unknown>,
  emergency_triage: formatEmergencyTriage as NotificationFormatter<unknown>,
  call_failed: formatCallFailed as NotificationFormatter<unknown>,
  sync_error: formatSyncError as NotificationFormatter<unknown>,
  admin_alert: formatAdminAlert as NotificationFormatter<unknown>,
};

/**
 * Get formatter for a notification type
 */
export function getFormatter(
  type: SlackNotificationType,
): NotificationFormatter<unknown> {
  const formatter = formatters[type];
  if (!formatter) {
    throw new Error(`No formatter found for notification type: ${type}`);
  }
  return formatter;
}

/**
 * Format notification data into Slack blocks
 */
export function formatNotification(
  type: SlackNotificationType,
  data: unknown,
): KnownBlock[] {
  const formatter = getFormatter(type);
  return formatter(data);
}
