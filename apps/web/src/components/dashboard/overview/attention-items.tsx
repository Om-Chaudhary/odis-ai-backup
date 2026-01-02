"use client";

import { AlertCircle, Play } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import type { FlaggedItem } from "./types";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface AttentionItemsProps {
  items: FlaggedItem[];
  totalCount: number;
}

export function AttentionItems({ items, totalCount }: AttentionItemsProps) {
  if (items.length === 0) return null;

  return (
    <div
      id="flagged-items"
      className="rounded-xl border border-stone-200/60 bg-white"
    >
      <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <h3 className="font-medium text-slate-900">Items Needing Review</h3>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {totalCount}
          </span>
        </div>
        {totalCount > items.length && (
          <Link
            href="/dashboard/inbound?filter=flagged"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            View all
          </Link>
        )}
      </div>

      <div className="divide-y divide-stone-100">
        {items.map((item) => (
          <FlaggedItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function FlaggedItemCard({ item }: { item: FlaggedItem }) {
  const severityStyles = {
    critical: {
      badge: "bg-red-100 text-red-700",
      border: "border-l-red-500",
    },
    urgent: {
      badge: "bg-amber-100 text-amber-700",
      border: "border-l-amber-500",
    },
    default: {
      badge: "bg-stone-100 text-stone-700",
      border: "border-l-stone-300",
    },
  };

  const severity = (item.severity as keyof typeof severityStyles) || "default";
  const styles = severityStyles[severity] || severityStyles.default;

  const timeAgo = item.createdAt
    ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
    : "";

  return (
    <Link
      href={`/dashboard/inbound/${item.id}`}
      className={cn(
        "group flex items-start gap-4 border-l-4 px-6 py-4 transition-colors hover:bg-stone-50",
        styles.border,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {item.severity && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                styles.badge,
              )}
            >
              {item.severity}
            </span>
          )}
          <span className="text-xs text-slate-500">{timeAgo}</span>
        </div>
        <p className="mt-1.5 font-medium text-slate-900">
          {item.petName !== "Unknown" ? item.petName : "Unknown Pet"}
          {item.ownerName !== "Unknown" && (
            <span className="font-normal text-slate-500">
              {" "}
              · {item.ownerName}
            </span>
          )}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
          {item.summary}
        </p>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
        <Play className="h-4 w-4" />
      </div>
    </Link>
  );
}
