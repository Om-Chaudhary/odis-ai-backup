/**
 * Slack OAuth Install Route
 *
 * Redirects users to Slack's OAuth authorization page.
 * GET /api/slack/oauth/install
 */

import { NextResponse } from "next/server";
import { generateInstallUrl, generateStateToken } from "@odis-ai/slack";

export async function GET() {
  try {
    // Generate state token for CSRF protection
    const state = generateStateToken();

    // TODO: Store state in session/cookie for verification in callback
    // For now, we'll skip state verification for simplicity

    const installUrl = generateInstallUrl(state);

    return NextResponse.redirect(installUrl);
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
