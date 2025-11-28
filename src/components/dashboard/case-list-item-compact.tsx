"use client";

import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Dog,
  Cat,
  Eye,
  FileText,
  FileCheck,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CaseListItem } from "~/types/dashboard";
import { cn } from "~/lib/utils";

interface CaseListItemCompactProps {
  caseData: CaseListItem;
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

export function CaseListItemCompact({ caseData }: CaseListItemCompactProps) {
  const SpeciesIcon =
    caseData.patient.species?.toLowerCase() === "feline" ? Cat : Dog;

  // Get most recent activity timestamp
  const timestamps = [
    caseData.soapNoteTimestamp,
    caseData.dischargeSummaryTimestamp,
    caseData.dischargeCallTimestamp,
    caseData.dischargeEmailTimestamp,
  ].filter(Boolean) as string[];
  const mostRecentActivity =
    timestamps.length > 0
      ? new Date(Math.max(...timestamps.map((t) => new Date(t).getTime())))
      : new Date(caseData.created_at);

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
            {/* Patient Name */}
            <div className="mb-3">
              <h3 className="truncate text-base font-semibold text-slate-900">
                {caseData.patient.name}
              </h3>
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
              <Calendar className="h-3 w-3" />
              <span>
                {timestamps.length > 0
                  ? `Updated ${formatDistanceToNow(mostRecentActivity, { addSuffix: true })}`
                  : `Created ${formatDistanceToNow(new Date(caseData.created_at), { addSuffix: true })}`}
              </span>
            </div>
          </div>

          {/* Actions - Right Side - Aligned to top */}
          <div className="flex shrink-0 items-start pt-1">
            {/* View Details - Primary Action */}
            <Link href={`/dashboard/cases/${caseData.id}`}>
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 bg-[#31aba3] hover:bg-[#2a9a92]"
              >
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
