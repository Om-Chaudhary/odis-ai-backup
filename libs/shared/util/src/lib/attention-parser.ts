/**
 * Utilities for parsing structured attention summaries
 *
 * Handles the format: "**[REASON] - [BRIEF CONTEXT]: [ACTION NEEDED]**"
 * with graceful fallback for unstructured legacy summaries.
 */

/**
 * Parsed attention summary components
 */
export interface ParsedAttentionSummary {
  /** The reason category (e.g., "MEDICATION", "FOLLOW-UP") */
  reason: string;
  /** Brief context about the situation */
  context: string;
  /** Action that needs to be taken */
  action: string;
  /** Original raw summary text */
  raw: string;
  /** Whether the summary follows the structured format */
  isStructured: boolean;
}

/**
 * Regular expression to match the structured attention summary format
 * Pattern: **[REASON] - [BRIEF CONTEXT]: [ACTION NEEDED]**
 *
 * Groups:
 * 1. REASON (captured between [ and ])
 * 2. BRIEF CONTEXT (captured between - and :)
 * 3. ACTION NEEDED (captured after : until **)
 */
const STRUCTURED_FORMAT_REGEX = /^\*\*\[([^\]]+)\]\s*-\s*([^:]+):\s*([^*]+)\*\*$/;

/**
 * Parse an attention summary string into structured components
 *
 * Supports both:
 * - New structured format: "**[REASON] - [BRIEF CONTEXT]: [ACTION NEEDED]**"
 * - Legacy unstructured format: any free-form text
 *
 * @param summary - The attention summary string to parse
 * @returns Parsed components or null if input is null/empty
 *
 * @example
 * ```typescript
 * // Structured format
 * const parsed = parseAttentionSummary("**[MEDICATION] - Pain management needed: Contact owner about Rimadyl dosage**");
 * // Returns:
 * // {
 * //   reason: "MEDICATION",
 * //   context: "Pain management needed",
 * //   action: "Contact owner about Rimadyl dosage",
 * //   raw: "**[MEDICATION] - Pain management needed: Contact owner about Rimadyl dosage**",
 * //   isStructured: true
 * // }
 *
 * // Legacy format
 * const legacy = parseAttentionSummary("Call owner about medication");
 * // Returns:
 * // {
 * //   reason: "ATTENTION",
 * //   context: "Attention needed",
 * //   action: "Call owner about medication",
 * //   raw: "Call owner about medication",
 * //   isStructured: false
 * // }
 * ```
 */
export function parseAttentionSummary(summary: string | null): ParsedAttentionSummary | null {
  // Handle null/empty input
  if (!summary || summary.trim() === '') {
    return null;
  }

  const trimmedSummary = summary.trim();

  // Try to match structured format
  const structuredMatch = trimmedSummary.match(STRUCTURED_FORMAT_REGEX);

  if (structuredMatch) {
    // Extract structured components
    const [, reason, context, action] = structuredMatch;

    return {
      reason: (reason ?? '').trim(),
      context: (context ?? '').trim(),
      action: (action ?? '').trim(),
      raw: trimmedSummary,
      isStructured: true,
    };
  }

  // Fallback for unstructured/legacy format
  return {
    reason: 'ATTENTION',
    context: 'Attention needed',
    action: trimmedSummary,
    raw: trimmedSummary,
    isStructured: false,
  };
}

/**
 * Check if an attention summary follows the structured format
 *
 * @param summary - The attention summary to check
 * @returns True if the summary follows the structured format
 *
 * @example
 * ```typescript
 * isStructuredFormat("**[FOLLOW-UP] - Recheck needed: Schedule appointment in 2 weeks**"); // true
 * isStructuredFormat("Call owner about results"); // false
 * ```
 */
export function isStructuredFormat(summary: string | null): boolean {
  if (!summary) {
    return false;
  }

  return STRUCTURED_FORMAT_REGEX.test(summary.trim());
}

/**
 * Map attention types to user-friendly titles
 * Aligned with production VAPI configuration
 */
const ATTENTION_TYPE_LABELS: Record<string, string> = {
  // Production VAPI types (7 total)
  medication_question: 'Medication Question',
  callback_request: 'Callback Request',
  appointment_needed: 'Appointment Needed',
  health_concern: 'Health Concern',
  emergency_signs: 'Emergency Signs',
  dissatisfaction: 'Owner Dissatisfaction',
  billing_question: 'Billing Question',

  // Backward compatibility (deprecated - remove after migration)
  owner_dissatisfaction: 'Owner Dissatisfaction',
};

/**
 * Get a user-friendly title from attention types array
 * Since structured output only outputs the highest priority issue, we take the first type
 *
 * @param attentionTypes - Array of attention types
 * @returns User-friendly title for the primary attention type
 *
 * @example
 * ```typescript
 * getAttentionTitle(['medication_question', 'callback_request']); // "Medication Question"
 * getAttentionTitle(['emergency_signs']); // "Emergency Signs"
 * getAttentionTitle([]); // "Attention Needed"
 * ```
 */
export function getAttentionTitle(attentionTypes: string[]): string {
  if (!attentionTypes || attentionTypes.length === 0) {
    return 'Attention Needed';
  }

  // Take the first (highest priority) attention type
  const primaryType = attentionTypes[0];
  if (!primaryType) {
    return 'Attention Needed';
  }
  return ATTENTION_TYPE_LABELS[primaryType] ?? 'Attention Needed';
}

/**
 * Extract just the reason from an attention summary
 *
 * @param summary - The attention summary to extract from
 * @returns The reason component or 'ATTENTION' for unstructured format
 *
 * @example
 * ```typescript
 * extractReason("**[MEDICATION] - Pain management needed: Contact owner**"); // "MEDICATION"
 * extractReason("Call owner about results"); // "ATTENTION"
 * ```
 */
export function extractReason(summary: string | null): string {
  const parsed = parseAttentionSummary(summary);
  return parsed?.reason ?? 'ATTENTION';
}

/**
 * Extract just the action from an attention summary
 *
 * @param summary - The attention summary to extract from
 * @returns The action component or the full summary for unstructured format
 *
 * @example
 * ```typescript
 * extractAction("**[MEDICATION] - Pain management needed: Contact owner about Rimadyl**"); // "Contact owner about Rimadyl"
 * extractAction("Call owner about results"); // "Call owner about results"
 * ```
 */
export function extractAction(summary: string | null): string {
  const parsed = parseAttentionSummary(summary);
  return parsed?.action ?? summary ?? '';
}