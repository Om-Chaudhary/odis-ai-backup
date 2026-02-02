"use client";

import { COLORS } from "../charts/svg-charts";
import type { AfterHoursData } from "../../mock-data";

interface AfterHoursTabProps {
  data: AfterHoursData;
  clinicSlug: string;
}

// Map category names to display labels
const categoryLabels: Record<string, string> = {
  "Appointments Booked": "Appointments",
  "Callbacks Scheduled": "Callbacks",
  "Info Provided": "Info Requests",
  "ER Triage": "ER Triage",
};

export function AfterHoursTab({ data }: AfterHoursTabProps) {
  // Transform breakdown data with proper colors from reference
  const callBreakdown = data.breakdown.map((item) => ({
    label: categoryLabels[item.category] ?? item.category,
    count: item.count,
    pct: item.percentage,
    color: item.color,
  }));

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
          After-Hours Call Breakdown
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          {data.totalCalls} total this month
        </div>
      </div>

      {/* Stacked horizontal bar */}
      <div
        style={{
          display: "flex",
          height: 10,
          borderRadius: 5,
          overflow: "hidden",
          marginBottom: 18,
        }}
      >
        {callBreakdown.map((c, i) => (
          <div
            key={i}
            style={{
              width: `${c.pct}%`,
              background: c.color,
              transition: "width 0.6s ease-out",
            }}
          />
        ))}
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {callBreakdown.map((c, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 10,
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: c.color,
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                {c.count}{" "}
                <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>
                  ({c.pct}%)
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Success message */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 14px",
          borderRadius: 10,
          background: COLORS.TEAL_BG,
        }}
      >
        <span style={{ fontSize: 14 }}>&#127919;</span>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: COLORS.TEAL }}>
          {data.autonomyRate}% resolved without staff involvement
        </span>
      </div>
    </div>
  );
}
