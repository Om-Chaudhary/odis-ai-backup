"use client";

import { useRouter } from "next/navigation";
import { KPICardVisual } from "./kpi-card-visual";
import { COLORS } from "../charts/svg-charts";
import type { HeroMetrics } from "../../mock-data";

interface KPICardsRowProps {
  metrics: HeroMetrics;
  clinicSlug: string;
}

export function KPICardsRow({ metrics, clinicSlug }: KPICardsRowProps) {
  const router = useRouter();

  // Transform sparkline data from objects to simple number array
  const getSparkData = (data: Array<{ value: number }>) => data.map((d) => d.value);

  // Currency formatter
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KPICardVisual
        label="Calls Handled"
        value={metrics.callsHandled.value}
        change={`+${metrics.callsHandled.change}%`}
        subtitle="This month"
        sparkData={getSparkData(metrics.callsHandled.sparklineData)}
        color={COLORS.TEAL}
        onClick={() => router.push(`/dashboard/${clinicSlug}/inbound?outcome=all`)}
        delay={0.1}
      />
      <KPICardVisual
        label="Appointments Booked"
        value={metrics.appointmentsBooked.value}
        change={`+${metrics.appointmentsBooked.change}%`}
        subtitle="By AI agent"
        sparkData={getSparkData(metrics.appointmentsBooked.sparklineData)}
        color={COLORS.PURPLE}
        onClick={() => router.push(`/dashboard/${clinicSlug}/inbound?outcome=appointment`)}
        delay={0.2}
      />
      <KPICardVisual
        label="Revenue Captured"
        value={metrics.revenueCaptured.value}
        change={`+${metrics.revenueCaptured.change}%`}
        subtitle="From booked appointments"
        sparkData={getSparkData(metrics.revenueCaptured.sparklineData)}
        color={COLORS.ORANGE}
        format={formatCurrency}
        delay={0.3}
      />
      <KPICardVisual
        label="Staff Hours Saved"
        value={metrics.staffHoursSaved.value}
        change={`+${metrics.staffHoursSaved.change}%`}
        subtitle="Across all locations"
        sparkData={getSparkData(metrics.staffHoursSaved.sparklineData)}
        color={COLORS.PINK}
        suffix="h"
        delay={0.4}
      />
    </div>
  );
}
