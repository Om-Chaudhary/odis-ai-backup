"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@odis-ai/utils";

interface InboundPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZES = [25, 50, 100] as const;

/**
 * Pagination Controls - Glassmorphism Theme
 *
 * [Showing 1-25 of 78] [25 ▼] [< Prev] [1] [2] [3] [Next >]
 */
export function InboundPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: InboundPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    if (page > 3) {
      pages.push("...");
    }

    // Pages around current
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }

    if (page < totalPages - 2) {
      pages.push("...");
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  if (total === 0) return null;

  return (
    <div className="flex w-full items-center justify-between">
      {/* Info */}
      <div className="text-sm text-slate-500">
        <span className="font-medium text-slate-700 tabular-nums">
          {start}–{end}
        </span>{" "}
        of <span className="tabular-nums">{total}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Page Size */}
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className={cn(
            "h-8 rounded-lg border border-teal-200/50 bg-white/60 px-2.5 text-sm text-slate-600",
            "transition-all duration-200",
            "hover:border-teal-300/60 hover:bg-white/80",
            "focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none",
          )}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrev}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200",
            canGoPrev
              ? "border-teal-200/50 bg-white/60 text-slate-600 hover:border-teal-300/60 hover:bg-white/80"
              : "cursor-not-allowed border-slate-100 bg-slate-50/50 text-slate-300",
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum, idx) =>
            pageNum === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-1.5 text-sm text-slate-400"
              >
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "flex h-8 min-w-8 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition-all duration-200",
                  page === pageNum
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-teal-50",
                )}
              >
                {pageNum}
              </button>
            ),
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200",
            canGoNext
              ? "border-teal-200/50 bg-white/60 text-slate-600 hover:border-teal-300/60 hover:bg-white/80"
              : "cursor-not-allowed border-slate-100 bg-slate-50/50 text-slate-300",
          )}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
