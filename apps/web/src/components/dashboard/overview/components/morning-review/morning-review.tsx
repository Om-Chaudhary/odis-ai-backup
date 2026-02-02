"use client";

import { ActivityTimeline } from "./activity-timeline";
import { ReviewCards } from "./review-cards";
import type { LiveActivityItem, NeedsReviewItem } from "../../mock-data";

interface MorningReviewProps {
  activities: LiveActivityItem[];
  reviewItems: NeedsReviewItem[];
  clinicSlug: string;
  onActivityClick?: (id: string) => void;
}

export function MorningReview({
  activities,
  reviewItems,
  clinicSlug,
  onActivityClick,
}: MorningReviewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Live Activity Timeline - 60% */}
      <div className="lg:col-span-3">
        <ActivityTimeline
          activities={activities}
          onActivityClick={onActivityClick}
        />
      </div>

      {/* Needs Review Cards - 40% */}
      <div className="lg:col-span-2">
        <ReviewCards items={reviewItems} clinicSlug={clinicSlug} />
      </div>
    </div>
  );
}
