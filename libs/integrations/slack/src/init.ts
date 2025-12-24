/**
 * Slack Client Initialization
 *
 * Sets up the token resolver for the Slack client.
 * Must be called before any Slack API operations.
 */

import { setTokenResolver, isTokenResolverInitialized } from "./client";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { decrypt } from "@odis-ai/shared/crypto";

/**
 * Initialize the Slack client with a token resolver that:
 * 1. Fetches encrypted bot tokens from the database
 * 2. Decrypts them using the crypto library
 *
 * Call this once at app startup or lazily on first Slack API call.
 */
export function initializeSlackClient(): void {
  // Skip if already initialized
  if (isTokenResolverInitialized()) {
    return;
  }

  setTokenResolver(async (teamId: string): Promise<string | null> => {
    try {
      const supabase = await createServiceClient();

      const { data, error } = await supabase
        .from("slack_workspaces")
        .select("bot_token")
        .eq("team_id", teamId)
        .eq("is_active", true)
        .single();

      if (error || !data?.bot_token) {
        console.error("[SLACK_INIT] Failed to fetch bot token", {
          teamId,
          error: error?.message,
        });
        return null;
      }

      // Decrypt the bot token (decrypt returns string directly)
      const decrypted = decrypt(Buffer.from(data.bot_token, "base64"), "slack");

      return decrypted;
    } catch (error) {
      console.error("[SLACK_INIT] Error resolving token", {
        teamId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  });
}

/**
 * Ensure the Slack client is initialized
 * Safe to call multiple times - only initializes once
 */
export function ensureSlackClientInitialized(): void {
  initializeSlackClient();
}
