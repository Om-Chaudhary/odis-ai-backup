/**
 * ISlackClient Interface
 *
 * Interface for Slack API operations using the Slack Web API.
 * Enables dependency injection and testing for Slack operations.
 */

import type {
  SlackMessageInput,
  SlackMessageResponse,
  SlackModalInput,
  SlackChannelInfo,
} from "./types";
import type { KnownBlock } from "@slack/types";

/**
 * Interface for Slack client operations
 */
export interface ISlackClient {
  /**
   * Post a message to a Slack channel
   *
   * @param teamId - Slack workspace team ID
   * @param input - Message input with channel, blocks, and text
   * @returns Message response with timestamp for tracking
   */
  postMessage(
    teamId: string,
    input: SlackMessageInput,
  ): Promise<SlackMessageResponse>;

  /**
   * Update an existing message
   *
   * @param teamId - Slack workspace team ID
   * @param channel - Channel ID
   * @param ts - Message timestamp to update
   * @param blocks - New blocks for the message
   * @param text - Fallback text
   */
  updateMessage(
    teamId: string,
    channel: string,
    ts: string,
    blocks: KnownBlock[],
    text: string,
  ): Promise<SlackMessageResponse>;

  /**
   * Open a modal dialog
   *
   * @param teamId - Slack workspace team ID
   * @param input - Modal configuration
   */
  openModal(
    teamId: string,
    input: SlackModalInput,
  ): Promise<{ ok: boolean; error?: string }>;

  /**
   * Get channel information
   *
   * @param teamId - Slack workspace team ID
   * @param channelId - Channel ID to lookup
   */
  getChannelInfo(
    teamId: string,
    channelId: string,
  ): Promise<SlackChannelInfo | null>;

  /**
   * Get user information
   *
   * @param teamId - Slack workspace team ID
   * @param userId - User ID to lookup
   */
  getUserInfo(
    teamId: string,
    userId: string,
  ): Promise<{ id: string; name: string; realName: string } | null>;
}
