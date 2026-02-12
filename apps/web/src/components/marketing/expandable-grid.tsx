"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableGridProps {
  children: React.ReactNode[];
  initialLimit?: number;
  gridClassName?: string;
}

export function ExpandableGrid({
  children,
  initialLimit = 6,
  gridClassName = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
}: ExpandableGridProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMore = children.length > initialLimit;
  const visibleChildren = isExpanded
    ? children
    : children.slice(0, initialLimit);

  if (!hasMore) {
    // No expansion needed, render all children normally
    return <div className={gridClassName}>{children}</div>;
  }

  return (
    <div className="relative">
      {/* Grid with smooth height transition */}
      <div className={gridClassName}>
        {visibleChildren.map((child, index) => (
          <div
            key={index}
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{
              animationDelay: `${Math.min(index * 50, 300)}ms`,
              animationDuration: "500ms",
              animationFillMode: "backwards",
            }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Gradient fade overlay when collapsed */}
      {!isExpanded && (
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-white via-white/60 to-transparent" />
      )}

      {/* Expand/Collapse Button */}
      <div className="relative z-10 mt-8 flex justify-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="group inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 hover:shadow-md"
        >
          {isExpanded ? (
            <>
              Show Less
              <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            </>
          ) : (
            <>
              Show {children.length - initialLimit} More
              <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
