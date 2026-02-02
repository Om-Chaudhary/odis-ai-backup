"use client";

import { COLORS } from "../charts/svg-charts";
import type { AIPerformanceData } from "../../mock-data";

interface AIPerformanceTabProps {
  data: AIPerformanceData;
}

export function AIPerformanceTab({ data }: AIPerformanceTabProps) {
  // Format improvement text
  const formatImprovement = (comp: (typeof data.comparisons)[0]) => {
    if (comp.improvementType === "instant") {
      return `Instant`;
    }
    return comp.improvement;
  };

  // Calculate staff intervention percentage
  const staffInterventionRate = (100 - data.autonomyBanner.percentage).toFixed(
    1
  );

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
          AI Agent Performance
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          vs. staff benchmarks
        </div>
      </div>

      {/* Comparison cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {data.comparisons.map((comp, i) => (
          <div
            key={i}
            style={{
              padding: "16px",
              borderRadius: 12,
              background: "#f9fafb",
              border: "1px solid #f3f4f6",
            }}
          >
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
              {comp.metric}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>
                  Odis
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#111827",
                    letterSpacing: -0.5,
                  }}
                >
                  {comp.aiValue}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>
                  Staff
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: "#9ca3af",
                    textDecoration: "line-through",
                    textDecorationColor: "#d1d5db",
                  }}
                >
                  {comp.staffValue}
                </div>
              </div>
            </div>
            <div
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                background: COLORS.TEAL_BG,
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.TEAL,
                textAlign: "center",
              }}
            >
              {formatImprovement(comp)}
            </div>
          </div>
        ))}
      </div>

      {/* Autonomy summary - quantifiable stats */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderRadius: 10,
          background: COLORS.TEAL_BG,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.TEAL,
              letterSpacing: -0.5,
            }}
          >
            {data.autonomyBanner.percentage}%
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "#374151" }}>
              Fully Autonomous
            </div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              Calls resolved without escalation
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingLeft: 16,
            borderLeft: "1px solid #ccfbf1",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>
              {staffInterventionRate}%
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>Staff escalated</div>
          </div>
        </div>
      </div>
    </div>
  );
}
