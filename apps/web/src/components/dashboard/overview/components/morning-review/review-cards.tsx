"use client";

import { useRouter } from "next/navigation";
import { COLORS } from "../charts/svg-charts";
import type { NeedsReviewItem } from "../../mock-data";

interface ReviewCardsProps {
  items: NeedsReviewItem[];
  clinicSlug: string;
}

export function ReviewCards({ items, clinicSlug }: ReviewCardsProps) {
  const router = useRouter();

  const criticalCount = items.filter((i) => i.severity === "critical").length;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        padding: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
            Needs Review
          </span>
          {items.length > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: criticalCount > 0 ? "#fff" : COLORS.TEAL,
                background: criticalCount > 0 ? COLORS.RED : COLORS.TEAL_BG,
                padding: "2px 8px",
                borderRadius: 10,
              }}
            >
              {items.length}
            </span>
          )}
        </div>
        <button
          onClick={() =>
            router.push(`/dashboard/${clinicSlug}/outbound?view=needs_attention`)
          }
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: COLORS.TEAL,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          View all &rarr;
        </button>
      </div>

      {/* Review Items */}
      <div>
        {items.map((item, i) => {
          const isCritical = item.severity === "critical";

          return (
            <button
              key={item.id}
              onClick={() => router.push(`/dashboard/${clinicSlug}/outbound?view=needs_attention`)}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: `1px solid ${isCritical ? "#fecaca" : "#fef3c7"}`,
                background: isCritical ? "#fff5f5" : "#fffbeb",
                marginBottom: i < items.length - 1 ? 10 : 0,
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: isCritical ? "#dc2626" : "#d97706",
                    padding: "2px 7px",
                    borderRadius: 4,
                    background: isCritical ? "#fecaca" : "#fef3c7",
                  }}
                >
                  {isCritical ? "CRITICAL" : "PENDING"}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                  {item.petName}
                  {item.ownerName ? ` \u2014 ${item.ownerName}` : ""}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  lineHeight: 1.5,
                }}
              >
                {item.summary}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: isCritical ? "#dc2626" : "#d97706",
                  marginTop: 4,
                }}
              >
                &rarr; {item.action}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
