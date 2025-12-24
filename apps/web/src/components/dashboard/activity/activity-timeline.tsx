"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@odis-ai/shared/ui/collapsible";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import { ActivityItemComponent } from "./activity-item";
import type { ActivityItem } from "@odis-ai/shared/types";

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

const INITIAL_ITEMS_TO_SHOW = 5;

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (activities.length === 0) {
    return (
      <Card className="transition-smooth rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-slate-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="animate-card-content-in">
          <div className="py-8 text-center">
            <Activity className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasMore = activities.length > INITIAL_ITEMS_TO_SHOW;
  const initialItems = activities.slice(0, INITIAL_ITEMS_TO_SHOW);
  const remainingItems = activities.slice(INITIAL_ITEMS_TO_SHOW);

  return (
    <Card className="transition-smooth rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-slate-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="animate-card-content-in">
        <div className="space-y-0">
          {initialItems.map((activity, index) => (
            <ActivityItemComponent
              key={activity.id}
              activity={activity}
              isLast={index === initialItems.length - 1 && !hasMore}
            />
          ))}
        </div>

        {hasMore && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="transition-smooth mt-4 w-full hover:bg-slate-50"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="transition-smooth mr-2 h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="transition-smooth mr-2 h-4 w-4" />
                    Show More ({remainingItems.length} more items)
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="space-y-0">
                {remainingItems.map((activity, index) => (
                  <ActivityItemComponent
                    key={activity.id}
                    activity={activity}
                    isLast={index === remainingItems.length - 1}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
