import type { ChatResponse } from "llamaindex";

/**
 * Extract text content from a LlamaIndex ChatResponse
 *
 * Handles both string and array response formats from LlamaIndex.
 * For array formats, finds the first text content item.
 *
 * @param response - LlamaIndex ChatResponse
 * @returns Extracted text content as string
 * @throws Error if no text content can be found
 */
export function extractTextFromResponse(response: ChatResponse): string {
  const content = response.message.content;

  // Handle string format (most common)
  if (typeof content === "string") {
    return content;
  }

  // Handle array format (multi-modal responses)
  if (Array.isArray(content)) {
    const textContent = content.find(
      (item): item is { type: "text"; text: string } =>
        typeof item === "object" &&
        item !== null &&
        "type" in item &&
        item.type === "text" &&
        "text" in item &&
        typeof (item as { text: unknown }).text === "string",
    );

    if (!textContent) {
      throw new Error(
        "Unexpected LlamaIndex response format: no text content found in array",
      );
    }

    return textContent.text;
  }

  throw new Error(
    "Unexpected LlamaIndex response format: content is neither string nor array",
  );
}

/**
 * Type guard to check if an error has an API error cause with status code
 */
function isApiErrorWithCause(
  error: unknown,
): error is { cause: { status: number; message: string } } {
  return (
    error !== null &&
    typeof error === "object" &&
    "cause" in error &&
    error.cause !== null &&
    typeof error.cause === "object" &&
    "status" in error.cause &&
    "message" in error.cause &&
    typeof (error.cause as { status: unknown }).status === "number" &&
    typeof (error.cause as { message: unknown }).message === "string"
  );
}

/**
 * Extract HTTP status code from an error
 *
 * Checks error.cause first (most reliable), then falls back to
 * parsing error messages for status codes in parentheses.
 *
 * @param error - Error object to extract status from
 * @returns HTTP status code (100-599) or null if not found/invalid
 */
export function extractApiErrorStatus(error: unknown): number | null {
  // Check error.cause first (most reliable - LlamaIndex wraps Anthropic errors)
  if (isApiErrorWithCause(error)) {
    const status = error.cause.status;
    // Validate it's a real HTTP status code
    if (status >= 100 && status < 600) {
      return status;
    }
  }

  // Fallback: extract from error message
  if (error instanceof Error) {
    // Match patterns like "API error (429)" or "error (500)"
    const statusMatch = /(?:API\s+)?error\s*\((\d{3})\)/i.exec(error.message);
    if (statusMatch?.[1]) {
      const parsed = parseInt(statusMatch[1] || "0", 10);
      // Validate it's a real HTTP status code
      if (parsed >= 100 && parsed < 600) {
        return parsed;
      }
    }
  }

  return null;
}

/**
 * Check if an error is a retryable API error
 *
 * Retryable errors are: 429 (rate limit), 500 (server error), 503 (service unavailable)
 *
 * @param error - Error to check
 * @returns true if the error is retryable, false otherwise
 */
export function isRetryableApiError(error: unknown): boolean {
  const statusCode = extractApiErrorStatus(error);
  if (statusCode === null) {
    return false;
  }

  return statusCode === 429 || statusCode === 500 || statusCode === 503;
}
