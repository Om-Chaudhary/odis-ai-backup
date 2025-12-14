/**
 * Slack OAuth Callback Handler
 *
 * Handles the OAuth callback from Slack and exchanges the code for tokens.
 */

import { WebClient } from "@slack/web-api";
import type { SlackWorkspaceInsert } from "../types";
import { oauthAccessResponseSchema } from "../validators";

export interface OAuthCallbackResult {
  success: true;
  workspace: SlackWorkspaceInsert;
}

export interface OAuthCallbackError {
  success: false;
  error: string;
  errorDescription?: string;
}

export type OAuthCallbackResponse = OAuthCallbackResult | OAuthCallbackError;

/**
 * Exchange OAuth code for access token and workspace info
 *
 * @param code - The authorization code from Slack
 * @returns Workspace data to store or error
 */
export async function handleOAuthCallback(
  code: string,
): Promise<OAuthCallbackResponse> {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!clientId || !clientSecret) {
    return {
      success: false,
      error: "configuration_error",
      errorDescription: "Slack OAuth credentials not configured",
    };
  }

  if (!siteUrl) {
    return {
      success: false,
      error: "configuration_error",
      errorDescription: "Site URL not configured",
    };
  }

  const redirectUri = `${siteUrl}/api/slack/oauth/callback`;

  try {
    // Exchange code for token using Slack Web API
    const client = new WebClient();
    const response = await client.oauth.v2.access({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    });

    // Validate response structure
    const parsed = oauthAccessResponseSchema.safeParse(response);
    if (!parsed.success) {
      console.error("[SLACK_OAUTH] Invalid response structure", {
        errors: parsed.error.errors,
      });
      return {
        success: false,
        error: "invalid_response",
        errorDescription: "Invalid response from Slack",
      };
    }

    const data = parsed.data;

    if (!data.ok) {
      return {
        success: false,
        error: data.error ?? "unknown_error",
        errorDescription: "Slack rejected the authorization",
      };
    }

    // Validate required fields
    if (
      !data.access_token ||
      !data.team?.id ||
      !data.team?.name ||
      !data.bot_user_id ||
      !data.app_id ||
      !data.scope
    ) {
      return {
        success: false,
        error: "missing_fields",
        errorDescription: "Missing required fields in Slack response",
      };
    }

    // Return workspace data (token will be encrypted by the API route)
    const workspace: SlackWorkspaceInsert = {
      teamId: data.team.id,
      teamName: data.team.name,
      botToken: data.access_token, // Will be encrypted before storage
      botUserId: data.bot_user_id,
      appId: data.app_id,
      scope: data.scope,
      authedUserId: data.authed_user?.id,
    };

    return {
      success: true,
      workspace,
    };
  } catch (error) {
    console.error("[SLACK_OAUTH] Token exchange failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: "exchange_failed",
      errorDescription:
        error instanceof Error ? error.message : "Token exchange failed",
    };
  }
}
