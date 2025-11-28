"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
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

        {/* Content Indicators - Vertical stack for card view, always render to maintain consistent spacing */}
        <div className="min-h-[120px]">
          <div className="flex flex-col gap-2">
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
        </div>
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
