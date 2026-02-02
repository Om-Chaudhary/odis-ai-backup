"use client";

import { MiniDonut, COLORS } from "../charts/svg-charts";
import type { DischargeData } from "../../mock-data";

interface DischargeTabProps {
  data: DischargeData;
  clinicSlug: string;
}

// Status card configuration
const statusCards = [
  { key: "Critical Flags", bg: "#fef2f2", color: COLORS.RED },
  { key: "Voicemails", bg: "#eff6ff", color: COLORS.BLUE },
  { key: "Rechecks Booked", bg: "#fef3c7", color: COLORS.ORANGE },
  { key: "All Clear", bg: COLORS.TEAL_BG, color: COLORS.TEAL },
];

export function DischargeTab({ data }: DischargeTabProps) {
  // Get outcome by status name
  const getOutcome = (status: string) =>
    data.outcomes.find((o) => o.status === status);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
          Discharge Follow-up Performance
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          {data.thisWeek.period} &middot; {data.thisWeek.totalPatients} patients
        </div>
      </div>

      {/* Gauge row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 16,
        }}
      >
        {/* Reach rate */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <MiniDonut
              value={data.reachRate.reached}
              total={data.reachRate.total}
              color={COLORS.TEAL}
              size={64}
              strokeWidth={6}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 14,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {data.reachRate.percentage}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
              {data.reachRate.reached}/{data.reachRate.total}
            </div>
            <div style={{ fontSize: 12.5, color: "#6b7280" }}>
              Patients reached by phone
            </div>
          </div>
        </div>

        {/* Compliance rate */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <MiniDonut
              value={data.complianceRate.compliant}
              total={data.complianceRate.reached}
              color={COLORS.PURPLE}
              size={64}
              strokeWidth={6}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 14,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {data.complianceRate.percentage}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
              {data.complianceRate.compliant}/{data.complianceRate.reached}
            </div>
            <div style={{ fontSize: 12.5, color: "#6b7280" }}>
              Confirmed medication compliance
            </div>
          </div>
        </div>
      </div>

      {/* Status cards */}
      <div style={{ display: "flex", gap: 8 }}>
        {statusCards.map((config, i) => {
          const outcome = getOutcome(config.key);
          if (!outcome) return null;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                background: config.bg,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: config.color }}>
                {outcome.count}
              </div>
              <div style={{ fontSize: 11, color: config.color, fontWeight: 500 }}>
                {outcome.status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
