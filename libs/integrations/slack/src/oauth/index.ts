/**
 * Slack OAuth Module
 *
 * Exports for OAuth installation and callback handling.
 */

export {
  generateInstallUrl,
  generateStateToken,
  SLACK_BOT_SCOPES,
} from "./install";

export {
  handleOAuthCallback,
  type OAuthCallbackResult,
  type OAuthCallbackError,
  type OAuthCallbackResponse,
} from "./callback";
