/**
 * Slack OAuth Callback Route
 *
 * Handles the OAuth callback from Slack after user authorization.
 * GET /api/slack/oauth/callback
 */

import { type NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@odis-ai/integrations/slack";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { encrypt } from "@odis-ai/shared/crypto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Verify CSRF state token
  const storedState = request.cookies.get("slack_oauth_state")?.value;

  if (!storedState || storedState !== state) {
    console.error("[SLACK_CALLBACK] State mismatch - possible CSRF attack", {
      hasStoredState: !!storedState,
      hasReceivedState: !!state,
    });

    const errorUrl = new URL("/slack/install-error", request.url);
    errorUrl.searchParams.set("error", "csrf_validation_failed");
    errorUrl.searchParams.set(
      "description",
      "Security validation failed. Please try again.",
    );
    return NextResponse.redirect(errorUrl);
  }

  // Handle error from Slack
  if (error) {
    console.error("[SLACK_CALLBACK] OAuth error from Slack", {
      error,
      errorDescription,
    });

    // Redirect to error page
    const errorUrl = new URL("/slack/install-error", request.url);
    errorUrl.searchParams.set("error", error);
    if (errorDescription) {
      errorUrl.searchParams.set("description", errorDescription);
    }
    return NextResponse.redirect(errorUrl);
  }

  // Validate code is present
  if (!code) {
    console.error("[SLACK_CALLBACK] Missing authorization code");

    const errorUrl = new URL("/slack/install-error", request.url);
    errorUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(errorUrl);
  }

  // Exchange code for token
  const result = await handleOAuthCallback(code);

  if (!result.success) {
    console.error("[SLACK_CALLBACK] Token exchange failed", {
      error: result.error,
      description: result.errorDescription,
    });

    const errorUrl = new URL("/slack/install-error", request.url);
    errorUrl.searchParams.set("error", result.error);
    if (result.errorDescription) {
      errorUrl.searchParams.set("description", result.errorDescription);
    }
    return NextResponse.redirect(errorUrl);
  }

  // Encrypt the bot token before storing
  const { encrypted: encryptedToken, keyId } = encrypt(
    result.workspace.botToken,
    "slack",
  );

  // Store workspace in database
  try {
    const supabase = await createServiceClient();

    const { error: dbError } = await supabase.from("slack_workspaces").upsert(
      {
        team_id: result.workspace.teamId,
        team_name: result.workspace.teamName,
        bot_token: encryptedToken.toString("base64"), // Store as base64
        bot_user_id: result.workspace.botUserId,
        app_id: result.workspace.appId,
        scope: result.workspace.scope,
        authed_user_id: result.workspace.authedUserId,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "team_id",
      },
    );

    if (dbError) {
      console.error("[SLACK_CALLBACK] Database error", {
        error: dbError.message,
        code: dbError.code,
      });

      const errorUrl = new URL("/slack/install-error", request.url);
      errorUrl.searchParams.set("error", "database_error");
      return NextResponse.redirect(errorUrl);
    }

    console.log("[SLACK_CALLBACK] Workspace installed successfully", {
      teamId: result.workspace.teamId,
      teamName: result.workspace.teamName,
      keyId,
    });

    // Redirect to success page
    const successUrl = new URL("/slack/install-success", request.url);
    successUrl.searchParams.set("team", result.workspace.teamName);
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("[SLACK_CALLBACK] Unexpected error", {
      error: error instanceof Error ? error.message : String(error),
    });

    const errorUrl = new URL("/slack/install-error", request.url);
    errorUrl.searchParams.set("error", "unexpected_error");
    return NextResponse.redirect(errorUrl);
  }
}
