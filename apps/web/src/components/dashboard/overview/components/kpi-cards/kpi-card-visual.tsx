"use client";

import { Sparkline, AnimatedNumber, COLORS } from "../charts/svg-charts";

interface KPICardVisualProps {
  label: string;
  value: number;
  change: string;
  subtitle: string;
  sparkData: number[];
  color?: string;
  prefix?: string;
  suffix?: string;
  format?: (value: number) => string;
  onClick?: () => void;
  delay?: number;
}

export function KPICardVisual({
  label,
  value,
  change,
  subtitle,
  sparkData,
  color = COLORS.TEAL,
  prefix = "",
  suffix = "",
  format,
  onClick,
  delay = 0,
}: KPICardVisualProps) {
  return (
    <button
      onClick={onClick}
      className="metric-card"
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
        width: "100%",
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        fontFamily: "inherit",
        opacity: 0,
        transform: "translateY(12px)",
        animation: `fadeIn 0.6s ease forwards`,
        animationDelay: `${delay}s`,
      }}
    >
      {/* Header row: label + change badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 500, color: "#6b7280" }}>
          {label}
        </span>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: COLORS.TEAL,
            background: COLORS.TEAL_BG,
            padding: "2px 8px",
            borderRadius: 6,
          }}
        >
          {change}
        </div>
      </div>

      {/* Value row: number + sparkline */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: "#111827",
              letterSpacing: -1,
              lineHeight: 1,
            }}
          >
            <AnimatedNumber
              target={value}
              prefix={prefix}
              suffix={suffix}
              format={format}
              duration={1200}
            />
          </div>
          <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 6 }}>
            {subtitle}
          </div>
        </div>
        <Sparkline data={sparkData} color={color} width={100} height={36} />
      </div>

      {/* Bottom accent bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${color}, ${color}44)`,
        }}
      />
    </button>
  );
}
