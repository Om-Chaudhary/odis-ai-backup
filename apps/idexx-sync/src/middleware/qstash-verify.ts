/**
 * QStash Signature Verification Middleware
 *
 * Verifies that incoming requests are from QStash using the signing key.
 * Protects sync endpoints from unauthorized access.
 *
 * @see https://upstash.com/docs/qstash/howto/signature
 */

import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Verify QStash signature middleware
 *
 * Validates the Upstash-Signature header using HMAC-SHA256.
 * In development mode (NODE_ENV=development), verification can be bypassed.
 */
export function verifyQStashSignature(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Allow bypass in development for testing
  if (
    process.env.NODE_ENV === "development" &&
    process.env.SKIP_QSTASH_VERIFY === "true"
  ) {
    console.log("[QSTASH] Skipping signature verification (development mode)");
    next();
    return;
  }

  const signature = req.headers["upstash-signature"] as string;

  if (!signature) {
    console.error("[QSTASH] Missing Upstash-Signature header");
    res.status(401).json({
      success: false,
      error: "Missing signature",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;

  if (!signingKey) {
    console.error("[QSTASH] QSTASH_CURRENT_SIGNING_KEY not configured");
    res.status(500).json({
      success: false,
      error: "Server configuration error",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const isValid = verifySignature(signature, signingKey);

    if (!isValid) {
      console.error("[QSTASH] Invalid signature");
      res.status(401).json({
        success: false,
        error: "Invalid signature",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.log("[QSTASH] Signature verified successfully");
    next();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[QSTASH] Signature verification error:", errorMessage);
    res.status(401).json({
      success: false,
      error: "Signature verification failed",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Verify the QStash signature using HMAC-SHA256
 *
 * The signature is a JWT-like format: base64url(header).base64url(payload).base64url(signature)
 * We verify using the HMAC-SHA256 algorithm.
 */
function verifySignature(signature: string, signingKey: string): boolean {
  try {
    // Parse the JWT-like signature
    const parts = signature.split(".");
    if (parts.length !== 3) {
      console.error("[QSTASH] Invalid signature format");
      return false;
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Validate parts exist
    if (!headerB64 || !payloadB64 || !signatureB64) {
      console.error("[QSTASH] Missing signature parts");
      return false;
    }

    // Decode and parse the payload
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as { exp?: number };

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.error("[QSTASH] Signature expired");
      return false;
    }

    // Verify the signature
    const signedContent = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac("sha256", signingKey)
      .update(signedContent)
      .digest("base64url");

    // Use timing-safe comparison
    const sigBuffer = Buffer.from(signatureB64);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (error) {
    console.error("[QSTASH] Error during signature verification:", error);
    return false;
  }
}

/**
 * Alternative: Use QStash SDK for verification (recommended for production)
 *
 * import { Receiver } from "@upstash/qstash";
 *
 * const receiver = new Receiver({
 *   currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
 *   nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
 * });
 *
 * export async function verifyQStashSignatureSDK(
 *   req: Request,
 *   res: Response,
 *   next: NextFunction
 * ): Promise<void> {
 *   const signature = req.headers["upstash-signature"] as string;
 *   const body = JSON.stringify(req.body);
 *
 *   const isValid = await receiver.verify({
 *     signature,
 *     body,
 *   });
 *
 *   if (!isValid) {
 *     res.status(401).json({ error: "Invalid signature" });
 *     return;
 *   }
 *
 *   next();
 * }
 */
