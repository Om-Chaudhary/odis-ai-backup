/**
 * Text formatting utilities for call summaries and other content
 *
 * @module text-formatting
 */

import React from "react";
import { format, parse } from "date-fns";

/**
 * Parse text with **bold** markdown formatting and convert to React elements
 *
 * Converts text like "**CALL STATUS:** Completed" into JSX with bold formatting.
 * Handles multiple bold segments within the same text.
 *
 * @param text - The text to parse (may contain **bold** markers)
 * @returns Array of React elements with proper bold formatting
 */
export function parseMarkdownBold(
  text: string,
): (string | React.JSX.Element)[] {
  if (!text) return [];

  // Split text by **bold** patterns while keeping the delimiters
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts
    .map((part, index) => {
      // Check if this part is a bold section (**text**)
      if (part.startsWith("**") && part.endsWith("**")) {
        // Remove the ** markers and wrap in strong tag
        const boldText = part.slice(2, -2);
        return React.createElement(
          "strong",
          {
            key: index,
            className: "font-semibold text-slate-900 dark:text-slate-100",
          },
          boldText,
        );
      }

      // Regular text part
      return part;
    })
    .filter((part) => part !== ""); // Remove empty strings
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
  const lines = summary.split("\n");

  return lines.map((line, lineIndex) => {
    const parsedLine = parseMarkdownBold(line);

    // If line is empty, render as line break
    if (parsedLine.length === 0) {
      return React.createElement("br", { key: lineIndex });
    }

    // If line has content, wrap in a div for proper spacing
    return React.createElement(
      "div",
      { key: lineIndex, className: lineIndex > 0 ? "mt-1" : undefined },
      ...parsedLine,
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
  if (!text) return "";
  return text.replace(/\*\*([^*]+)\*\*/g, "$1");
}

/**
 * Parsed transcript line with speaker role information
 */
interface TranscriptLine {
  speaker: "user" | "assistant" | "unknown";
  text: string;
  lineNumber: number;
}

/**
 * Extraction result with confidence and source metadata
 *
 * Used for tracking extraction quality and debugging false positives.
 */
export interface ExtractionResult {
  /** Extracted value (or null if not found) */
  value: string | null;
  /** Confidence level based on pattern used */
  confidence: "high" | "medium" | "low";
  /** Which pattern matched */
  source: "pattern1" | "pattern2" | "pattern3" | "pattern4" | "none";
  /** Surrounding text for debugging (optional) */
  context?: string;
}

/**
 * Parse transcript into speaker-labeled lines
 *
 * Identifies which lines are from the user/caller vs the AI assistant.
 * This prevents extracting assistant names (Nancy, Stacy) as caller names.
 *
 * @param transcript - Raw transcript text with speaker labels
 * @returns Array of parsed lines with speaker role information
 */
function parseTranscriptByRole(transcript: string): TranscriptLine[] {
  const lines = transcript.split(/\n/);
  return lines.map((line, index) => {
    if (/^(User|Caller):\s*/i.test(line)) {
      return {
        speaker: "user",
        text: line.replace(/^(User|Caller):\s*/i, ""),
        lineNumber: index,
      };
    } else if (/^(AI|Assistant|Nancy|Stacy):\s*/i.test(line)) {
      return {
        speaker: "assistant",
        text: line.replace(/^(AI|Assistant|Nancy|Stacy):\s*/i, ""),
        lineNumber: index,
      };
    }
    return { speaker: "unknown", text: line, lineNumber: index };
  });
}

/**
 * Extract patterns only from user speech, skipping greetings
 *
 * Only processes lines spoken by the user/caller, not the AI assistant.
 * Skips the first 20% of user lines to avoid greeting pleasantries.
 *
 * @param transcript - Raw transcript text
 * @param pattern - RegEx pattern to match
 * @returns First captured group from the pattern match, or null
 */
function extractFromUserSpeechOnly(
  transcript: string,
  pattern: RegExp,
): string | null {
  const parsed = parseTranscriptByRole(transcript);
  const userLines = parsed.filter((line) => line.speaker === "user");

  if (userLines.length === 0) return null;

  // Skip first 20% of conversation (greetings/pleasantries)
  const startLine = Math.floor(userLines.length * 0.2);
  const relevantText = userLines
    .slice(startLine)
    .map((line) => line.text)
    .join(" ")
    .replace(/\[\d+:\d+\]/g, "") // Remove timestamps
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  const match = pattern.exec(relevantText);
  return match?.[1] ?? null;
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
 * IMPORTANT: Uses speaker-aware extraction to prevent capturing assistant
 * names like "Nancy" or "Stacy" from greetings.
 *
 * @param transcript - The call transcript text
 * @returns Extracted caller name or null if not found
 */
export function extractCallerNameFromTranscript(
  transcript: string | null,
): string | null {
  if (!transcript) return null;

  // Clean up the transcript - remove timestamps, AI/User labels, extra whitespace
  const cleanTranscript = transcript
    .replace(/^(AI|User|Assistant|Nancy|Stacy|Caller):\s*/gm, "")
    .replace(/\[\d+:\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Pattern 1: Name followed by phone number pattern (like "Dene Garamalo, 408-817") - HIGHEST PRIORITY
  // This pattern has high confidence since people typically give name + phone together
  const match = /([A-Za-z]+\s+[A-Za-z]+)[\.,]\s*[\d-]+/.exec(cleanTranscript);
  if (match?.[1]) {
    const name = match[1].trim();
    if (isValidName(name)) {
      return formatName(name);
    }
  }

  // Pattern 2: "This is [Name]" - ONLY extract from user speech
  // This prevents extracting "Nancy" from "Assistant: This is Nancy"
  const thisIsName = extractFromUserSpeechOnly(
    transcript,
    /(?:yes[,.]?\s+)?this\s+is\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
  );
  if (thisIsName && isValidName(thisIsName)) {
    return formatName(thisIsName);
  }

  // Pattern 3: "My name is [Name]" or "I'm [Name]" - ONLY extract from user speech
  const myNameIs = extractFromUserSpeechOnly(
    transcript,
    /(?:my\s+name\s+is|i'm)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
  );
  if (myNameIs && isValidName(myNameIs)) {
    return formatName(myNameIs);
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
 * IMPORTANT: Pattern 4 ("[word] is/has/needs") has been REMOVED due to
 * excessive false positives (captured "Euthanized", "Today", "Lunch", etc.)
 *
 * @param transcript - The call transcript text
 * @returns Extracted pet name(s) or null if not found
 */
export function extractPetNameFromTranscript(
  transcript: string | null,
): string | null {
  if (!transcript) return null;

  // Clean up the transcript - only extract from user lines
  const parsed = parseTranscriptByRole(transcript);
  const userLines = parsed.filter((line) => line.speaker === "user");
  const cleanTranscript = userLines
    .map((line) => line.text)
    .join(" ")
    .replace(/\[\d+:\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Pattern 1: "My [animal] [Name]" or "My pet [Name]"
  let match = /my\s+(?:dog|cat|pet|puppy|kitten|animal)\s+([A-Za-z]+)/i.exec(
    cleanTranscript,
  );
  if (match?.[1]) {
    const petName = match[1].trim();
    if (isValidPetName(petName)) {
      return formatName(petName);
    }
  }

  // Pattern 2: Pet name in appointment context "for [Pet Name]" or "about [Pet Name]"
  match = /(?:for|about)\s+([A-Za-z]+)(?:\s+and\s+([A-Za-z]+))?/i.exec(
    cleanTranscript,
  );
  if (match?.[1]) {
    const petName = match[1].trim();
    if (isValidPetName(petName)) {
      const secondPet = match[2] ? ` and ${formatName(match[2].trim())}` : "";
      return formatName(petName) + secondPet;
    }
  }

  // Pattern 3: Multiple pets mentioned by name "Oscar and Felix [verb]"
  match = /([A-Za-z]+)\s+and\s+([A-Za-z]+)\s+(?:are|were|have|need|had)/i.exec(
    cleanTranscript,
  );
  if (match?.[1] && match?.[2]) {
    const pet1 = match[1].trim();
    const pet2 = match[2].trim();
    if (
      isValidPetName(pet1) &&
      isValidPetName(pet2) &&
      !isCommonWord(pet1) &&
      !isCommonWord(pet2)
    ) {
      return `${formatName(pet1)} and ${formatName(pet2)}`;
    }
  }

  // Pattern 4: REMOVED - Too many false positives
  // Previously: /([A-Za-z]+)\s+(?:is|has|needs)/
  // This caught "Euthanized is", "Today is", "Lunch is", "Tomorrow is", etc.
  // Better to have no data than bad data.

  return null;
}

/**
 * Extract caller name with confidence and source metadata
 *
 * Returns detailed extraction information including confidence level
 * and pattern source for quality tracking and debugging.
 *
 * @param transcript - The call transcript text
 * @returns Extraction result with metadata
 */
export function extractCallerNameWithConfidence(
  transcript: string | null,
): ExtractionResult {
  if (!transcript) {
    return { value: null, confidence: "low", source: "none" };
  }

  // Clean up the transcript
  const cleanTranscript = transcript
    .replace(/^(AI|User|Assistant|Nancy|Stacy|Caller):\s*/gm, "")
    .replace(/\[\d+:\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Pattern 1: Name + phone (HIGH confidence)
  const match = /([A-Za-z]+\s+[A-Za-z]+)[\.,]\s*[\d-]+/.exec(cleanTranscript);
  if (match?.[1]) {
    const name = match[1].trim();
    if (isValidName(name)) {
      return {
        value: formatName(name),
        confidence: "high",
        source: "pattern1",
        context: cleanTranscript.substring(
          Math.max(0, (match.index ?? 0) - 50),
          Math.min(cleanTranscript.length, (match.index ?? 0) + 100),
        ),
      };
    }
  }

  // Pattern 2: "This is [Name]" from user speech (MEDIUM confidence)
  const thisIsName = extractFromUserSpeechOnly(
    transcript,
    /(?:yes[,.]?\s+)?this\s+is\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
  );
  if (thisIsName && isValidName(thisIsName)) {
    return {
      value: formatName(thisIsName),
      confidence: "medium",
      source: "pattern2",
    };
  }

  // Pattern 3: "My name is [Name]" from user speech (MEDIUM confidence)
  const myNameIs = extractFromUserSpeechOnly(
    transcript,
    /(?:my\s+name\s+is|i'm)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
  );
  if (myNameIs && isValidName(myNameIs)) {
    return {
      value: formatName(myNameIs),
      confidence: "medium",
      source: "pattern3",
    };
  }

  return { value: null, confidence: "low", source: "none" };
}

/**
 * Extract pet name with confidence and source metadata
 *
 * Returns detailed extraction information including confidence level
 * and pattern source for quality tracking and debugging.
 *
 * @param transcript - The call transcript text
 * @returns Extraction result with metadata
 */
export function extractPetNameWithConfidence(
  transcript: string | null,
): ExtractionResult {
  if (!transcript) {
    return { value: null, confidence: "low", source: "none" };
  }

  // Clean up the transcript - only extract from user lines
  const parsed = parseTranscriptByRole(transcript);
  const userLines = parsed.filter((line) => line.speaker === "user");
  const cleanTranscript = userLines
    .map((line) => line.text)
    .join(" ")
    .replace(/\[\d+:\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Pattern 1: "My [animal] [Name]" (HIGH confidence)
  let match = /my\s+(?:dog|cat|pet|puppy|kitten|animal)\s+([A-Za-z]+)/i.exec(
    cleanTranscript,
  );
  if (match?.[1]) {
    const petName = match[1].trim();
    if (isValidPetName(petName)) {
      return {
        value: formatName(petName),
        confidence: "high",
        source: "pattern1",
        context: cleanTranscript.substring(
          Math.max(0, (match.index ?? 0) - 30),
          Math.min(cleanTranscript.length, (match.index ?? 0) + 60),
        ),
      };
    }
  }

  // Pattern 2: "for/about [Pet Name]" (MEDIUM confidence)
  match = /(?:for|about)\s+([A-Za-z]+)(?:\s+and\s+([A-Za-z]+))?/i.exec(
    cleanTranscript,
  );
  if (match?.[1]) {
    const petName = match[1].trim();
    if (isValidPetName(petName)) {
      const secondPet = match[2] ? ` and ${formatName(match[2].trim())}` : "";
      return {
        value: formatName(petName) + secondPet,
        confidence: "medium",
        source: "pattern2",
      };
    }
  }

  // Pattern 3: "[Pet1] and [Pet2] [verb]" (MEDIUM confidence)
  match = /([A-Za-z]+)\s+and\s+([A-Za-z]+)\s+(?:are|were|have|need|had)/i.exec(
    cleanTranscript,
  );
  if (match?.[1] && match?.[2]) {
    const pet1 = match[1].trim();
    const pet2 = match[2].trim();
    if (
      isValidPetName(pet1) &&
      isValidPetName(pet2) &&
      !isCommonWord(pet1) &&
      !isCommonWord(pet2)
    ) {
      return {
        value: `${formatName(pet1)} and ${formatName(pet2)}`,
        confidence: "medium",
        source: "pattern3",
      };
    }
  }

  return { value: null, confidence: "low", source: "none" };
}

/**
 * Check if extracted text looks like a valid human name
 */
function isValidName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 50) return false;

  // Must contain only letters and spaces
  if (!/^[A-Za-z\s]+$/.test(name)) return false;

  // Filter out common false positives (use whole-word matching)
  const lowercaseName = name.toLowerCase();
  const invalidNames = [
    // System labels
    "user",
    "ai",
    "assistant",
    // Agent names (from VAPI assistant configuration)
    "nancy",
    "stacy",
    // Conversational words
    "hello",
    "yes",
    "no",
    "ok",
    "okay",
    "thank",
    "thanks",
    "please",
    "sorry",
    "excuse",
    "um",
    "uh",
    "calling",
    "call",
    "phone",
    "number",
    // Business/location terms
    "clinic",
    "hospital",
    "pharmacy",
    "costco",
    "appointment",
    // Temporal phrases (from false positives)
    "today",
    "tomorrow",
    "yesterday",
    "through",
    "until",
    "morning",
    "afternoon",
    "evening",
    "noon",
    "lunch",
    "dinner",
    // Date components
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    // Ordinal numbers (from "January Sixteenth" false positive)
    "first",
    "second",
    "third",
    "fourth",
    "fifth",
    "sixth",
    "seventh",
    "eighth",
    "ninth",
    "tenth",
    "eleventh",
    "twelfth",
    "thirteenth",
    "fourteenth",
    "fifteenth",
    "sixteenth",
    "seventeenth",
    "eighteenth",
    "nineteenth",
    "twentieth",
    // Conversational phrases (from "Got It" false positive)
    "got it",
    "got",
    "here",
    "there",
  ];

  // Use whole-word matching to avoid false positives
  // (e.g., "nancy" should block "Nancy" but not "Nancyanne")
  return !invalidNames.some((invalid) => {
    const regex = new RegExp(`\\b${invalid}\\b`, "i");
    return regex.test(lowercaseName);
  });
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
    // Articles/conjunctions
    "the",
    "and",
    "but",
    "for",
    "are",
    "can",
    "has",
    "had",
    // Pronouns (from false positives: "You", "My", "Your")
    "him",
    "her",
    "his",
    "she",
    "they",
    "them",
    "this",
    "that",
    "you",
    "my",
    "your",
    "our",
    "their",
    // Common verbs
    "have",
    "will",
    "been",
    "said",
    "make",
    "take",
    "come",
    "could",
    "made",
    "think",
    // Temporal words (from false positives: "Today", "Tomorrow", "Lunch")
    "today",
    "tomorrow",
    "yesterday",
    "lunch",
    "dinner",
    "morning",
    "afternoon",
    "evening",
    // Medical/veterinary terms (from "Euthanized" false positive)
    "euthanized",
    "deceased",
    "passed",
    "died",
    "surgery",
    "procedure",
    "treatment",
    // Action words
    "emergency",
    "urgent",
    "appointment",
    // Location/business terms (from "Alum", "Clinic" false positives)
    "clinic",
    "hospital",
    "alum",
    "hours",
    // Common adjectives/adverbs
    "each",
    "which",
    "time",
    "back",
    "only",
    "very",
    "after",
    "first",
    "well",
    "year",
    "work",
    "such",
    "even",
    "more",
    "most",
    "than",
    "these",
    "two",
    "way",
    "who",
    "its",
    "did",
    "get",
    "may",
    "new",
    "now",
    "old",
    "see",
    "over",
    "also",
    "need",
    "needs",
    "want",
    "wants",
    "good",
    "help",
    "call",
    "calling",
  ];

  return commonWords.includes(lowercaseWord);
}

/**
 * Format name with proper capitalization
 */
function formatName(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Extract callback phone number from transcript
 *
 * Looks for 10-digit phone numbers in the caller's speech:
 * - "My number is 925-337-4054"
 * - "Call me at (408) 555-1234"
 * - "Reach me at 510.555.9876"
 * - "925 337 4054" (space-separated)
 *
 * Only extracts from caller lines (User:/Caller:) to avoid picking up
 * clinic numbers mentioned by the AI.
 *
 * @param transcript - The call transcript text
 * @returns Extracted 10-digit phone number (digits only) or null if not found
 */
export function extractCallbackPhoneFromTranscript(
  transcript: string | null,
): string | null {
  if (!transcript) return null;

  // Split by lines and identify caller speech (User: or Caller: prefixed lines)
  const lines = transcript.split(/\n/);
  const callerLines: string[] = [];

  for (const line of lines) {
    // Match lines that start with User: or Caller: (case-insensitive)
    if (/^(User|Caller):\s*/i.test(line)) {
      callerLines.push(line.replace(/^(User|Caller):\s*/i, ""));
    }
  }

  // If no labeled lines found, try to extract from the full transcript
  // but be more conservative - look for phone context patterns
  const textToSearch =
    callerLines.length > 0 ? callerLines.join(" ") : transcript;

  // Phone patterns we want to match:
  // - 925-337-4054 (dashes)
  // - (925) 337-4054 (parentheses)
  // - 925.337.4054 (dots)
  // - 925 337 4054 (spaces)
  // - 9253374054 (no separators)
  const phonePatterns = [
    // Pattern with context words (higher confidence)
    /(?:my\s+(?:number|phone|cell|callback)\s+is|call\s+(?:me|back)\s+at|reach\s+me\s+at|number\s+is|at)\s*\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/i,
    // Standalone phone pattern (lower priority)
    /\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/,
  ];

  for (const pattern of phonePatterns) {
    const match = textToSearch.match(pattern);
    if (match) {
      // Combine the three capture groups (area code, exchange, subscriber)
      const phone = `${match[1]}${match[2]}${match[3]}`;
      if (phone.length === 10) {
        return phone;
      }
    }
  }

  return null;
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
export function parseAndFormatAppointmentDate(
  dateStr: string,
  outputFormat = "MMM d",
): string {
  if (!dateStr || typeof dateStr !== "string") {
    return dateStr;
  }

  try {
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
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    // Handle "next monday", "this friday", etc.
    const nextDayMatch =
      /^(?:next|this)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i.exec(
        normalized,
      );
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
    const justDayMatch =
      /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i.exec(
        normalized,
      );
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
    .replace(/\s*→\s*/g, "\n→ ")
    .replace(/\s*->\s*/g, "\n-> ")
    .trim();
}
