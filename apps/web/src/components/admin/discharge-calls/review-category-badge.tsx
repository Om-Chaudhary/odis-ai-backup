"use client";

import { Badge } from "@odis-ai/ui/badge";
import {
  ThumbsUp,
  ThumbsDown,
  Voicemail,
  PhoneMissed,
  AlertCircle,
  Clock,
  Flag,
} from "lucide-react";
import type { ReviewCategory } from "~/server/api/routers/admin-discharge-calls";

interface ReviewCategoryBadgeProps {
  category: ReviewCategory;
  size?: "sm" | "default";
}

const categoryConfig: Record<
  ReviewCategory,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  to_review: {
    label: "To Review",
    icon: Clock,
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  good: {
    label: "Good",
    icon: ThumbsUp,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  bad: {
    label: "Bad",
    icon: ThumbsDown,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  voicemail: {
    label: "Voicemail",
    icon: Voicemail,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  no_answer: {
    label: "No Answer",
    icon: PhoneMissed,
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  needs_followup: {
    label: "Follow-up",
    icon: Flag,
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

export function ReviewCategoryBadge({
  category,
  size = "default",
}: ReviewCategoryBadgeProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1"}`}
    >
      <Icon className={size === "sm" ? "mr-1 h-3 w-3" : "mr-1.5 h-3.5 w-3.5"} />
      {config.label}
    </Badge>
  );
}

export { categoryConfig };
