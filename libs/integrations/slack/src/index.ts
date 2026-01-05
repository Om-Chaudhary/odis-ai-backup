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
