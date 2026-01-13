/**
 * Types for Activity Timeline Component
 */

export type TimelineEventStatus =
  | "not_started"
  | "scheduled"
  | "completed"
  | "failed";

export type TimelineChannel = "email" | "phone";

export type TimelineActionType = "schedule" | "send_now" | "cancel" | "retry";

export interface TimelineEventMetadata {
  // Email metadata
  sentAt?: string;

  // Call metadata
  completedAt?: string;
  duration?: number;
  endedReason?: string;
}

export interface TimelineEventAction {
  type: TimelineActionType;
  enabled: boolean;
  handler: () => void;
}

export interface TimelineEvent {
  id: string;
  channel: TimelineChannel;
  status: TimelineEventStatus;
  timestamp?: string; // ISO date for scheduled/completed
  metadata?: TimelineEventMetadata;
  actions: TimelineEventAction[];
  canSchedule: boolean; // Has contact info
  contactInfo: string | null; // Phone or email
}

export interface ChannelSchedulerProps {
  channel: TimelineChannel;
  contactInfo: string | null;
  isEnabled: boolean;
  onToggle: (checked: boolean) => void;
  isSubmitting: boolean;
}
