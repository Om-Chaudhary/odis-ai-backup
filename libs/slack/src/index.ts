/**
 * @odis-ai/slack
 *
 * Slack integration library for the daily checklist bot.
 * Provides client, types, validators, and utilities for Slack interactions.
 */

// Client
export { slackClient, setTokenResolver, clearClientCache } from "./client";
export type { TokenResolver } from "./client";
export type { ISlackClient } from "./slack-client.interface";

// Types
export type {
  // Workspace & Channel
  SlackWorkspace,
  SlackWorkspaceInsert,
  SlackReminderChannel,
  SlackReminderChannelInsert,
  // Tasks
  SlackTask,
  SlackTaskInsert,
  SlackTaskCompletion,
  SlackTaskCompletionInsert,
  // Slack API
  SlackMessageInput,
  SlackMessageResponse,
  SlackModalInput,
  SlackModalView,
  SlackChannelInfo,
  // Webhooks
  SlackSlashCommandPayload,
  SlackInteractionPayload,
  SlackBlockAction,
  SlackViewPayload,
  SlackInputValue,
  // Commands
  ChecklistCommand,
  CommandContext,
  CommandResponse,
} from "./types";

// Validators
export {
  slashCommandPayloadSchema,
  interactionPayloadSchema,
  addTaskInputSchema,
  oauthCallbackSchema,
  oauthAccessResponseSchema,
  parseTimeToDbFormat,
  formatTimeForDisplay,
} from "./validators";
export type {
  SlashCommandPayloadInput,
  InteractionPayloadInput,
  AddTaskInput,
  OAuthAccessResponse,
} from "./validators";

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
