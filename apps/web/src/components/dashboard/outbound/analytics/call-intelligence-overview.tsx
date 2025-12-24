"use client";

/**
 * Call Intelligence Overview
 *
 * Summary dashboard showing key metrics from call intelligence
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import {
  Brain,
  AlertOctagon,
  CalendarPlus,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { CallOutcomesChart } from "./call-outcomes-chart";
import { PetRecoveryChart } from "./pet-recovery-chart";
import { MedicationComplianceGauge } from "./medication-compliance-gauge";
import { OwnerSentimentChart } from "./owner-sentiment-chart";

interface CallIntelligenceData {
  callOutcomes: Record<string, number>;
  petRecoveryStatuses: Record<string, number>;
  medicationComplianceStatuses: Record<string, number>;
  ownerSentiments: Record<string, number>;
  escalationsTriggered: number;
  appointmentsRequested: number;
  followUpCallsNeeded: number;
  recheckConfirmed: number;
}

interface CallIntelligenceOverviewProps {
  data: CallIntelligenceData | null;
  totalCompletedCalls: number;
}

interface MetricCardProps {
  icon: typeof Brain;
  label: string;
  value: number;
  total?: number;
  color: string;
  bgColor: string;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  total,
  color,
  bgColor,
}: MetricCardProps) {
  const percentage =
    total && total > 0 ? Math.round((value / total) * 100) : null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white/60 p-3 dark:border-slate-800 dark:bg-slate-900/60">
      <div className={cn("rounded-lg p-2", bgColor)}>
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">
          {value}
          {percentage !== null && (
            <span className="ml-1 text-sm font-normal text-slate-500">
              ({percentage}%)
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export function CallIntelligenceOverview({
  data,
  totalCompletedCalls,
}: CallIntelligenceOverviewProps) {
  if (!data) {
    return null;
  }

  // Check if any data is available
  const hasCallOutcomes = Object.keys(data.callOutcomes).length > 0;
  const hasPetRecovery = Object.keys(data.petRecoveryStatuses).length > 0;
  const hasMedicationCompliance =
    Object.keys(data.medicationComplianceStatuses).length > 0;
  const hasOwnerSentiment = Object.keys(data.ownerSentiments).length > 0;
  const hasMetrics =
    data.escalationsTriggered > 0 ||
    data.appointmentsRequested > 0 ||
    data.followUpCallsNeeded > 0 ||
    data.recheckConfirmed > 0;

  const hasAnyData =
    hasCallOutcomes ||
    hasPetRecovery ||
    hasMedicationCompliance ||
    hasOwnerSentiment ||
    hasMetrics;

  if (!hasAnyData) {
    return null;
  }

  return (
    <Card className="border-slate-200/50 bg-gradient-to-br from-indigo-50/50 via-white/80 to-purple-50/50 backdrop-blur-sm dark:border-slate-700/50 dark:from-indigo-950/30 dark:via-slate-900/80 dark:to-purple-950/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
            <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">
              Call Intelligence Analytics
            </h3>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
              AI-powered insights from {totalCompletedCalls} completed calls
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Row */}
        {hasMetrics && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={AlertOctagon}
              label="Escalations"
              value={data.escalationsTriggered}
              total={totalCompletedCalls}
              color="text-red-600"
              bgColor="bg-red-100"
            />
            <MetricCard
              icon={CalendarPlus}
              label="Appointments Requested"
              value={data.appointmentsRequested}
              total={totalCompletedCalls}
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
            <MetricCard
              icon={Phone}
              label="Follow-Up Needed"
              value={data.followUpCallsNeeded}
              total={totalCompletedCalls}
              color="text-amber-600"
              bgColor="bg-amber-100"
            />
            <MetricCard
              icon={CheckCircle2}
              label="Rechecks Confirmed"
              value={data.recheckConfirmed}
              total={totalCompletedCalls}
              color="text-green-600"
              bgColor="bg-green-100"
            />
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {hasCallOutcomes && <CallOutcomesChart data={data.callOutcomes} />}
          {hasPetRecovery && (
            <PetRecoveryChart data={data.petRecoveryStatuses} />
          )}
          {hasMedicationCompliance && (
            <MedicationComplianceGauge
              data={data.medicationComplianceStatuses}
            />
          )}
          {hasOwnerSentiment && (
            <OwnerSentimentChart data={data.ownerSentiments} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
