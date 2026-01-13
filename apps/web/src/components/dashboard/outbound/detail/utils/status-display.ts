/**
 * Centralized Status Display Utility
 *
 * Single source of truth for deriving and displaying channel (phone/email) delivery states.
 * Used by both the table and sidebar components for consistent status representation.
 */

import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  MinusCircle,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";

/**
 * Delivery status from the backend (matches types.ts DeliveryStatus)
 */
export type DeliveryStatus =
  | "sent"
  | "pending"
  | "failed"
  | "not_applicable"
  | null;

/**
 * Derived channel state for UI display
 * More granular than DeliveryStatus - distinguishes between scheduled vs pending
 */
export type ChannelState =
  | "not_applicable" // No contact info available
  | "not_sent" // Has contact info, but not scheduled
  | "scheduled" // Scheduled for future time
  | "pending" // Past scheduled time, waiting to execute
  | "in_progress" // Currently executing (call ringing/in progress)
  | "sent" // Successfully delivered
  | "failed"; // Failed to deliver

/**
 * Display configuration for a channel state
 */
export interface StatusDisplayConfig {
  label: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  showInCard: boolean;
}

/**
 * Derive the channel state from delivery status and scheduling info
 *
 * @param deliveryStatus - The delivery status from the backend
 * @param scheduledFor - ISO timestamp of when delivery is scheduled
 * @param hasContactInfo - Whether contact info exists for this channel
 * @returns The derived ChannelState
 */
export function deriveChannelState(
  deliveryStatus: DeliveryStatus,
  scheduledFor: string | null,
  hasContactInfo: boolean,
): ChannelState {
  // No contact info = not applicable
  if (!hasContactInfo) {
    return "not_applicable";
  }

  // Check actual delivery status first (trust the backend)
  if (deliveryStatus === "sent") {
    return "sent";
  }

  if (deliveryStatus === "failed") {
    return "failed";
  }

  if (deliveryStatus === "pending") {
    // Distinguish between future scheduled and past (ready to send)
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      const now = new Date();

      if (scheduledDate > now) {
        return "scheduled";
      }
      // Past scheduled time but still pending = waiting to execute
      return "pending";
    }
    // Pending but no scheduled time = in progress
    return "in_progress";
  }

  // No status = not scheduled yet
  if (deliveryStatus === null || deliveryStatus === "not_applicable") {
    return hasContactInfo ? "not_sent" : "not_applicable";
  }

  return "not_sent";
}

/**
 * Get display configuration for a channel state
 *
 * @param state - The channel state to get display config for
 * @param type - Whether this is for phone or email (affects default icon)
 * @returns Display configuration including icon, colors, and label
 */
export function getStatusDisplay(
  state: ChannelState,
  type: "phone" | "email" = "phone",
): StatusDisplayConfig {
  const defaultIcon = type === "phone" ? Phone : Mail;

  const configs: Record<ChannelState, StatusDisplayConfig> = {
    not_applicable: {
      label: "N/A",
      icon: MinusCircle,
      colorClass: "text-slate-400",
      bgClass: "bg-slate-100",
      showInCard: false,
    },
    not_sent: {
      label: "Not scheduled",
      icon: defaultIcon,
      colorClass: "text-slate-400",
      bgClass: "bg-slate-100",
      showInCard: false,
    },
    scheduled: {
      label: "Scheduled",
      icon: Clock,
      colorClass: "text-purple-600",
      bgClass: "bg-purple-100",
      showInCard: true,
    },
    pending: {
      label: "Pending",
      icon: AlertCircle,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-100",
      showInCard: true,
    },
    in_progress: {
      label: "In progress",
      icon: Loader2,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-100",
      showInCard: true,
    },
    sent: {
      label: "Delivered",
      icon: CheckCircle2,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-100",
      showInCard: true,
    },
    failed: {
      label: "Failed",
      icon: AlertCircle,
      colorClass: "text-red-600",
      bgClass: "bg-red-100",
      showInCard: true,
    },
  };

  return configs[state];
}

/**
 * Get color classes for status card backgrounds
 *
 * @param state - The channel state
 * @returns Object with gradient and border classes for cards
 */
export function getStatusCardColors(state: ChannelState): {
  gradient: string;
  border: string;
} {
  const colorMap: Record<ChannelState, { gradient: string; border: string }> = {
    not_applicable: {
      gradient: "from-slate-50/50 via-white/80 to-slate-50/50",
      border: "border-slate-200/50",
    },
    not_sent: {
      gradient: "from-slate-50/50 via-white/80 to-slate-50/50",
      border: "border-slate-200/50",
    },
    scheduled: {
      gradient:
        "from-purple-50/50 via-white/80 to-purple-50/50 dark:from-purple-950/30 dark:via-slate-900/80 dark:to-purple-950/30",
      border: "border-purple-200/50 dark:border-purple-800/50",
    },
    pending: {
      gradient:
        "from-amber-50/50 via-white/80 to-amber-50/50 dark:from-amber-950/30 dark:via-slate-900/80 dark:to-amber-950/30",
      border: "border-amber-200/50 dark:border-amber-800/50",
    },
    in_progress: {
      gradient:
        "from-blue-50/50 via-white/80 to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900/80 dark:to-blue-950/30",
      border: "border-blue-200/50 dark:border-blue-800/50",
    },
    sent: {
      gradient:
        "from-green-50/50 via-white/80 to-green-50/50 dark:from-green-950/30 dark:via-slate-900/80 dark:to-green-950/30",
      border: "border-green-200/50 dark:border-green-800/50",
    },
    failed: {
      gradient:
        "from-red-50/50 via-white/80 to-red-50/50 dark:from-red-950/30 dark:via-slate-900/80 dark:to-red-950/30",
      border: "border-red-200/50 dark:border-red-800/50",
    },
  };

  return colorMap[state];
}

/**
 * Get display configuration directly from DeliveryStatus
 * Simplified helper for table components that don't need scheduled/pending distinction
 *
 * @param status - The delivery status from the backend
 * @param type - Whether this is for phone or email
 * @returns Display configuration including icon, colors, and label
 */
export function getDeliveryStatusDisplay(
  status: DeliveryStatus,
  type: "phone" | "email" = "phone",
): StatusDisplayConfig {
  // Map DeliveryStatus to ChannelState for display
  let channelState: ChannelState;
  switch (status) {
    case "sent":
      channelState = "sent";
      break;
    case "pending":
      channelState = "pending";
      break;
    case "failed":
      channelState = "failed";
      break;
    case "not_applicable":
      channelState = "not_applicable";
      break;
    default:
      // null = not scheduled yet
      channelState = "not_sent";
      break;
  }
  return getStatusDisplay(channelState, type);
}
