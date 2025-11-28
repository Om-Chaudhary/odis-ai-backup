"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Dog,
  Cat,
  Eye,
  Calendar,
  FileText,
  FileCheck,
  Phone,
  Mail,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CaseListItem } from "~/types/dashboard";
import { cn } from "~/lib/utils";
import { QuickActionsMenu } from "~/components/dashboard/quick-actions-menu";

interface CaseListCardProps {
  caseData: CaseListItem;
  index?: number; // For staggered animations
}

function getSourceBadge(source: string | null) {
  const sourceMap: Record<
    string,
    { label: string; color: string; bgColor: string }
  > = {
    manual: {
      label: "Manual",
      color: "text-slate-700",
      bgColor: "bg-slate-100",
    },
    idexx_neo: {
      label: "IDEXX Neo",
      color: "text-blue-700",
      bgColor: "bg-blue-100",
    },
    cornerstone: {
      label: "Cornerstone",
      color: "text-purple-700",
      bgColor: "bg-purple-100",
    },
    ezyvet: {
      label: "ezyVet",
      color: "text-green-700",
      bgColor: "bg-green-100",
    },
    avimark: {
      label: "AVImark",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
    },
  };

  const sourceKey = source ?? "manual";
  const config = sourceMap[sourceKey] ?? sourceMap.manual!;

  return (
    <Badge
      className={cn(
        "rounded-md border-0 text-xs font-medium",
        config.bgColor,
        config.color,
      )}
    >
      {config.label}
    </Badge>
  );
}

function getStatusBadge(status: string) {
  const statusMap: Record<
    string,
    { label: string; color: string; bgColor: string }
  > = {
    draft: {
      label: "Draft",
      color: "text-slate-700",
      bgColor: "bg-slate-100",
    },
    ongoing: {
      label: "Ongoing",
      color: "text-blue-700",
      bgColor: "bg-blue-100",
    },
    completed: {
      label: "Completed",
      color: "text-emerald-700",
      bgColor: "bg-emerald-100",
    },
    reviewed: {
      label: "Reviewed",
      color: "text-purple-700",
      bgColor: "bg-purple-100",
    },
  };

  const statusKey = status ?? "draft";
  const config = statusMap[statusKey] ?? statusMap.draft!;

  return (
    <Badge
      className={cn(
        "rounded-md border-0 text-xs font-medium",
        config.bgColor,
        config.color,
      )}
    >
      {config.label}
    </Badge>
  );
}

function getStatusDotColor(status: string) {
  switch (status) {
    case "draft":
      return "bg-slate-500";
    case "ongoing":
      return "bg-blue-500";
    case "completed":
      return "bg-emerald-500";
    case "reviewed":
      return "bg-purple-500";
    default:
      return "bg-slate-500";
  }
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

export function CaseListCard({ caseData, index = 0 }: CaseListCardProps) {
  const SpeciesIcon =
    caseData.patient.species?.toLowerCase() === "feline" ? Cat : Dog;

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
        <div className="mb-4">
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
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1.5 truncate text-lg font-semibold text-slate-900">
                    {caseData.patient.name}
                  </h3>
                </div>
                {/* Quick Actions Menu */}
                <QuickActionsMenu
                  caseId={caseData.id}
                  hasSoapNote={caseData.hasSoapNote}
                  hasDischargeSummary={caseData.hasDischargeSummary}
                />
              </div>
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  Created{" "}
                  {formatDistanceToNow(new Date(caseData.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Section - Only show what exists, all horizontal */}
        {(caseData.hasSoapNote ||
          caseData.hasDischargeSummary ||
          caseData.hasDischargeCall ||
          caseData.hasDischargeEmail) && (
          <div>
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
              {caseData.hasSoapNote && (
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1.5 border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                >
                  <FileText className="h-3.5 w-3.5 text-emerald-600" />
                  SOAP
                </Badge>
              )}
              {caseData.hasDischargeSummary && (
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1.5 border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                >
                  <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Discharge
                </Badge>
              )}
              {caseData.hasDischargeCall && (
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1.5 border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  Call Sent
                </Badge>
              )}
              {caseData.hasDischargeEmail && (
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1.5 border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                >
                  <Mail className="h-3.5 w-3.5 text-emerald-600" />
                  Email Sent
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-slate-100 bg-slate-50/30 p-4">
        <Link href={`/dashboard/cases/${caseData.id}`} className="w-full">
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
