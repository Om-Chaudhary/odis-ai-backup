"use client";

import { CheckCircle, Calendar, Inbox } from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";

interface OutboundEmptyStateProps {
  type?: "no-cases" | "all-complete" | "no-results";
  onClearFilters?: () => void;
}

/**
 * Empty State Component
 *
 * Different states:
 * - no-cases: No discharge cases exist
 * - all-complete: All cases have been processed
 * - no-results: Filter returned no results
 */
export function OutboundEmptyState({
  type = "no-cases",
  onClearFilters,
}: OutboundEmptyStateProps) {
  const content = {
    "no-cases": {
      icon: Inbox,
      title: "No discharge cases",
      description:
        "There are no completed cases ready for discharge communications.",
    },
    "all-complete": {
      icon: CheckCircle,
      title: "All caught up!",
      description: "All discharge communications have been sent. Great work!",
    },
    "no-results": {
      icon: Calendar,
      title: "No matching cases",
      description: "Try adjusting your filters to see more cases.",
    },
  };

  const { icon: Icon, title, description } = content[type];

  return (
    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted mb-4 rounded-full p-4">
        <Icon className="text-muted-foreground h-8 w-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm text-sm">
        {description}
      </p>
      {type === "no-results" && onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}
