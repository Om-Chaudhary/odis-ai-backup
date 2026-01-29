/**
 * Text formatting utilities for call summaries and other content
 *
 * @module text-formatting
 */

import React from "react";

/**
 * Parse text with **bold** markdown formatting and convert to React elements
 *
 * Converts text like "**CALL STATUS:** Completed" into JSX with bold formatting.
 * Handles multiple bold segments within the same text.
 *
 * @param text - The text to parse (may contain **bold** markers)
 * @returns Array of React elements with proper bold formatting
 */
export function parseMarkdownBold(text: string): (string | React.JSX.Element)[] {
  if (!text) return [];

  // Split text by **bold** patterns while keeping the delimiters
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    // Check if this part is a bold section (**text**)
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove the ** markers and wrap in strong tag
      const boldText = part.slice(2, -2);
      return React.createElement('strong', { key: index, className: 'font-semibold text-slate-900 dark:text-slate-100' }, boldText);
    }

    // Regular text part
    return part;
  }).filter(part => part !== ''); // Remove empty strings
}

/**
 * Convert call summary text with markdown bold formatting to React JSX
 *
 * This function is specifically designed for VAPI call summaries that use
 * **FIELD:** format for structured data display.
 *
 * @param summary - Call summary text with **bold** formatting
 * @returns JSX elements with proper formatting
 */
export function formatCallSummary(summary: string | null): React.ReactNode {
  if (!summary) return null;

  // Split by lines to preserve line breaks
  const lines = summary.split('\n');

  return lines.map((line, lineIndex) => {
    const parsedLine = parseMarkdownBold(line);

    // If line is empty, render as line break
    if (parsedLine.length === 0) {
      return React.createElement('br', { key: lineIndex });
    }

    // If line has content, wrap in a div for proper spacing
    return React.createElement(
      'div',
      { key: lineIndex, className: lineIndex > 0 ? 'mt-1' : undefined },
      ...parsedLine
    );
  });
}

/**
 * Simple text-only version of markdown bold parser for cases where JSX is not needed
 *
 * @param text - Text with **bold** markers
 * @returns Plain text with bold markers removed
 */
export function stripMarkdownBold(text: string): string {
  if (!text) return '';
  return text.replace(/\*\*([^*]+)\*\*/g, '$1');
}

/**
 * Parse attention summary into context and action parts
 *
 * Attempts to split attention summaries into situational context and required actions.
 * Handles various formats and provides fallback parsing.
 *
 * @param summary - The attention summary text to parse
 * @returns Object with context and action properties, or null if no summary
 */
export function parseAttentionSummary(summary: string | null): { context: string; action: string } | null {
  if (!summary) return null;

  // Try to split summary into context and action
  // Look for common patterns like "Context: ... Action: ..." or similar
  const contextMatch = summary.match(/(?:context|situation):\s*(.*?)(?:action|next steps?|required):/i);
  const actionMatch = summary.match(/(?:action|next steps?|required):\s*(.*?)$/i);

  if (contextMatch && actionMatch && contextMatch[1] && actionMatch[1]) {
    return {
      context: contextMatch[1].trim(),
      action: actionMatch[1].trim()
    };
  }

  // Fallback: split on common separators
  const parts = summary.split(/(?:\.\s*(?:Action|Next|Required|Please))|(?:\n\s*(?:Action|Next|Required|Please))/i);

  if (parts.length >= 2 && parts[0]) {
    return {
      context: parts[0].trim(),
      action: parts.slice(1).join(' ').trim()
    };
  }

  // If no clear split, treat entire summary as action
  return {
    context: "Attention needed",
    action: summary.trim()
  };
}

/**
 * Get user-friendly title from attention types
 *
 * Converts attention type codes into readable titles for the veterinary workflow.
 *
 * @param attentionTypes - Array of attention type strings
 * @returns User-friendly title for the attention type
 */
export function getAttentionTitle(attentionTypes: string[]): string {
  if (!attentionTypes || attentionTypes.length === 0) {
    return "Needs Attention";
  }

  const titleMap: Record<string, string> = {
    emergency_signs: "Emergency Signs Detected",
    medication_question: "Medication Question",
    callback_request: "Callback Requested",
    appointment_needed: "Appointment Required",
    health_concern: "Health Concern",
    dissatisfaction: "Client Dissatisfaction",
    owner_dissatisfaction: "Owner Dissatisfaction",
    billing_question: "Billing Question"
  };

  const primaryType = attentionTypes[0];
  if (!primaryType) {
    return "Needs Attention";
  }

  const title = titleMap[primaryType];

  if (title) {
    return title;
  }

  // Fallback: convert snake_case to title case
  return primaryType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}