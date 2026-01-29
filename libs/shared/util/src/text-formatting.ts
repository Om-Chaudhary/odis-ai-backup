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
 * Extract caller name from transcript
 *
 * Looks for common patterns where callers introduce themselves:
 * - "My name is John Smith"
 * - "This is Jane Doe"
 * - "I'm Bob Johnson"
 * - Direct name followed by phone digits: "Dene Garamalo, 408-817"
 *
 * @param transcript - The call transcript text
 * @returns Extracted caller name or null if not found
 */
export function extractCallerNameFromTranscript(transcript: string | null): string | null {
  if (!transcript) return null;

  // Clean up the transcript - remove timestamps, AI/User labels, extra whitespace
  const cleanTranscript = transcript
    .replace(/^(AI|User|Assistant):\s*/gm, '')
    .replace(/\[\d+:\d+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Pattern 1: Name followed by phone number pattern (like "Dene Garamalo, 408-817") - HIGHEST PRIORITY
  let match = cleanTranscript.match(/([A-Za-z]+\s+[A-Za-z]+)[\.,]\s*[\d-]+/);
  if (match?.[1]) {
    const name = match[1].trim();
    if (isValidName(name)) {
      return formatName(name);
    }
  }

  // Pattern 2: "This is [Name]" (find all instances and filter out assistant names)
  const thisIsMatches = [...cleanTranscript.matchAll(/(?:yes[,.]?\s+)?this\s+is\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/gi)];
  for (const match of thisIsMatches) {
    if (match?.[1]) {
      const name = match[1].trim();
      // Skip common assistant names and validate
      if (!name.toLowerCase().includes('stacy') &&
          !name.toLowerCase().includes('assistant') &&
          !name.toLowerCase().includes('sorry') &&
          isValidName(name)) {
        return formatName(name);
      }
    }
  }

  // Pattern 3: "My name is [Name]" or "I'm [Name]"
  match = cleanTranscript.match(/(?:my\s+name\s+is|i'm)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
  if (match?.[1]) {
    const name = match[1].trim();
    if (!name.toLowerCase().includes('sorry') && isValidName(name)) {
      return formatName(name);
    }
  }

  return null;
}

/**
 * Extract pet name from transcript
 *
 * Looks for patterns where pet names are mentioned:
 * - "My dog [Pet Name]"
 * - "It's for [Pet Name]"
 * - "[Pet Name] and [Pet Name]" (multiple pets)
 *
 * @param transcript - The call transcript text
 * @returns Extracted pet name(s) or null if not found
 */
export function extractPetNameFromTranscript(transcript: string | null): string | null {
  if (!transcript) return null;

  // Clean up the transcript
  const cleanTranscript = transcript
    .replace(/^(AI|User|Assistant):\s*/gm, '')
    .replace(/\[\d+:\d+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Pattern 1: "My [animal] [Name]" or "My pet [Name]"
  let match = cleanTranscript.match(/my\s+(?:dog|cat|pet|puppy|kitten|animal)\s+([A-Za-z]+)/i);
  if (match?.[1]) {
    const petName = match[1].trim();
    if (isValidPetName(petName)) {
      return formatName(petName);
    }
  }

  // Pattern 2: Pet name in appointment context "for [Pet Name]" or "about [Pet Name]"
  match = cleanTranscript.match(/(?:for|about)\s+([A-Za-z]+)(?:\s+and\s+([A-Za-z]+))?/i);
  if (match?.[1]) {
    const petName = match[1].trim();
    if (isValidPetName(petName)) {
      const secondPet = match[2] ? ` and ${formatName(match[2].trim())}` : '';
      return formatName(petName) + secondPet;
    }
  }

  // Pattern 3: Multiple pets mentioned by name "Oscar and Felix [verb]"
  match = cleanTranscript.match(/([A-Za-z]+)\s+and\s+([A-Za-z]+)\s+(?:are|were|have|need|had)/i);
  if (match?.[1] && match?.[2]) {
    const pet1 = match[1].trim();
    const pet2 = match[2].trim();
    if (isValidPetName(pet1) && isValidPetName(pet2) && !isCommonWord(pet1) && !isCommonWord(pet2)) {
      return `${formatName(pet1)} and ${formatName(pet2)}`;
    }
  }

  // Pattern 4: "[Pet Name] is/has/needs"
  match = cleanTranscript.match(/([A-Za-z]+)\s+(?:is|has|needs)/i);
  if (match?.[1]) {
    const petName = match[1].trim();
    if (isValidPetName(petName) && !isCommonWord(petName)) {
      return formatName(petName);
    }
  }

  return null;
}

/**
 * Check if extracted text looks like a valid human name
 */
function isValidName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 50) return false;

  // Must contain only letters and spaces
  if (!/^[A-Za-z\s]+$/.test(name)) return false;

  // Filter out common false positives
  const lowercaseName = name.toLowerCase();
  const invalidNames = [
    'user', 'ai', 'assistant', 'hello', 'yes', 'no', 'ok', 'okay',
    'thank', 'thanks', 'please', 'sorry', 'excuse', 'um', 'uh',
    'calling', 'call', 'phone', 'number', 'clinic', 'hospital'
  ];

  return !invalidNames.some(invalid => lowercaseName.includes(invalid));
}

/**
 * Check if extracted text looks like a valid pet name
 */
function isValidPetName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 20) return false;

  // Must contain only letters
  if (!/^[A-Za-z]+$/.test(name)) return false;

  return !isCommonWord(name);
}

/**
 * Check if word is too common to be a pet name
 */
function isCommonWord(word: string): boolean {
  const lowercaseWord = word.toLowerCase();
  const commonWords = [
    'the', 'and', 'but', 'for', 'are', 'can', 'has', 'had', 'him', 'her',
    'his', 'she', 'they', 'them', 'this', 'that', 'have', 'will', 'been',
    'said', 'each', 'which', 'their', 'time', 'back', 'only', 'very', 'after',
    'first', 'well', 'year', 'work', 'such', 'make', 'even', 'more', 'most',
    'take', 'than', 'these', 'two', 'way', 'who', 'its', 'did', 'get', 'may',
    'new', 'now', 'old', 'see', 'come', 'could', 'made', 'over', 'think', 'also',
    'need', 'needs', 'want', 'wants', 'good', 'help', 'call', 'calling'
  ];

  return commonWords.includes(lowercaseWord);
}

/**
 * Format name with proper capitalization
 */
function formatName(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}


/**
 * Parse and format appointment date from various formats including natural language
 *
 * Handles:
 * - ISO format: "2025-01-29" -> "Jan 29"
 * - Natural language: "today", "tomorrow", "monday", "next friday"
 * - Fallback to native Date parsing
 *
 * @param dateStr - Date string in various formats
 * @param outputFormat - Date-fns format string (default: "MMM d")
 * @returns Formatted date string or original string if parsing fails
 */
export function parseAndFormatAppointmentDate(dateStr: string, outputFormat: string = "MMM d"): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return dateStr;
  }

  try {
    // Import date-fns functions dynamically to avoid circular deps
    const { format, parse } = require('date-fns');

    // First try parsing as ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const date = parse(dateStr, "yyyy-MM-dd", new Date());
      return format(date, outputFormat);
    }

    // Handle natural language dates that VAPI might output
    const normalized = dateStr.toLowerCase().trim();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Handle "today"
    if (normalized === "today") {
      return format(today, outputFormat);
    }

    // Handle "tomorrow"
    if (normalized === "tomorrow") {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return format(tomorrow, outputFormat);
    }

    // Handle day names like "monday", "tuesday", etc.
    const dayNames = [
      "sunday", "monday", "tuesday", "wednesday",
      "thursday", "friday", "saturday"
    ];

    // Handle "next monday", "this friday", etc.
    const nextDayMatch = /^(?:next|this)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i.exec(normalized);
    if (nextDayMatch?.[1]) {
      const targetDay = dayNames.indexOf(nextDayMatch[1].toLowerCase());
      const currentDay = today.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntil);
      return format(targetDate, outputFormat);
    }

    // Handle just day name like "monday", "tuesday"
    const justDayMatch = /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i.exec(normalized);
    if (justDayMatch?.[1]) {
      const targetDay = dayNames.indexOf(justDayMatch[1].toLowerCase());
      const currentDay = today.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntil);
      return format(targetDate, outputFormat);
    }

    // Try native Date parsing as fallback
    const fallbackDate = new Date(dateStr);
    if (!isNaN(fallbackDate.getTime())) {
      return format(fallbackDate, outputFormat);
    }

    // If all parsing fails, return original string
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Format attention action text with proper line breaks before arrows
 *
 * Adds line breaks before arrow symbols (→ or ->) to improve readability
 * when displaying action items in attention cards. The arrow stays on the
 * same line as the action text.
 *
 * @param actionText - The action text to format
 * @returns Formatted text with line breaks before arrows
 *
 * @example
 * formatAttentionAction("Owner requested callback → Schedule callback for owner")
 * // Returns: "Owner requested callback\n→ Schedule callback for owner"
 */
export function formatAttentionAction(actionText: string): string {
  if (!actionText) return actionText;

  // Add line break before arrow symbols (both → and -> variants)
  // Keep the arrow on the same line as the action text
  return actionText
    .replace(/\s*→\s*/g, '\n→ ')
    .replace(/\s*->\s*/g, '\n-> ')
    .trim();
}

