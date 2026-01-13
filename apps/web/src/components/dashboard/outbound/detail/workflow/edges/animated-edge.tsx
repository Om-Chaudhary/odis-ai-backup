"use client";

import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export type EdgeStatus = "completed" | "pending" | "failed" | "preview";

interface AnimatedEdgeData {
  status?: EdgeStatus;
  animated?: boolean;
  label?: string;
}

const edgeColors: Record<EdgeStatus, string> = {
  completed: "#10b981", // emerald-500
  pending: "#f59e0b", // amber-500
  failed: "#ef4444", // red-500
  preview: "#94a3b8", // slate-400
};

/**
 * Custom animated edge with status-based styling.
 * Shows animated dots flowing along the edge path.
 */
function AnimatedEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const edgeData = data as unknown as AnimatedEdgeData;
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const status = edgeData?.status ?? "completed";
  const animated = edgeData?.animated ?? status === "pending";
  const strokeColor = edgeColors[status];

  return (
    <>
      {/* Background path (wider, for hover area) */}
      <path
        id={`${id}-background`}
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
      />

      {/* Animated dots path (behind main edge) */}
      {animated && (
        <path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeDasharray="4 4"
          className="animate-dash"
          style={{
            animation: "dash 1s linear infinite",
          }}
        />
      )}

      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: 2,
          opacity: status === "preview" ? 0.5 : 1,
        }}
      />

      {/* Animated flowing dot */}
      {animated && (
        <circle r={3} fill={strokeColor}>
          <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}

      {/* CSS for dash animation */}
      <style>
        {`
          @keyframes dash {
            to {
              stroke-dashoffset: -8;
            }
          }
          .animate-dash {
            animation: dash 0.5s linear infinite;
          }
        `}
      </style>
    </>
  );
}

export const AnimatedEdge = memo(AnimatedEdgeComponent);
