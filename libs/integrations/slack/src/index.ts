/**
 * @odis-ai/slack
 *
 * Slack integration library for sending notifications.
 * Provides client, types, validators, and utilities for Slack interactions.
 */

// Client
export {
  slackClient,
  setTokenResolver,
  clearClientCache,
  isTokenResolverInitialized,
  getEnvSlackClient,
  isEnvSlackConfigured,
} from "./client";
export type { TokenResolver } from "./client";

// Notification Service
export {
  sendSlackNotification,
  notifySlack,
  formatNotification,
  formatters,
  getFormatter,
  NOTIFICATION_CHANNELS,
} from "./notifications";
export type {
  SlackNotificationType,
  NotificationPayloadMap,
  SendNotificationOptions,
  AppointmentBookedPayload,
  EmergencyTriagePayload,
  CallFailedPayload,
  SyncErrorPayload,
  AdminAlertPayload,
} from "./notifications";

// Initialization
export { initializeSlackClient, ensureSlackClientInitialized } from "./init";
export type { ISlackClient } from "./slack-client.interface";

// Types
export type {
  // Workspace & Channel
  SlackWorkspace,
  SlackWorkspaceInsert,
  // Slack API
  SlackMessageInput,
  SlackMessageResponse,
  SlackModalInput,
  SlackModalView,
  SlackChannelInfo,
} from "./types";

// Validators
export { oauthCallbackSchema, oauthAccessResponseSchema } from "./validators";
export type { OAuthAccessResponse } from "./validators";

// Signature verification
export {
  verifySlackSignature,
  verifySlackRequest,
  getSignatureHeaders,
} from "./signature";

// OAuth
export {
  generateInstallUrl,
  generateStateToken,
  SLACK_BOT_SCOPES,
  handleOAuthCallback,
} from "./oauth";
export type {
  OAuthCallbackResult,
  OAuthCallbackError,
  OAuthCallbackResponse,
} from "./oauth";
