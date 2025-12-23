"use client";

import { api } from "~/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Button } from "@odis-ai/ui/button";
import { Badge } from "@odis-ai/ui/badge";
import { Skeleton } from "@odis-ai/ui/skeleton";
import {
  PhoneOff,
  DollarSign,
  ChevronRight,
  Phone,
  Mail,
  RefreshCw,
} from "lucide-react";
import { cn } from "@odis-ai/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function FailedCallsTracker() {
  const { data, isLoading, refetch } = api.dashboard.getFailedCalls.useQuery(
    { limit: 5, hoursBack: 48 },
    {
      refetchInterval: 120000, // Refetch every 2 minutes
    },
  );

  if (isLoading) {
    return <FailedCallsTrackerSkeleton />;
  }

  // Don't show if no failed calls
  if (!data || data.totalCount === 0) {
    return null;
  }

  return (
    <Card className="animate-card-in overflow-hidden rounded-xl border border-red-200/40 bg-gradient-to-br from-red-50/30 via-white/70 to-white/70 shadow-lg shadow-red-500/5 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <PhoneOff className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Failed Calls
              </CardTitle>
              <p className="text-sm text-slate-500">
                Last 48 hours - needs manual follow-up
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-red-200 bg-red-50 text-red-700"
            >
              {data.totalCount} failed
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 text-slate-400" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Cost Impact */}
        {data.wastedCost > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
            <DollarSign className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">
              <strong>${data.wastedCost.toFixed(2)}</strong> spent on failed
              attempts
            </span>
          </div>
        )}

        {/* Failed Calls List */}
        <div className="space-y-2">
          {data.calls.map((call) => (
            <FailedCallItem key={call.id} call={call} />
          ))}
        </div>

        {data.totalCount > 5 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Link
              href="/dashboard/outbound?status=failed"
              className="flex items-center justify-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
            >
              View all {data.totalCount} failed calls
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FailedCall {
  id: string;
  caseId: string;
  caseType: string;
  petName: string;
  ownerName: string;
  ownerPhone: string | null;
  ownerEmail: string | null;
  species: string;
  scheduledFor: string | null;
  createdAt: string;
  duration: number | null;
  cost: number;
}

function FailedCallItem({ call }: { call: FailedCall }) {
  const hasPhone = !!call.ownerPhone;
  const hasEmail = !!call.ownerEmail;

  return (
    <Link
      href={`/dashboard/outbound/workflow/${call.caseId}`}
      className="group flex items-center justify-between rounded-lg border border-slate-100 bg-white/50 p-3 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-slate-800">
            {call.petName}
          </span>
          <Badge
            variant="outline"
            className="shrink-0 border-slate-200 text-xs capitalize"
          >
            {call.caseType}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
          <span className="truncate">{call.ownerName}</span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
      <div className="ml-4 flex items-center gap-2">
        {/* Contact options */}
        <div className="flex items-center gap-1">
          {hasPhone && (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50"
              title={call.ownerPhone ?? ""}
            >
              <Phone className="h-3.5 w-3.5 text-green-600" />
            </div>
          )}
          {hasEmail && (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50"
              title={call.ownerEmail ?? ""}
            >
              <Mail className="h-3.5 w-3.5 text-blue-600" />
            </div>
          )}
          {!hasPhone && !hasEmail && (
            <Badge variant="outline" className="border-amber-200 text-xs">
              No contact
            </Badge>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
      </div>
    </Link>
  );
}

function FailedCallsTrackerSkeleton() {
  return (
    <Card className="animate-pulse rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50/80 via-white/70 to-slate-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-4 h-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}
