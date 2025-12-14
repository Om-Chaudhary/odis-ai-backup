/**
 * Slack Types
 *
 * Core type definitions for the Slack checklist bot.
 */

import type { KnownBlock } from "@slack/types";

// ============================================================================
// Workspace & Channel Types
// ============================================================================

export interface SlackWorkspace {
  id: string;
  teamId: string;
  teamName: string;
  botToken: string;
  botUserId: string;
  appId: string;
  scope: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlackWorkspaceInsert {
  teamId: string;
  teamName: string;
  botToken: string;
  botUserId: string;
  appId: string;
  scope: string;
  authedUserId?: string;
}

export interface SlackReminderChannel {
  id: string;
  workspaceId: string;
  channelId: string;
  channelName: string;
  reminderTime: string; // TIME as string "HH:MM:SS"
  timezone: string;
  isActive: boolean;
  addedByUserId: string;
  createdAt: Date;
}

export interface SlackReminderChannelInsert {
  workspaceId: string;
  channelId: string;
  channelName: string;
  reminderTime?: string;
  timezone?: string;
  addedByUserId: string;
}

// ============================================================================
// Task Types
// ============================================================================

export interface SlackTask {
  id: string;
  channelId: string;
  title: string;
  description: string | null;
  reminderTime: string; // TIME as string "HH:MM:SS"
  isActive: boolean;
  createdByUserId: string;
  createdAt: Date;
}

export interface SlackTaskInsert {
  channelId: string;
  title: string;
  description?: string;
  reminderTime: string;
  createdByUserId: string;
}

export interface SlackTaskCompletion {
  id: string;
  taskId: string;
  completionDate: string; // DATE as string "YYYY-MM-DD"
  completedByUserId: string;
  completedByUsername: string | null;
  completedAt: Date;
  messageTs: string | null;
}

export interface SlackTaskCompletionInsert {
  taskId: string;
  completionDate: string;
  completedByUserId: string;
  completedByUsername?: string;
  messageTs?: string;
}

// ============================================================================
// Slack API Types
// ============================================================================

export interface SlackMessageInput {
  channel: string;
  blocks?: KnownBlock[];
  text: string; // Fallback text for notifications
  threadTs?: string;
}

export interface SlackMessageResponse {
  ok: boolean;
  ts?: string; // Message timestamp
  channel?: string;
  error?: string;
}

export interface SlackModalInput {
  triggerId: string;
  view: SlackModalView;
}

export interface SlackModalView {
  type: "modal";
  callbackId: string;
  privateMetadata?: string;
  title: { type: "plain_text"; text: string };
  submit?: { type: "plain_text"; text: string };
  close?: { type: "plain_text"; text: string };
  blocks: KnownBlock[];
}

export interface SlackChannelInfo {
  id: string;
  name: string;
  isChannel: boolean;
  isPrivate: boolean;
}

// ============================================================================
// Webhook Payload Types
// ============================================================================

export interface SlackSlashCommandPayload {
  command: string;
  text: string;
  responseUrl: string;
  triggerId: string;
  userId: string;
  userName: string;
  teamId: string;
  teamDomain: string;
  channelId: string;
  channelName: string;
}

export interface SlackInteractionPayload {
  type: "block_actions" | "view_submission" | "view_closed";
  user: {
    id: string;
    username: string;
    name: string;
    teamId: string;
  };
  team: {
    id: string;
    domain: string;
  };
  channel?: {
    id: string;
    name: string;
  };
  triggerId: string;
  responseUrl?: string;
  actions?: SlackBlockAction[];
  view?: SlackViewPayload;
  message?: {
    ts: string;
    blocks: KnownBlock[];
  };
}

export interface SlackBlockAction {
  type: string;
  actionId: string;
  blockId: string;
  value?: string;
  selectedOption?: { value: string };
}

export interface SlackViewPayload {
  id: string;
  callbackId: string;
  privateMetadata: string;
  state: {
    values: Record<string, Record<string, SlackInputValue>>;
  };
}

export interface SlackInputValue {
  type: string;
  value?: string;
  selectedOption?: { value: string };
}

// ============================================================================
// Command Types
// ============================================================================

export type ChecklistCommand = "add" | "list" | "status" | "delete" | "help";

export interface CommandContext {
  teamId: string;
  channelId: string;
  channelName: string;
  userId: string;
  userName: string;
  triggerId: string;
  responseUrl: string;
}

export interface CommandResponse {
  responseType?: "in_channel" | "ephemeral";
  text?: string;
  blocks?: KnownBlock[];
}
