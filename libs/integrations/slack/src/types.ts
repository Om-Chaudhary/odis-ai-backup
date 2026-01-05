/**
 * Slack Types
 *
 * Core type definitions for the Slack integration.
 */

import type { KnownBlock } from "@slack/types";

// ============================================================================
// Workspace Types
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
