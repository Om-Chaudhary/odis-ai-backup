/**
 * Slack Request Signature Verification
 *
 * Verifies that incoming requests are from Slack using HMAC-SHA256.
 * @see https://api.slack.com/authentication/verifying-requests-from-slack
 */

import crypto from "crypto";

/**
 * Verify a Slack request signature
 *
 * @param body - Raw request body as string
 * @param timestamp - X-Slack-Request-Timestamp header
 * @param signature - X-Slack-Signature header
 * @returns true if signature is valid
 */
export function verifySlackSignature(
  body: string,
  timestamp: string,
  signature: string,
): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    console.error("[SLACK_SIGNATURE] SLACK_SIGNING_SECRET not configured");
    return false;
  }

  // Check timestamp to prevent replay attacks (2 minute window for tighter security)
  const timestampSeconds = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampSeconds) > 120) {
    console.warn("[SLACK_SIGNATURE] Request timestamp too old", {
      requestTime: timestampSeconds,
      serverTime: now,
      diff: Math.abs(now - timestampSeconds),
    });
    return false;
  }

  // Create the signature base string
  const sigBaseString = `v0:${timestamp}:${body}`;

  // Compute HMAC-SHA256
  const hmac = crypto.createHmac("sha256", signingSecret);
  hmac.update(sigBaseString);
  const computedSignature = `v0=${hmac.digest("hex")}`;

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature),
    );
  } catch {
    // Buffers have different lengths
    return false;
  }
}

/**
 * Extract signature headers from a Request object
 */
export function getSignatureHeaders(headers: Headers): {
  timestamp: string;
  signature: string;
} {
  return {
    timestamp: headers.get("x-slack-request-timestamp") ?? "",
    signature: headers.get("x-slack-signature") ?? "",
  };
}

/**
 * Verify a Next.js request from Slack
 *
 * @param body - Raw request body
 * @param headers - Request headers
 * @returns true if request is from Slack
 */
export function verifySlackRequest(body: string, headers: Headers): boolean {
  const { timestamp, signature } = getSignatureHeaders(headers);

  if (!timestamp || !signature) {
    console.warn("[SLACK_SIGNATURE] Missing signature headers");
    return false;
  }

  return verifySlackSignature(body, timestamp, signature);
}
