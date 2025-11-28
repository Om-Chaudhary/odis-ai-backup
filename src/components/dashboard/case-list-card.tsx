"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
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
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CaseListItem } from "~/types/dashboard";
import { cn } from "~/lib/utils";

interface CaseListCardProps {
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

export function CaseListCard({ caseData }: CaseListCardProps) {
  const SpeciesIcon =
    caseData.patient.species?.toLowerCase() === "feline" ? Cat : Dog;

  return (
    <Card className="group transition-smooth relative overflow-hidden rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md hover:scale-[1.02] hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
      <CardContent className="overflow-hidden p-5">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors",
                getStatusIconBgColor(caseData.status),
              )}
            >
              <SpeciesIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-semibold tracking-tight text-slate-900">
                  {caseData.patient.name}
                </h3>
                {/* Status Dot */}
                <div
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    getStatusDotColor(caseData.status),
                  )}
                  title={`Status: ${caseData.status}`}
                />
                {/* Status and Source Badges */}
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  {getStatusBadge(caseData.status)}
                  {getSourceBadge(caseData.source)}
                </div>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
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

        {/* Owner Section */}
        <div className="-mx-2 mb-4 rounded-lg bg-slate-50 p-3">
          <div className="min-w-0 space-y-1.5">
            <span className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              Owner
            </span>
            <div className="truncate font-medium text-slate-900">
              {caseData.patient.owner_name}
            </div>
          </div>
        </div>

        {/* Workflow Indicators Section */}
        <div className="mb-4 min-h-[2.5rem]">
          <div className="flex flex-wrap items-center gap-2">
            {/* SOAP Note */}
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="flex shrink-0 items-center justify-center">
                {caseData.hasSoapNote ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-300" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <FileText className="h-3 w-3 shrink-0" />
                <span>SOAP</span>
              </div>
            </div>

            {/* Discharge Summary */}
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="flex shrink-0 items-center justify-center">
                {caseData.hasDischargeSummary ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-300" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <FileCheck className="h-3 w-3 shrink-0" />
                <span>Summary</span>
              </div>
            </div>

            {/* Discharge Call */}
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="flex shrink-0 items-center justify-center">
                {caseData.hasDischargeCall ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-300" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Phone className="h-3 w-3 shrink-0" />
                <span>Call</span>
              </div>
            </div>

            {/* Discharge Email */}
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="flex shrink-0 items-center justify-center">
                {caseData.hasDischargeEmail ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-300" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Mail className="h-3 w-3 shrink-0" />
                <span>Email</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-3 pl-5">
        <Link href={`/dashboard/cases/${caseData.id}`} className="w-full">
          <Button
            variant="outline"
            className="transition-smooth w-full gap-2 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
