import { Suspense } from "react";
import { BillingPageClient } from "~/components/dashboard/billing/billing-page-client";
import { Skeleton } from "@odis-ai/shared/ui/skeleton";

export const metadata = {
  title: "Billing | ODIS AI",
  description: "Manage your subscription and billing",
};

function BillingPageSkeleton() {
  return (
    <div className="flex-1 p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        {/* Current plan card skeleton */}
        <Skeleton className="h-52 w-full rounded-xl" />
        {/* Plans grid skeleton */}
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingPageSkeleton />}>
      <BillingPageClient />
    </Suspense>
  );
}
