"use client";

import { parseAttentionSummary, getAttentionTitle } from "@odis-ai/shared/util";
import { cn } from "@odis-ai/shared/util";

interface NeedsAttentionCardProps {
  attentionTypes: string[];
  attentionSeverity: string | null;
  attentionSummary: string | null;
  className?: string;
}

/**
 * NeedsAttentionCard for outbound case detail side panel
 *
 * Shows a simplified card with:
 * - Title from attention type (e.g., "Medication Question", "Emergency Signs")
 * - Context and action needed from parsed summary
 * - No severity badge (already shown in main table)
 */
export function NeedsAttentionCard({
  attentionTypes,
  attentionSeverity,
  attentionSummary,
  className,
}: NeedsAttentionCardProps) {
  // Parse the attention summary
  const parsed = parseAttentionSummary(attentionSummary);

  // Get user-friendly title from attention types
  const title = getAttentionTitle(attentionTypes);

  // Normalize severity to expected values
  const normalizedSeverity = (() => {
    if (!attentionSeverity) return "routine";
    const lower = attentionSeverity.toLowerCase();
    if (lower === "critical") return "critical";
    if (lower === "urgent") return "urgent";
    return "routine";
  })();

  // Severity colors for background and border
  const severityColors = {
    critical: "bg-red-50 border-red-200 border-l-red-500",
    urgent: "bg-orange-50 border-orange-200 border-l-orange-500",
    routine: "bg-blue-50 border-blue-200 border-l-blue-500"
  };

  const colors = severityColors[normalizedSeverity];

  return (
    <div className={cn(
      "rounded-lg border border-l-4 p-4 space-y-3",
      colors,
      normalizedSeverity === "critical" && "animate-pulse",
      className
    )}>
      {/* Main title from attention type */}
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-gray-900">
          {title}
        </h3>
      </div>

      {parsed ? (
        <div className="space-y-2">
          {/* Context - only show if different from default */}
          {parsed.context && parsed.context !== "Attention needed" && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Context</h4>
              <p className="text-sm text-gray-600">{parsed.context}</p>
            </div>
          )}

          {/* Action needed */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Action Needed</h4>
            <p className="text-sm text-gray-900 font-medium">{parsed.action}</p>
          </div>
        </div>
      ) : (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Details</h4>
          <p className="text-sm text-gray-600">Review case and address attention items</p>
        </div>
      )}
    </div>
  );
}