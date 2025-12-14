/**
 * @odis-ai/slack
 *
 * Slack integration library for the daily checklist bot.
 * Provides client, types, validators, and utilities for Slack interactions.
 */

// Client
export {
  slackClient,
  setTokenResolver,
  clearClientCache,
  isTokenResolverInitialized,
} from "./client";
export type { TokenResolver } from "./client";

// Initialization
export { initializeSlackClient, ensureSlackClientInitialized } from "./init";
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

// Commands
export { routeCommand } from "./commands";
export { handleAdd } from "./commands/add";
export { handleList } from "./commands/list";
export { handleStatus } from "./commands/status";
export { handleDelete } from "./commands/delete";
export { handleHelp } from "./commands/help";

// Blocks
export {
  buildReminderMessageBlocks,
  getReminderMessageText,
  buildAddTaskModal,
  buildDeleteConfirmModal,
} from "./blocks";
export type { ReminderMessageInput } from "./blocks";

// Legacy Block Builders (from commands)
export { buildHelpMessage } from "./blocks/help-message";
export { buildTaskList } from "./blocks/task-list";
export { buildStatusMessage } from "./blocks/status-message";

// Webhooks
export {
  handleInteraction,
  handleButtonAction,
  handleModalSubmit,
} from "./webhooks";
export type {
  InteractionHandlerResult,
  ButtonActionResult,
  ModalSubmitResult,
} from "./webhooks";

// Scheduler
export { sendDailyReminders } from "./scheduler";
export type { DailyTriggerResult } from "./scheduler";
