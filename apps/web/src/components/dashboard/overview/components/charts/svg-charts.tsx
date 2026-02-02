"use client";

import { useEffect, useState, useId } from "react";

// Design Tokens from reference
const COLORS = {
  TEAL: "#0d9488",
  TEAL_BG: "#f0fdfa",
  TEAL_LIGHT: "#14b8a6",
  RED: "#ef4444",
  ORANGE: "#f59e0b",
  BLUE: "#3b82f6",
  PURPLE: "#6366f1",
  PINK: "#ec4899",
};

export { COLORS };

// ============================================================
// SPARKLINE - Pure SVG sparkline with gradient fill
// ============================================================

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  color = COLORS.TEAL,
  width = 100,
  height = 36,
}: SparklineProps) {
  const id = useId();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pts = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`
    )
    .join(" ");

  const gradientId = `sg-${id.replace(/:/g, "")}`;

  return (
    <svg
      width={width}
      height={height}
      style={{ display: "block", opacity: animate ? 1 : 0, transition: "opacity 0.4s ease" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${pts} ${width},${height}`}
        fill={`url(#${gradientId})`}
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: animate ? "none" : "1000",
          strokeDashoffset: animate ? 0 : 1000,
          transition: "stroke-dashoffset 1s ease-out",
        }}
      />
    </svg>
  );
}

// ============================================================
// MINI DONUT - SVG circular progress/gauge
// ============================================================

interface MiniDonutProps {
  value: number;
  total: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
}

export function MiniDonut({
  value,
  total,
  color = COLORS.TEAL,
  size = 64,
  strokeWidth = 6,
}: MiniDonutProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? value / total : 0;

  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={c}
        strokeDashoffset={animate ? c * (1 - pct) : c}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
      />
    </svg>
  );
}

// ============================================================
// ANIMATED NUMBER - Counter animation
// ============================================================

interface AnimatedNumberProps {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  format?: (value: number) => string;
}

export function AnimatedNumber({
  target,
  prefix = "",
  suffix = "",
  duration = 1000,
  format,
}: AnimatedNumberProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * eased);

      setValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  const displayValue = format ? format(value) : value.toLocaleString();

  return (
    <span>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

// ============================================================
// PILL BADGE - Colored pill badge
// ============================================================

interface PillBadgeProps {
  children: React.ReactNode;
  color?: string;
  bgColor?: string;
}

export function PillBadge({
  children,
  color = COLORS.TEAL,
  bgColor = COLORS.TEAL_BG,
}: PillBadgeProps) {
  return (
    <div
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        color,
        background: bgColor,
        padding: "2px 8px",
        borderRadius: 6,
        display: "inline-block",
      }}
    >
      {children}
    </div>
  );
}
