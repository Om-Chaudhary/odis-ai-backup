"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Phone, CheckCircle2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptionalClinic } from "@odis-ai/shared/ui/clinic-context";
import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import { api } from "~/trpc/client";
import { cn } from "@odis-ai/shared/util";
import {
  AttentionBadgeGroup,
  AttentionSeverityBadge,
  CriticalPulsingDot,
} from "~/components/dashboard/shared";

/**
 * OutboundNeedsAttentionCard - Dashboard card showing outbound calls flagged for attention
 *
 * Displays a compact preview of cases where the AI has flagged concerns
 * (health issues, callback requests, dissatisfaction, etc.) during discharge calls.
 */
export function OutboundNeedsAttentionCard() {
  const router = useRouter();
  const clinicContext = useOptionalClinic();
  const clinicSlug = clinicContext?.clinicSlug ?? null;

  // Build clinic-scoped URL
  const outboundUrl = clinicSlug
    ? `/dashboard/${clinicSlug}/outbound?viewMode=needs_attention`
    : "/dashboard/outbound?viewMode=needs_attention";

  // Fetch outbound cases that need attention (limited for dashboard preview)
  const { data: casesData, isLoading } =
    api.outbound.listDischargeCases.useQuery({
      viewMode: "needs_attention",
      page: 1,
      pageSize: 5,
    });

  // Get stats for the badge count
  const { data: stats } = api.outbound.getDischargeCaseStats.useQuery({});

  const cases = casesData?.cases ?? [];
  const needsAttentionCount = stats?.needsAttention ?? 0;

  return (
    <Card
      className="transition-smooth overflow-hidden border-orange-200/40 bg-gradient-to-br from-orange-50/30 via-white/70 to-white/70 shadow-lg shadow-orange-500/5 backdrop-blur-md hover:from-orange-50/40 hover:via-white/75 hover:to-white/75 hover:shadow-xl hover:shadow-orange-500/10"
      aria-label="Outbound calls needing attention"
      role="region"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-100">
              <Phone className="h-4 w-4 text-orange-600" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Outbound Calls Needing Attention
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Flagged concerns from discharge calls
              </CardDescription>
            </div>
          </div>
          {needsAttentionCount > 0 && (
            <Badge
              variant="outline"
              className="border-orange-400 bg-orange-50 text-xs font-semibold text-orange-700"
            >
              {needsAttentionCount}{" "}
              {needsAttentionCount === 1 ? "case" : "cases"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-orange-100 bg-orange-50/30 p-3"
              >
                <div className="h-5 w-16 animate-pulse rounded-full bg-orange-100" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-24 animate-pulse rounded bg-orange-100/60" />
                  <div className="h-3 w-32 animate-pulse rounded bg-orange-50" />
                </div>
                <div className="flex gap-1">
                  <div className="h-5 w-12 animate-pulse rounded-full bg-orange-100/40" />
                  <div className="h-5 w-12 animate-pulse rounded-full bg-orange-100/40" />
                </div>
              </div>
            ))}
          </div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              No calls need attention
            </p>
            <p className="mt-1 text-xs text-slate-500">
              All outbound discharge calls are looking good
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {cases.map((c) => {
              const severity = c.attentionSeverity ?? "routine";
              const isCritical = severity === "critical";

              return (
                <Link
                  key={c.id}
                  href={`/dashboard/outbound?viewMode=needs_attention&selectedCase=${c.id}`}
                  className={cn(
                    "group block rounded-lg border p-3 transition-all hover:shadow-sm",
                    isCritical
                      ? "border-red-200 bg-red-50/50 hover:border-red-300 hover:bg-red-50"
                      : "border-orange-200 bg-orange-50/40 hover:border-orange-300 hover:bg-orange-50",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Severity indicator */}
                    <div className="flex flex-shrink-0 items-center gap-1.5 pt-0.5">
                      {isCritical && <CriticalPulsingDot />}
                      <AttentionSeverityBadge severity={severity} size="sm" />
                    </div>

                    {/* Patient info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {c.patient.name}
                        </p>
                        {c.patient.species && (
                          <span className="text-xs text-slate-500">
                            {c.patient.species}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-600">
                        {c.owner.name ?? "Unknown Owner"}
                      </p>
                      {c.attentionSummary && (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {c.attentionSummary}
                        </p>
                      )}
                    </div>

                    {/* Concerns badges */}
                    <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                      <AttentionBadgeGroup
                        types={c.attentionTypes ?? []}
                        maxVisible={2}
                        size="sm"
                      />
                      {c.attentionFlaggedAt && (
                        <span className="text-xs text-slate-400">
                          {formatDistanceToNow(parseISO(c.attentionFlaggedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Action Button */}
        {(cases.length > 0 || needsAttentionCount > 0) && (
          <div className="border-t border-orange-200/50 pt-3">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full gap-2 border-orange-400 text-xs font-medium text-orange-700 hover:bg-orange-50 hover:shadow-sm"
              onClick={() => {
                router.push(outboundUrl);
              }}
              aria-label="View all cases needing attention"
            >
              View All Attention Cases
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
