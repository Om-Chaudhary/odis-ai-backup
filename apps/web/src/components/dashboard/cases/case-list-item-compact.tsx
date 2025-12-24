"use client";

import Link from "next/link";
import { Card, CardContent } from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Dog,
  Cat,
  Eye,
  FileText,
  FileCheck,
  Phone,
  Mail,
  Calendar,
  Database,
  FileCode,
  Star,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CaseListItem } from "@odis-ai/shared/types";
import { cn } from "@odis-ai/shared/util";
import { QuickActionsMenu } from "../shared/quick-actions-menu";
import { Badge } from "@odis-ai/shared/ui/badge";
import { api } from "~/trpc/client";

interface CaseListItemCompactProps {
  caseData: CaseListItem;
  onStarToggle?: () => void; // Callback to refresh data after starring
}

function getStatusIconBgColor(status: string) {
  switch (status) {
    case "draft":
      return "bg-slate-200 text-slate-700";
    case "ongoing":
      return "bg-blue-200 text-blue-700";
    case "completed":
      return "bg-emerald-200 text-emerald-700";
    case "reviewed":
      return "bg-purple-200 text-purple-700";
    default:
      return "bg-slate-200 text-slate-600";
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

export function CaseListItemCompact({
  caseData,
  onStarToggle,
}: CaseListItemCompactProps) {
  const SpeciesIcon =
    caseData.patient.species?.toLowerCase() === "feline" ? Cat : Dog;

  const utils = api.useUtils();
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
    toggleStarMutation.mutate({
      caseId: caseData.id,
      starred: !caseData.is_starred,
    });
  };

  // Prioritize scheduled_at for date display

  return (
    <Card className="group transition-smooth rounded-lg border border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Patient Icon - Larger with status-based colors */}
          <div
            className={cn(
              "flex h-16 w-16 shrink-0 items-center justify-center rounded-lg transition-colors",
              getStatusIconBgColor(caseData.status),
            )}
          >
            <SpeciesIcon className="h-8 w-8" />
          </div>

          {/* Main Content Area */}
          <div className="min-w-0 flex-1">
            {/* Patient Name with Star */}
            <div className="mb-1.5 flex items-start gap-2">
              <button
                onClick={handleStarClick}
                disabled={toggleStarMutation.isPending}
                className={cn(
                  "transition-smooth mt-0.5 shrink-0 rounded p-0.5 hover:bg-slate-100",
                  toggleStarMutation.isPending && "opacity-50",
                )}
                title={caseData.is_starred ? "Remove star" : "Star this case"}
              >
                <Star
                  className={cn(
                    "h-4 w-4 transition-colors",
                    caseData.is_starred
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-400 hover:text-amber-400",
                  )}
                />
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-slate-900">
                  {caseData.patient.name}
                </h3>
                {caseData.patient.owner_name && (
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {caseData.patient.owner_name}
                  </p>
                )}
              </div>
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
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

            {/* Content Indicators - Horizontal for list view, only render border if there are indicators */}
            {(caseData.hasSoapNote ||
              caseData.hasDischargeSummary ||
              caseData.hasDischargeCall ||
              caseData.hasDischargeEmail) && (
              <div className="mb-3 border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {caseData.hasSoapNote && (
                    <div className="flex items-center gap-1.5 rounded-md border border-blue-200/60 bg-blue-50/50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                      <span>SOAP Note</span>
                    </div>
                  )}
                  {caseData.hasDischargeSummary && (
                    <div className="flex items-center gap-1.5 rounded-md border border-teal-200/60 bg-teal-50/50 px-2 py-0.5 text-xs font-medium text-teal-700">
                      <FileCheck className="h-3.5 w-3.5 text-teal-600" />
                      <span>Discharge Summary</span>
                    </div>
                  )}
                  {caseData.hasDischargeCall && (
                    <div className="flex items-center gap-1.5 rounded-md border border-indigo-200/60 bg-indigo-50/50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      <Phone className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Call Sent</span>
                    </div>
                  )}
                  {caseData.hasDischargeEmail && (
                    <div className="flex items-center gap-1.5 rounded-md border border-amber-200/60 bg-amber-50/50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <Mail className="h-3.5 w-3.5 text-amber-600" />
                      <span>Email Sent</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date Info */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>
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

          {/* Actions - Right Side - Aligned to top */}
          <div className="flex shrink-0 items-start gap-2 pt-1">
            {/* View Details - Primary Action */}
            <Link href={`/dashboard/outbound/${caseData.id}`}>
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 bg-[#31aba3] hover:bg-[#2a9a92]"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">View</span>
              </Button>
            </Link>
            {/* Quick Actions Menu */}
            <QuickActionsMenu
              caseId={caseData.id}
              hasSoapNote={caseData.hasSoapNote}
              hasDischargeSummary={caseData.hasDischargeSummary}
              patientName={caseData.patient.name}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
