/**
 * VAPI Tool Arguments Extraction
 *
 * Extracts tool arguments from various VAPI payload formats.
 * Handles both squad-based and single assistant calls.
 */

/**
 * Result of extracting tool arguments from a VAPI payload
 */
export interface ExtractedToolArgs {
  /** The extracted tool arguments */
  arguments: Record<string, unknown>;
  /** The VAPI tool call ID (required for proper response format) */
  toolCallId?: string;
  /** The VAPI call ID */
  callId?: string;
  /** The assistant ID that invoked the tool */
  assistantId?: string;
}

/**
 * Extract tool arguments from a VAPI request payload
 *
 * VAPI sends tool call data in several formats depending on the configuration:
 * 1. `message.toolCallList[].parameters` - Direct parameters
 * 2. `message.toolCallList[].function.arguments` - Function-style (string or object)
 * 3. `message.toolWithToolCallList[].toolCall.parameters` - With tool metadata
 * 4. `message.toolWithToolCallList[].toolCall.function.arguments` - Function-style with metadata
 * 5. Direct body parameters - Fallback for simple requests
 *
 * @param body - The raw request body from VAPI
 * @returns Extracted arguments with metadata
 *
 * @example
 * ```ts
 * const rawBody = await request.json();
 * const { arguments: toolArgs, toolCallId, callId, assistantId } =
 *   extractToolArguments(rawBody);
 * ```
 */
export function extractToolArguments(
  body: Record<string, unknown>,
): ExtractedToolArgs {
  const message = body.message as Record<string, unknown> | undefined;

  if (message) {
    // Extract call metadata
    const call = message.call as Record<string, unknown> | undefined;
    const callId = call?.id as string | undefined;
    const assistantId = call?.assistantId as string | undefined;

    // Format 1 & 2: toolCallList
    const toolCallList = message.toolCallList as
      | Array<{
          id?: string;
          parameters?: Record<string, unknown>;
          function?: {
            arguments?: string | Record<string, unknown>;
          };
        }>
      | undefined;

    if (toolCallList && toolCallList.length > 0) {
      const firstTool = toolCallList[0];

      // Try parameters first
      if (
        firstTool?.parameters &&
        Object.keys(firstTool.parameters).length > 0
      ) {
        return {
          arguments: firstTool.parameters,
          toolCallId: firstTool?.id,
          callId,
          assistantId,
        };
      }

      // Try function.arguments
      if (firstTool?.function?.arguments) {
        const args = firstTool.function.arguments;
        if (typeof args === "object" && args !== null) {
          return {
            arguments: args,
            toolCallId: firstTool?.id,
            callId,
            assistantId,
          };
        }
        if (typeof args === "string") {
          try {
            const parsedArgs = JSON.parse(args) as Record<string, unknown>;
            return {
              arguments: parsedArgs,
              toolCallId: firstTool?.id,
              callId,
              assistantId,
            };
          } catch {
            // Continue to fallback
          }
        }
      }

      // Return empty parameters with metadata
      return {
        arguments: firstTool?.parameters ?? {},
        toolCallId: firstTool?.id,
        callId,
        assistantId,
      };
    }

    // Format 3 & 4: toolWithToolCallList
    const toolWithToolCallList = message.toolWithToolCallList as
      | Array<{
          toolCall?: {
            id?: string;
            parameters?: Record<string, unknown>;
            function?: {
              arguments?: string | Record<string, unknown>;
            };
          };
        }>
      | undefined;

    if (toolWithToolCallList && toolWithToolCallList.length > 0) {
      const firstTool = toolWithToolCallList[0]?.toolCall;

      // Try parameters first
      if (
        firstTool?.parameters &&
        Object.keys(firstTool.parameters).length > 0
      ) {
        return {
          arguments: firstTool.parameters,
          toolCallId: firstTool?.id,
          callId,
          assistantId,
        };
      }

      // Try function.arguments
      if (firstTool?.function?.arguments) {
        const args = firstTool.function.arguments;
        if (typeof args === "object" && args !== null) {
          return {
            arguments: args,
            toolCallId: firstTool?.id,
            callId,
            assistantId,
          };
        }
        if (typeof args === "string") {
          try {
            const parsedArgs = JSON.parse(args) as Record<string, unknown>;
            return {
              arguments: parsedArgs,
              toolCallId: firstTool?.id,
              callId,
              assistantId,
            };
          } catch {
            // Continue to fallback
          }
        }
      }

      // Return empty parameters with metadata
      return {
        arguments: firstTool?.parameters ?? {},
        toolCallId: firstTool?.id,
        callId,
        assistantId,
      };
    }
  }

  // Format 5: Direct body parameters (fallback)
  return { arguments: body };
}
