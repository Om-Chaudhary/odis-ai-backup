"use client";

import { FileText, ChevronRight } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { useOptionalClinic } from "@odis-ai/shared/ui/clinic-context";
import { Progress } from "@odis-ai/shared/ui";
import Link from "next/link";
import type { CaseCoverage } from "../types";

interface CaseCoverageCardProps {
  caseCoverage: CaseCoverage;
}

export function CaseCoverageCard({ caseCoverage }: CaseCoverageCardProps) {
  const clinicContext = useOptionalClinic();
  const clinicSlug = clinicContext?.clinicSlug ?? null;
  const casesUrl = clinicSlug
    ? `/dashboard/${clinicSlug}/outbound`
    : "/dashboard/outbound";

  const {
    totalCases,
    casesWithDischarge,
    casesWithSoap,
    dischargeCoveragePct,
    soapCoveragePct,
  } = caseCoverage;

  return (
    <div className="rounded-xl border border-stone-200/60 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-500">Case Coverage</h3>
        <div className="rounded-lg bg-violet-50 p-2">
          <FileText className="h-4 w-4 text-violet-600" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-3xl font-semibold text-slate-900 tabular-nums">
          {dischargeCoveragePct}%
        </p>
        <p className="text-sm text-slate-500">with discharge summaries</p>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Discharge Summaries</span>
          <span className="font-medium text-slate-900">
            {casesWithDischarge}/{totalCases}
          </span>
        </div>
        <Progress
          value={dischargeCoveragePct}
          className={cn(
            "mt-2 h-2",
            dischargeCoveragePct >= 80
              ? "[&>div]:bg-emerald-500"
              : dischargeCoveragePct >= 50
                ? "[&>div]:bg-amber-500"
                : "[&>div]:bg-red-500",
          )}
        />
      </div>

      <div className="mt-4 border-t border-stone-100 pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">SOAP Notes</span>
          <span className="font-medium text-slate-900">
            {casesWithSoap}/{totalCases}
          </span>
        </div>
        <Progress
          value={soapCoveragePct}
          className={cn(
            "mt-2 h-2",
            soapCoveragePct >= 80
              ? "[&>div]:bg-emerald-500"
              : soapCoveragePct >= 50
                ? "[&>div]:bg-amber-500"
                : "[&>div]:bg-red-500",
          )}
        />
        <p className="mt-1 text-xs text-slate-500">
          {soapCoveragePct}% coverage
        </p>
      </div>

      <Link
        href={casesUrl}
        className="mt-4 flex items-center gap-1 text-sm font-medium text-violet-600 transition-colors hover:text-violet-700"
      >
        View Cases
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
