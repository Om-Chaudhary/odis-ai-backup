"use client";

import { api } from "~/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Skeleton } from "@odis-ai/shared/ui/skeleton";
import {
  AlertTriangle,
  Phone,
  UserX,
  HeartPulse,
  PhoneCall,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useState } from "react";

export function CriticalActionsAlert() {
  const [isDismissed, setIsDismissed] = useState(false);
  const { data, isLoading } = api.dashboard.getCriticalActions.useQuery(
    undefined,
    {
      refetchInterval: 60000, // Refetch every minute
    },
  );

  if (isLoading) {
    return <CriticalActionsAlertSkeleton />;
  }

  // Don't show if no critical actions or dismissed
  if (!data || data.totalCritical === 0 || isDismissed) {
    return null;
  }

  const hasCriticalHealth = data.healthConcerns.calls.some(
    (c) => c.severity === "critical" || c.severity === "urgent",
  );

  return (
    <Card
      className={cn(
        "animate-card-in overflow-hidden rounded-xl border shadow-lg backdrop-blur-md",
        hasCriticalHealth
          ? "border-red-300/50 bg-gradient-to-br from-red-50/80 via-white/70 to-red-50/50 shadow-red-500/10"
          : "border-amber-300/50 bg-gradient-to-br from-amber-50/80 via-white/70 to-amber-50/50 shadow-amber-500/10",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                hasCriticalHealth ? "bg-red-100" : "bg-amber-100",
              )}
            >
              <AlertTriangle
                className={cn(
                  "h-5 w-5",
                  hasCriticalHealth
                    ? "animate-pulse text-red-600"
                    : "text-amber-600",
                )}
              />
            </div>
            <div>
              <CardTitle
                className={cn(
                  "text-lg font-semibold",
                  hasCriticalHealth ? "text-red-900" : "text-amber-900",
                )}
              >
                {data.totalCritical} Action
                {data.totalCritical !== 1 ? "s" : ""} Required
              </CardTitle>
              <p
                className={cn(
                  "text-sm",
                  hasCriticalHealth ? "text-red-600" : "text-amber-600",
                )}
              >
                Items needing your immediate attention
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-600"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Concerns - Most Critical */}
        {data.healthConcerns.count > 0 && (
          <ActionSection
            icon={HeartPulse}
            title="Health Concerns"
            count={data.healthConcerns.count}
            variant="critical"
            items={data.healthConcerns.calls.map((call) => ({
              id: call.id,
              label: `${call.petName} (${call.ownerName})`,
              sublabel: call.summary || call.concernType,
              badge: call.severity,
              href: `/dashboard/outbound/workflow/${call.caseId}`,
              time: call.endedAt,
            }))}
          />
        )}

        {/* Failed Calls */}
        {data.failedCalls.count > 0 && (
          <ActionSection
            icon={Phone}
            title="Failed Calls"
            count={data.failedCalls.count}
            variant="warning"
            items={data.failedCalls.calls.map((call) => ({
              id: call.id,
              label: `${call.petName} (${call.ownerName})`,
              sublabel: "Call failed - needs manual follow-up",
              href: `/dashboard/outbound/workflow/${call.caseId}`,
              time: call.createdAt,
            }))}
          />
        )}

        {/* Callback Requests */}
        {data.callbackRequests.count > 0 && (
          <ActionSection
            icon={PhoneCall}
            title="Callback Requests"
            count={data.callbackRequests.count}
            variant="info"
            items={data.callbackRequests.calls.map((call) => ({
              id: call.id,
              label: `${call.petName} (${call.ownerName})`,
              sublabel: "Owner requested callback",
              href: `/dashboard/outbound/workflow/${call.caseId}`,
              time: call.endedAt,
            }))}
          />
        )}

        {/* Missing Contact Info */}
        {data.missingContact.count > 0 && (
          <ActionSection
            icon={UserX}
            title="Missing Contact Info"
            count={data.missingContact.count}
            variant="muted"
            items={data.missingContact.cases.map((c) => ({
              id: c.id,
              label: `${c.petName} (${c.ownerName})`,
              sublabel: "No phone or email on file",
              href: `/dashboard/outbound/workflow/${c.id}`,
              time: c.createdAt,
            }))}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface ActionItem {
  id: string;
  label: string;
  sublabel: string;
  badge?: string;
  href: string;
  time: string | null;
}

function ActionSection({
  icon: Icon,
  title,
  count,
  variant,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  variant: "critical" | "warning" | "info" | "muted";
  items: ActionItem[];
}) {
  const variantStyles: Record<
    "critical" | "warning" | "info" | "muted",
    { icon: string; badge: string; link: string }
  > = {
    critical: {
      icon: "bg-red-100 text-red-600",
      badge: "bg-red-100 text-red-700 border-red-200",
      link: "text-red-700 hover:text-red-800",
    },
    warning: {
      icon: "bg-amber-100 text-amber-600",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      link: "text-amber-700 hover:text-amber-800",
    },
    info: {
      icon: "bg-blue-100 text-blue-600",
      badge: "bg-blue-100 text-blue-700 border-blue-200",
      link: "text-blue-700 hover:text-blue-800",
    },
    muted: {
      icon: "bg-slate-100 text-slate-600",
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      link: "text-slate-700 hover:text-slate-800",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full",
            styles.icon,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-medium text-slate-700">{title}</span>
        <Badge variant="outline" className={cn("text-xs", styles.badge)}>
          {count}
        </Badge>
      </div>
      <div className="ml-8 space-y-1">
        {items.slice(0, 3).map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-white/50",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {item.label}
              </p>
              <p className="truncate text-xs text-slate-500">{item.sublabel}</p>
            </div>
            <div className="ml-2 flex items-center gap-2">
              {item.badge && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs capitalize",
                    item.badge === "critical" &&
                      "border-red-200 bg-red-50 text-red-700",
                    item.badge === "urgent" &&
                      "border-amber-200 bg-amber-50 text-amber-700",
                    item.badge === "routine" &&
                      "border-slate-200 bg-slate-50 text-slate-600",
                  )}
                >
                  {item.badge}
                </Badge>
              )}
              {item.time && (
                <span className="text-xs whitespace-nowrap text-slate-400">
                  {formatDistanceToNow(new Date(item.time), {
                    addSuffix: true,
                  })}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
            </div>
          </Link>
        ))}
        {count > 3 && (
          <Link
            href="/dashboard/outbound?filter=needs-attention"
            className={cn("text-sm font-medium", styles.link)}
          >
            View all {count} items
          </Link>
        )}
      </div>
    </div>
  );
}

function CriticalActionsAlertSkeleton() {
  return (
    <Card className="animate-pulse rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50/80 via-white/70 to-slate-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="ml-8 space-y-1">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
