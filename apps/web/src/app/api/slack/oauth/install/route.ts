/**
 * Slack OAuth Install Route
 *
 * Redirects users to Slack's OAuth authorization page.
 * GET /api/slack/oauth/install
 */

import { NextResponse } from "next/server";
import {
  generateInstallUrl,
  generateStateToken,
} from "@odis-ai/integrations/slack";

export async function GET() {
  try {
    // Generate state token for CSRF protection
    const state = generateStateToken();

    const installUrl = generateInstallUrl(state);
    const response = NextResponse.redirect(installUrl);

    // Store state in HTTP-only cookie for verification in callback
    response.cookies.set("slack_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/api/slack/oauth",
    });

    return response;
  } catch (error) {
    console.error("[SLACK_INSTALL] Failed to generate install URL", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "configuration_error",
        message: "Slack OAuth is not properly configured",
      },
      { status: 500 },
    );
  }
}
