"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter } from "@odis-ai/ui/card";
import { Button } from "@odis-ai/ui/button";
import {
  Dog,
  Cat,
  Eye,
  Calendar,
  FileText,
  FileCheck,
  Phone,
  Mail,
  Database,
  FileCode,
  Star,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CaseListItem } from "@odis-ai/types";
import { cn } from "@odis-ai/utils";
import { QuickActionsMenu } from "../shared/quick-actions-menu";
import { Badge } from "@odis-ai/ui/badge";
import { api } from "~/trpc/client";

interface CaseListCardProps {
  caseData: CaseListItem;
  index?: number; // For staggered animations
  onStarToggle?: () => void; // Callback to refresh data after starring
}

function getStatusIconBgColor(status: string) {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-600";
    case "ongoing":
      return "bg-blue-100 text-blue-600";
    case "completed":
      return "bg-emerald-100 text-emerald-600";
    case "reviewed":
      return "bg-purple-100 text-purple-600";
    default:
      return "bg-slate-100 text-slate-500";
  }
}

function formatSource(source: string | null): string {
  if (!source) return "Manual";
  return source
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getSourceIcon(source: string | null) {
  if (!source) return FileCode;
  if (source.includes("idexx")) return Database;
  return FileCode;
}

function getTypeColor(type: string | null): string {
  switch (type) {
    case "checkup":
      return "bg-blue-500/10 text-blue-600 border-blue-200";
    case "emergency":
      return "bg-red-500/10 text-red-600 border-red-200";
    case "surgery":
      return "bg-purple-500/10 text-purple-600 border-purple-200";
    case "follow_up":
      return "bg-green-500/10 text-green-600 border-green-200";
    default:
      return "bg-slate-500/10 text-slate-600 border-slate-200";
  }
}

function formatType(type: string | null): string {
  if (!type) return "Unknown";
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function CaseListCard({
  caseData,
  index = 0,
  onStarToggle,
}: CaseListCardProps) {
  const SpeciesIcon =
    caseData.patient.species?.toLowerCase() === "feline" ? Cat : Dog;

  const utils = api.useUtils();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const toggleStarMutation = api.dashboard.toggleStarred.useMutation({
    onSuccess: () => {
      // Invalidate the cases query to refetch data
      void utils.dashboard.getAllCases.invalidate();
      onStarToggle?.();
    },
  });

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    toggleStarMutation.mutate({
      caseId: caseData.id,
      starred: !caseData.is_starred,
    });
  };

  // Determine animation delay class based on index
  const animationClass =
    index === 0
      ? "animate-card-in"
      : index === 1
        ? "animate-card-in-delay-1"
        : index === 2
          ? "animate-card-in-delay-2"
          : "animate-card-in-delay-3";

  return (
    <Card
      className={cn(
        "group transition-smooth relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md",
        animationClass,
      )}
    >
      <CardContent className="overflow-hidden p-5">
        {/* Header Section */}
        <div
          className={
            caseData.hasSoapNote ||
            caseData.hasDischargeSummary ||
            caseData.hasDischargeCall ||
            caseData.hasDischargeEmail
              ? "mb-4"
              : "mb-3"
          }
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors",
                getStatusIconBgColor(caseData.status),
              )}
            >
              <SpeciesIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <button
                    onClick={handleStarClick}
                    disabled={toggleStarMutation.isPending}
                    className={cn(
                      "transition-smooth mt-0.5 shrink-0 rounded p-1 hover:bg-slate-100",
                      toggleStarMutation.isPending && "opacity-50",
                    )}
                    title={
                      caseData.is_starred ? "Remove star" : "Star this case"
                    }
                  >
                    <Star
                      className={cn(
                        "h-5 w-5 transition-colors",
                        caseData.is_starred
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-400 hover:text-amber-400",
                      )}
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1.5 truncate text-lg font-semibold text-slate-900">
                      {caseData.patient.name}
                    </h3>
                    {caseData.patient.owner_name && (
                      <p className="mb-1.5 truncate text-xs text-slate-500">
                        {caseData.patient.owner_name}
                      </p>
                    )}
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      {caseData.source && (
                        <Badge
                          variant="outline"
                          className="h-5 gap-1 border-slate-200 bg-slate-50/50 px-1.5 text-[10px] font-medium text-slate-600"
                        >
                          {(() => {
                            const SourceIcon = getSourceIcon(caseData.source);
                            return (
                              <>
                                <SourceIcon className="h-2.5 w-2.5" />
                                {formatSource(caseData.source)}
                              </>
                            );
                          })()}
                        </Badge>
                      )}
                      {caseData.type && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-5 border px-1.5 text-[10px] font-medium",
                            getTypeColor(caseData.type),
                          )}
                        >
                          {formatType(caseData.type)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {/* Quick Actions Menu */}
                <QuickActionsMenu
                  caseId={caseData.id}
                  hasSoapNote={caseData.hasSoapNote}
                  hasDischargeSummary={caseData.hasDischargeSummary}
                  patientName={caseData.patient.name}
                />
              </div>
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {caseData.scheduled_at ? (
                    <>
                      Scheduled{" "}
                      {formatDistanceToNow(new Date(caseData.scheduled_at), {
                        addSuffix: true,
                      })}
                    </>
                  ) : (
                    "Not scheduled"
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Indicators - Only show if there's content */}
        {(caseData.hasSoapNote ||
          caseData.hasDischargeSummary ||
          caseData.hasDischargeCall ||
          caseData.hasDischargeEmail) && (
          <div className="mb-4 flex flex-col gap-2">
            {caseData.hasSoapNote && (
              <div className="flex items-center gap-1.5 rounded-md border border-blue-200/60 bg-blue-50/50 px-2 py-1.5 text-xs font-medium text-blue-700">
                <FileText className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                <span>SOAP Note</span>
              </div>
            )}
            {caseData.hasDischargeSummary && (
              <div className="flex items-center gap-1.5 rounded-md border border-teal-200/60 bg-teal-50/50 px-2 py-1.5 text-xs font-medium text-teal-700">
                <FileCheck className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                <span>Discharge Summary</span>
              </div>
            )}
            {caseData.hasDischargeCall && (
              <div className="flex items-center gap-1.5 rounded-md border border-indigo-200/60 bg-indigo-50/50 px-2 py-1.5 text-xs font-medium text-indigo-700">
                <Phone className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                <span>Call Sent</span>
              </div>
            )}
            {caseData.hasDischargeEmail && (
              <div className="flex items-center gap-1.5 rounded-md border border-amber-200/60 bg-amber-50/50 px-2 py-1.5 text-xs font-medium text-amber-700">
                <Mail className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>Email Sent</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-slate-100 bg-slate-50/30 p-4">
        <Link href={`/admin/discharges/${caseData.id}`} className="w-full">
          <Button
            variant="outline"
            size="sm"
            className="transition-smooth w-full gap-2 hover:bg-white"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
