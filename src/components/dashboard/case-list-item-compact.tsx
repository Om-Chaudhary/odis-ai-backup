"use client";

import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Dog,
  Cat,
  FileText,
  FileCheck,
  Phone,
  Mail,
  Eye,
  Circle,
  CheckCircle2,
} from "lucide-react";
import type { CaseListItem } from "~/types/dashboard";
import { cn } from "~/lib/utils";

interface CaseListItemCompactProps {
  caseData: CaseListItem;
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

export function CaseListItemCompact({ caseData }: CaseListItemCompactProps) {
  const SpeciesIcon =
    caseData.patient.species?.toLowerCase() === "feline" ? Cat : Dog;

  return (
    <Card className="group transition-smooth rounded-xl border border-white/30 bg-white/85 shadow-md backdrop-blur-sm hover:bg-white/90 hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Patient Icon */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
              getStatusIconBgColor(caseData.status),
            )}
          >
            <SpeciesIcon className="h-5 w-5" />
          </div>

          {/* Patient & Owner Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-900">
                {caseData.patient.name}
              </h3>
              {getStatusBadge(caseData.status)}
              {getSourceBadge(caseData.source)}
            </div>
            <p className="mt-0.5 truncate text-sm text-slate-600">
              {caseData.patient.owner_name}
            </p>
          </div>

          {/* Workflow Indicators */}
          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <div className="flex items-center gap-1" title="SOAP Note">
              {caseData.hasSoapNote ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300" />
              )}
              <FileText className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="flex items-center gap-1" title="Discharge Summary">
              {caseData.hasDischargeSummary ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300" />
              )}
              <FileCheck className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="flex items-center gap-1" title="Discharge Call">
              {caseData.hasDischargeCall ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300" />
              )}
              <Phone className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="flex items-center gap-1" title="Discharge Email">
              {caseData.hasDischargeEmail ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300" />
              )}
              <Mail className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* View Button */}
          <div className="shrink-0">
            <Link href={`/dashboard/cases/${caseData.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">View</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
