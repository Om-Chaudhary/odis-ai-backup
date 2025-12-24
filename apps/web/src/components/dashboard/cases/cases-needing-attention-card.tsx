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
import { AlertTriangle, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { api } from "~/trpc/client";
import { EmptyState } from "@odis-ai/shared/ui";
import { cn } from "@odis-ai/shared/util";

interface CasesNeedingAttentionCardProps {
  casesNeedingDischarge: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  casesNeedingSoap: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
}

export function CasesNeedingAttentionCard({
  casesNeedingDischarge,
  casesNeedingSoap,
}: CasesNeedingAttentionCardProps) {
  const router = useRouter();
  const { data: casesNeedingAttention, isLoading } =
    api.dashboard.getCasesNeedingAttention.useQuery({ limit: 5 });

  return (
    <Card
      className="animate-card-in-delay-1 transition-smooth border-amber-200/40 bg-gradient-to-br from-amber-50/20 via-white/70 to-white/70 shadow-lg shadow-amber-500/5 backdrop-blur-md hover:from-amber-50/25 hover:via-white/75 hover:to-white/75 hover:shadow-xl hover:shadow-amber-500/10"
      aria-label="Cases needing attention"
      role="region"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="h-5 w-5 text-amber-600"
              aria-hidden="true"
            />
            <CardTitle className="text-base font-semibold text-slate-900">
              Cases Needing Attention
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className="border-amber-500 bg-amber-50 text-xs font-medium text-amber-700"
          >
            {casesNeedingDischarge.total + casesNeedingSoap.total} total
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-600">
          Cases missing contact information needed for discharge
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-500">Loading cases...</p>
          </div>
        ) : !casesNeedingAttention || casesNeedingAttention.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No cases need attention"
            description="All cases are up to date"
            size="sm"
            className="min-h-[200px]"
          />
        ) : (
          <div className="space-y-2.5">
            {casesNeedingAttention
              .filter((c): c is NonNullable<typeof c> => c !== null)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/outbound/${c.id}`}
                  className="block rounded-lg border border-amber-200 bg-amber-50/50 p-3 transition-all hover:border-amber-300 hover:bg-amber-50 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {c.patient?.name || "Unknown Patient"}
                        </p>
                        {c.patient?.species && (
                          <span className="text-xs font-normal text-slate-500">
                            {c.patient.species}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {(() => {
                          const ownerName = c.patient?.owner_name;
                          if (
                            !ownerName ||
                            ownerName === "null" ||
                            ownerName === "undefined" ||
                            ownerName.trim() === ""
                          ) {
                            return "No owner name";
                          }
                          return ownerName;
                        })()}
                      </p>
                      {!c.patient?.owner_phone && !c.patient?.owner_email && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          Missing phone and email
                        </p>
                      )}
                      {c.patient?.owner_phone && !c.patient?.owner_email && (
                        <p className="mt-1 text-xs font-medium text-amber-600">
                          Missing email
                        </p>
                      )}
                      {!c.patient?.owner_phone && c.patient?.owner_email && (
                        <p className="mt-1 text-xs font-medium text-amber-600">
                          Missing phone
                        </p>
                      )}
                      <div className="mt-1.5">
                        <Badge
                          variant="outline"
                          className="h-5 border-red-400 bg-red-100/50 px-1.5 text-xs font-medium text-red-700"
                        >
                          <Phone className="mr-1 h-3 w-3" />
                          Missing Contact Info
                        </Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                          c.status === "ongoing"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-slate-50 text-slate-700",
                        )}
                      >
                        {c.status ?? "unknown"}
                      </span>
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(c.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}

        {/* Action Button */}
        <div className="border-t border-amber-200 pt-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full border-amber-500 text-xs font-medium text-amber-700 hover:bg-amber-50 hover:shadow-sm"
            onClick={() => {
              router.push("/dashboard?tab=cases");
            }}
            aria-label="View all cases"
          >
            View All Cases
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
