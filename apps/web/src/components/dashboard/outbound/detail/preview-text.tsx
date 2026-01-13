interface PreviewTextProps {
  content: string;
  expanded: boolean;
  maxLines: number;
}

/**
 * Helper component for displaying truncated text with expand/collapse behavior
 * Used for call scripts and email previews in the case detail panel
 */
export function PreviewText({ content, expanded, maxLines }: PreviewTextProps) {
  if (!content?.trim()) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500">
        No content available
      </p>
    );
  }

  // Split content into lines for truncation
  const lines = content.split("\n");
  const shouldTruncate = lines.length > maxLines;
  const displayContent =
    expanded || !shouldTruncate ? content : lines.slice(0, maxLines).join("\n");

  return (
    <div className="space-y-2">
      <div className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
        {displayContent}
        {!expanded && shouldTruncate && (
          <span className="text-slate-400">...</span>
        )}
      </div>
    </div>
  );
}
