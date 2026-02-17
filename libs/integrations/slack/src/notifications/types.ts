/**
 * Slack Notification Types
 *
 * Type definitions for notification payloads.
 */

/**
 * Notification types supported by the generic notification service
 */
export type SlackNotificationType =
  | "appointment_booked"
  | "emergency_triage"
  | "call_failed"
  | "sync_error"
  | "admin_alert";

/**
 * Channel mapping for notification routing
 */
export const NOTIFICATION_CHANNELS: Record<SlackNotificationType, string> = {
  appointment_booked: process.env.SLACK_CHANNEL_APPOINTMENTS ?? "appointments",
  emergency_triage: process.env.SLACK_CHANNEL_EMERGENCIES ?? "emergencies",
  call_failed: process.env.SLACK_CHANNEL_SYSTEM ?? "system-alerts",
  sync_error: process.env.SLACK_CHANNEL_SYSTEM ?? "system-alerts",
  admin_alert: process.env.SLACK_CHANNEL_SYSTEM ?? "system-alerts",
};

/**
 * Payload for appointment booked notifications
 */
export interface AppointmentBookedPayload {
  clinicName: string;
  clientName: string;
  petName: string;
  date: string;
  time: string;
  phone: string;
  reason?: string;
  species?: string;
  breed?: string;
  isNewClient?: boolean;
  bookingId?: string;
}

/**
 * Payload for emergency triage notifications
 */
export interface EmergencyTriagePayload {
  clinicName: string;
  urgency: "critical" | "urgent" | "moderate";
  petName?: string;
  species?: string;
  symptoms?: string;
  action?: string;
  phone?: string;
  callId?: string;
}

/**
 * Payload for call failed notifications
 */
export interface CallFailedPayload {
  clinicName?: string;
  callId: string;
  errorMessage: string;
  errorCode?: string;
  phone?: string;
  retryCount?: number;
}

/**
 * Payload for sync error notifications
 */
export interface SyncErrorPayload {
  service: string;
  clinicName?: string;
  errorMessage: string;
  errorCode?: string;
  timestamp?: string;
  logsUrl?: string;
}

/**
 * Payload for admin alert notifications
 */
export interface AdminAlertPayload {
  title: string;
  message: string;
  severity?: "info" | "warning" | "error" | "critical";
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Map notification types to their payload types
 */
export interface NotificationPayloadMap {
  appointment_booked: AppointmentBookedPayload;
  emergency_triage: EmergencyTriagePayload;
  call_failed: CallFailedPayload;
  sync_error: SyncErrorPayload;
  admin_alert: AdminAlertPayload;
}

/**
 * Options for sending notifications
 */
export interface SendNotificationOptions {
  /** Override the default channel for this notification type */
  channel?: string;
  /** Thread timestamp to reply to an existing message */
  threadTs?: string;
}
