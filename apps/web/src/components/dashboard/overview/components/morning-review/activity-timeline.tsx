"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Voicemail,
  Phone,
  Info,
} from "lucide-react";
import type { LiveActivityItem } from "../../mock-data";

interface ActivityTimelineProps {
  activities: LiveActivityItem[];
  onActivityClick?: (id: string) => void;
}

interface ActivityItemProps {
  title: string;
  subtitle: string;
  time: string;
  status?: string;
  statusColor?: string;
  iconColor?: string;
  icon?: React.ReactNode;
  delay: number;
  onClick?: () => void;
}

/**
 * Maps activity type to icon and color
 */
function getActivityIcon(type: string): { icon: React.ReactNode; color: string } {
  switch (type) {
    case "appointment_rescheduled":
      return {
        icon: <Calendar size={16} />,
        color: "#10b981", // emerald
      };
    case "emergency_flagged":
      return {
        icon: <AlertTriangle size={16} />,
        color: "#f97316", // orange
      };
    case "followup_complete":
      return {
        icon: <CheckCircle2 size={16} />,
        color: "#10b981", // emerald
      };
    case "voicemail_left":
      return {
        icon: <Voicemail size={16} />,
        color: "#6b7280", // gray
      };
    case "callback_requested":
      return {
        icon: <Phone size={16} />,
        color: "#f59e0b", // amber
      };
    default:
      return {
        icon: <Info size={16} />,
        color: "#3b82f6", // blue
      };
  }
}

/**
 * Maps activity type to a clean display label
 */
function getActivityLabel(type: string, petName: string): string {
  switch (type) {
    case "appointment_rescheduled":
      return `${petName} - Appointment`;
    case "emergency_flagged":
      return `${petName} - ER Triage`;
    case "followup_complete":
      return `${petName} - Follow-up`;
    case "voicemail_left":
      return `${petName} - Voicemail`;
    case "callback_requested":
      return `${petName} - Callback`;
    default:
      return `${petName} - Activity`;
  }
}

function ActivityItem({
  title,
  subtitle,
  time,
  status,
  statusColor,
  iconColor,
  icon,
  delay,
  onClick,
}: ActivityItemProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 0",
        borderBottom: "1px solid #f1f5f9",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "all 0.4s ease-out",
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        cursor: onClick ? "pointer" : "default",
        fontFamily: "inherit",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${iconColor}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: iconColor,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "#1e293b",
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#94a3b8",
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {subtitle}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{time}</div>
        {status && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: statusColor,
              marginTop: 3,
              padding: "2px 8px",
              borderRadius: 6,
              background: `${statusColor}14`,
              display: "inline-block",
            }}
          >
            {status}
          </div>
        )}
      </div>
    </button>
  );
}

export function ActivityTimeline({
  activities,
  onActivityClick,
}: ActivityTimelineProps) {
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
      {/* Header with Live indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="pulse-dot" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
            Live Activity
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>Auto-updating</div>
      </div>

      {/* Activity List */}
      <div>
        {activities.map((activity, index) => {
          const { icon, color } = getActivityIcon(activity.type);
          return (
            <ActivityItem
              key={activity.id}
              title={getActivityLabel(activity.type, activity.petName)}
              subtitle={`${activity.ownerName} \u2014 ${activity.summary}`}
              time={activity.timestamp}
              status={activity.status}
              statusColor={activity.statusColor}
              icon={icon}
              iconColor={color}
              delay={index * 100}
              onClick={() => onActivityClick?.(activity.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
