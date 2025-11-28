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
import { formatDistanceToNow } from "date-fns";
import type { CaseListItem } from "~/types/dashboard";
import { cn } from "~/lib/utils";

interface CaseListItemProps {
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
        "rounded-md border-0 font-medium",
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
        "rounded-md border-0 font-medium",
        config.bgColor,
        config.color,
      )}
    >
      {config.label}
    </Badge>
  );
}

export function CaseListItemComponent({ caseData }: CaseListItemProps) {
  const SpeciesIcon =
    caseData.patient.species?.toLowerCase() === "feline" ? Cat : Dog;

  return (
    <Card className="group rounded-xl border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Patient Info */}
          <div className="flex flex-1 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <SpeciesIcon className="h-6 w-6 text-slate-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  {caseData.patient.name}
                </h3>
                {getStatusBadge(caseData.status)}
                {getSourceBadge(caseData.source)}
              </div>
              <p className="text-sm text-slate-600">
                {caseData.patient.owner_name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Created{" "}
                {formatDistanceToNow(new Date(caseData.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          {/* Middle: Workflow Indicators */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-1">
              {caseData.hasSoapNote ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <Circle className="h-5 w-5 text-slate-300" />
              )}
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <FileText className="h-3 w-3" />
                <span>SOAP</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              {caseData.hasDischargeSummary ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <Circle className="h-5 w-5 text-slate-300" />
              )}
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <FileCheck className="h-3 w-3" />
                <span>Summary</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              {caseData.hasDischargeCall ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <Circle className="h-5 w-5 text-slate-300" />
              )}
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Phone className="h-3 w-3" />
                <span>Call</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              {caseData.hasDischargeEmail ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <Circle className="h-5 w-5 text-slate-300" />
              )}
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Mail className="h-3 w-3" />
                <span>Email</span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/cases/${caseData.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                View
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
