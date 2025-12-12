"use client";

import { Skeleton } from "@odis-ai/ui/skeleton";
import { Card, CardContent, CardHeader } from "@odis-ai/ui/card";

/**
 * Skeleton for the filter tabs
 */
export function FilterTabsSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-9 w-64 rounded-md" />
    </div>
  );
}

/**
 * Skeleton for the case table
 */
export function CaseTableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {/* Header */}
      <div className="flex gap-4 border-b pb-3">
        <Skeleton className="h-4 w-[180px]" />
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-[70px]" />
      </div>
      {/* Rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <div className="w-[180px] space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-6 w-[80px] rounded-full" />
          <Skeleton className="mx-auto h-4 w-4 rounded-full" />
          <Skeleton className="mx-auto h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-[60px]" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for the case detail panel
 */
export function CaseDetailSkeleton() {
  return (
    <div className="flex h-full flex-col p-4 pt-12">
      {/* Header */}
      <div className="space-y-3 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-auto">
        {/* Summary card */}
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Card>
            <CardContent className="pt-4">
              <div className="mb-3 flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-32 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>

        {/* Toggles */}
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action bar */}
      <div className="border-t pt-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    </div>
  );
}

/**
 * Full page skeleton
 */
export function OutboundPageSkeleton() {
  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col gap-4">
      <FilterTabsSkeleton />
      <div className="flex-1 overflow-hidden rounded-lg border">
        <CaseTableSkeleton />
      </div>
    </div>
  );
}
