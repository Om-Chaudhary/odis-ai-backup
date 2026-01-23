/**
 * Format seconds into MM:SS display string
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Parse plain text transcript into structured messages
 */
export function parseTranscript(
  text: string
): { speaker: "AI" | "User" | "Other"; text: string }[] {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  const parsed: { speaker: "AI" | "User" | "Other"; text: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("AI:")) {
      parsed.push({ speaker: "AI", text: trimmed.substring(3).trim() });
      continue;
    }

    if (trimmed.startsWith("User:")) {
      parsed.push({ speaker: "User", text: trimmed.substring(5).trim() });
      continue;
    }

    if (trimmed.includes(": ")) {
      const colonIdx = trimmed.indexOf(": ");
      const speaker = trimmed.substring(0, colonIdx).trim().toLowerCase();
      const content = trimmed.substring(colonIdx + 2).trim();

      if (
        speaker.includes("ai") ||
        speaker.includes("assistant") ||
        speaker.includes("bot")
      ) {
        parsed.push({ speaker: "AI", text: content });
      } else if (
        speaker.includes("user") ||
        speaker.includes("customer") ||
        speaker.includes("client")
      ) {
        parsed.push({ speaker: "User", text: content });
      } else {
        parsed.push({ speaker: "Other", text: trimmed });
      }
      continue;
    }

    if (trimmed.length > 0) {
      parsed.push({ speaker: "Other", text: trimmed });
    }
  }

  return parsed;
}
