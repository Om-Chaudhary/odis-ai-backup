/**
 * Slack OAuth Installation
 *
 * Generates the Slack OAuth authorization URL for app installation.
 */

/**
 * Required bot scopes for the checklist bot
 */
export const SLACK_BOT_SCOPES = [
  "channels:read", // Read channel info
  "chat:write", // Post messages
  "commands", // Slash commands
  "users:read", // Get user info for completion attribution
] as const;

/**
 * Generate the Slack OAuth authorization URL
 *
 * @param state - Optional state parameter for CSRF protection
 * @returns The authorization URL to redirect users to
 */
export function generateInstallUrl(state?: string): string {
  const clientId = process.env.SLACK_CLIENT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!clientId) {
    throw new Error("SLACK_CLIENT_ID environment variable is not set");
  }

  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL environment variable is not set");
  }

  const redirectUri = `${siteUrl}/api/slack/oauth/callback`;
  const scopes = SLACK_BOT_SCOPES.join(",");

  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
  });

  if (state) {
    params.set("state", state);
  }

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

/**
 * Generate a random state token for CSRF protection
 */
export function generateStateToken(): string {
  return crypto.randomUUID();
}
