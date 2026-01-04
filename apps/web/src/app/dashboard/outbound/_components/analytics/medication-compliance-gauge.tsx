"use client";

/**
 * Medication Compliance Gauge
 *
 * Circular gauge showing medication compliance rate
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Pill, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface MedicationComplianceGaugeProps {
  data: Record<string, number>;
}

export function MedicationComplianceGauge({
  data,
}: MedicationComplianceGaugeProps) {
  // Filter to only meaningful statuses
  const meaningfulData = Object.entries(data).filter(
    ([key]) => key !== "not_applicable" && key !== "not_discussed",
  );
  const total = meaningfulData.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) {
    return null;
  }

  const compliantCount = data.compliant ?? 0;
  const partialCount = data.partial ?? 0;
  const nonCompliantCount = data.non_compliant ?? 0;

  // Calculate compliance rate
  const complianceRate = Math.round((compliantCount / total) * 100);

  // SVG gauge properties
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (complianceRate / 100) * circumference;

  return (
    <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/80">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <div className="rounded-md bg-purple-100 p-1.5 dark:bg-purple-900/50">
            <Pill className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          Medication Compliance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Circular gauge */}
        <div className="flex justify-center">
          <div className="relative">
            <svg className="h-28 w-28 -rotate-90 transform">
              {/* Background circle */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-100 dark:text-slate-800"
              />
              {/* Progress circle */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="text-green-500 transition-all duration-500"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {complianceRate}%
              </span>
              <span className="text-xs text-slate-500">Compliant</span>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-lg font-bold text-green-600">{compliantCount}</p>
            <p className="text-xs text-slate-500">Compliant</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-lg font-bold text-amber-600">{partialCount}</p>
            <p className="text-xs text-slate-500">Partial</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-lg font-bold text-red-600">
              {nonCompliantCount}
            </p>
            <p className="text-xs text-slate-500">Non-Compliant</p>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Total Discussed
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {total}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
