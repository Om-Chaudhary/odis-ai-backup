/**
 * Loading skeleton for table
 * Styled to match outbound dashboard with teal-based colors
 */
export function TableSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      {/* Header skeleton */}
      <div className="mb-0 flex shrink-0 gap-2 border-b border-teal-100/50 px-6 py-3">
        <div className="h-3 w-[32%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[14%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[12%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[14%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[22%] animate-pulse rounded bg-teal-100/50" />
      </div>
      {/* Row skeletons */}
      <div className="flex-1 space-y-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 border-b border-teal-50 px-6 py-3"
          >
            <div className="w-[32%] space-y-1">
              <div className="h-4 w-24 animate-pulse rounded bg-teal-100/40" />
              <div className="h-3 w-32 animate-pulse rounded bg-teal-50" />
            </div>
            <div className="flex w-[14%] justify-center">
              <div className="h-5 w-14 animate-pulse rounded-full bg-teal-50" />
            </div>
            <div className="flex w-[12%] justify-center">
              <div className="h-5 w-12 animate-pulse rounded-full bg-teal-50" />
            </div>
            <div className="flex w-[14%] justify-center">
              <div className="h-5 w-12 animate-pulse rounded-md bg-teal-50" />
            </div>
            <div className="flex w-[22%] justify-end">
              <div className="h-3 w-16 animate-pulse rounded bg-teal-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
