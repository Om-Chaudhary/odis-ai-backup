/**
 * Slack Client Implementation
 *
 * Wrapper around the Slack Web API SDK with workspace token management.
 */

import { WebClient } from "@slack/web-api";
import type { KnownBlock } from "@slack/types";
import type { ISlackClient } from "./slack-client.interface";
import type {
  SlackMessageInput,
  SlackMessageResponse,
  SlackModalInput,
  SlackChannelInfo,
} from "./types";

// Cache of WebClient instances per workspace
const clientCache = new Map<string, WebClient>();

// Singleton for env-based client
let envClient: WebClient | null = null;

/**
 * Token resolver function type
 * Used to fetch bot tokens from the database
 */
export type TokenResolver = (teamId: string) => Promise<string | null>;

let tokenResolver: TokenResolver | null = null;
let isInitialized = false;

/**
 * Set the token resolver function
 * This should be called once at app startup with a function that
 * fetches decrypted bot tokens from the database
 */
export function setTokenResolver(resolver: TokenResolver): void {
  tokenResolver = resolver;
  isInitialized = true;
}

/**
 * Check if the token resolver has been initialized
 */
export function isTokenResolverInitialized(): boolean {
  return isInitialized;
}

/**
 * Get a WebClient instance using the SLACK_BOT_TOKEN environment variable.
 * Use this for single-workspace setups (like ODIS team notifications).
 *
 * @returns WebClient instance or null if SLACK_BOT_TOKEN is not set
 */
export function getEnvSlackClient(): WebClient | null {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    return null;
  }

  envClient ??= new WebClient(token);

  return envClient;
}

/**
 * Check if environment-based Slack client is available
 */
export function isEnvSlackConfigured(): boolean {
  return !!process.env.SLACK_BOT_TOKEN;
}

/**
 * Get a WebClient instance for a workspace
 * Creates and caches clients per workspace
 */
async function getClient(teamId: string): Promise<WebClient> {
  // Check cache first
  const cached = clientCache.get(teamId);
  if (cached) {
    return cached;
  }

  // Resolve token
  if (!tokenResolver) {
    throw new Error(
      "Token resolver not set. Call setTokenResolver() at app startup.",
    );
  }

  const token = await tokenResolver(teamId);
  if (!token) {
    throw new Error(`No bot token found for workspace ${teamId}`);
  }

  // Create and cache client
  const client = new WebClient(token);
  clientCache.set(teamId, client);

  return client;
}

/**
 * Clear cached client for a workspace
 * Useful when tokens are rotated
 */
export function clearClientCache(teamId?: string): void {
  if (teamId) {
    clientCache.delete(teamId);
  } else {
    clientCache.clear();
    envClient = null;
  }
}

/**
 * Slack client implementation
 */
export const slackClient: ISlackClient = {
  async postMessage(
    teamId: string,
    input: SlackMessageInput,
  ): Promise<SlackMessageResponse> {
    const client = await getClient(teamId);

    try {
      const result = await client.chat.postMessage({
        channel: input.channel,
        blocks: input.blocks,
        text: input.text,
        thread_ts: input.threadTs,
      });

      return {
        ok: result.ok ?? false,
        ts: result.ts,
        channel: result.channel,
      };
    } catch (error) {
      console.error("[SLACK_CLIENT] Failed to post message", {
        teamId,
        channel: input.channel,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async updateMessage(
    teamId: string,
    channel: string,
    ts: string,
    blocks: KnownBlock[],
    text: string,
  ): Promise<SlackMessageResponse> {
    const client = await getClient(teamId);

    try {
      const result = await client.chat.update({
        channel,
        ts,
        blocks,
        text,
      });

      return {
        ok: result.ok ?? false,
        ts: result.ts,
        channel: result.channel,
      };
    } catch (error) {
      console.error("[SLACK_CLIENT] Failed to update message", {
        teamId,
        channel,
        ts,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async openModal(
    teamId: string,
    input: SlackModalInput,
  ): Promise<{ ok: boolean; error?: string }> {
    const client = await getClient(teamId);

    try {
      const result = await client.views.open({
        trigger_id: input.triggerId,
        view: {
          type: input.view.type,
          callback_id: input.view.callbackId,
          private_metadata: input.view.privateMetadata,
          title: input.view.title,
          submit: input.view.submit,
          close: input.view.close,
          blocks: input.view.blocks,
        },
      });

      return { ok: result.ok ?? false };
    } catch (error) {
      console.error("[SLACK_CLIENT] Failed to open modal", {
        teamId,
        triggerId: input.triggerId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async getChannelInfo(
    teamId: string,
    channelId: string,
  ): Promise<SlackChannelInfo | null> {
    const client = await getClient(teamId);

    try {
      const result = await client.conversations.info({
        channel: channelId,
      });

      if (!result.ok || !result.channel) {
        return null;
      }

      const channel = result.channel;
      return {
        id: channel.id ?? channelId,
        name: channel.name ?? "unknown",
        isChannel: channel.is_channel ?? false,
        isPrivate: channel.is_private ?? false,
      };
    } catch (error) {
      console.error("[SLACK_CLIENT] Failed to get channel info", {
        teamId,
        channelId,
        error: error instanceof Error ? error.message : String(error),
      });

      return null;
    }
  },

  async getUserInfo(
    teamId: string,
    userId: string,
  ): Promise<{ id: string; name: string; realName: string } | null> {
    const client = await getClient(teamId);

    try {
      const result = await client.users.info({
        user: userId,
      });

      if (!result.ok || !result.user) {
        return null;
      }

      const user = result.user;
      return {
        id: user.id ?? userId,
        name: user.name ?? "unknown",
        realName: user.real_name ?? user.name ?? "unknown",
      };
    } catch (error) {
      console.error("[SLACK_CLIENT] Failed to get user info", {
        teamId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      return null;
    }
  },
};
