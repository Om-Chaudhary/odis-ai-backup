"use client";

import type { CallOutcome, BookingData } from "../../inbound/types";
import { ScheduledAppointmentCard } from "./scheduled-appointment-card";
import { CanceledAppointmentCard } from "./canceled-appointment-card";
import { InfoCard } from "./info-card";
import { EmergencyCard } from "./emergency-card";
import { CallbackCard } from "./callback-card";

/**
 * Call outcome data from VAPI structured output
 */
interface CallOutcomeData {
  call_outcome?: string;
  outcome_summary?: string;
  key_topics_discussed?: string[] | string;
}

/**
 * Escalation data from VAPI structured output
 */
interface EscalationData {
  escalation_triggered?: boolean;
  escalation_summary?: string;
  escalation_type?: string;
  staff_action_needed?: string;
  staff_action_required?: string;
}

/**
 * Follow-up data from VAPI structured output
 */
interface FollowUpData {
  follow_up_needed?: boolean;
  follow_up_summary?: string;
  appointment_status?: string;
  next_steps?: string;
}

interface InboundCallData {
  id: string;
  outcome?: CallOutcome | null;
  summary?: string | null;
  structured_data?: Record<string, unknown> | null;
  call_outcome_data?: CallOutcomeData | null;
  escalation_data?: EscalationData | null;
  follow_up_data?: FollowUpData | null;
  /** Customer phone number */
  customer_phone?: string | null;
}

interface ActionCardSelectorProps {
  /** The inbound call data */
  call: InboundCallData;
  /** Booking data from vapi_bookings table */
  booking?: BookingData | null;
  /** Caller name if resolved externally */
  callerName?: string | null;
  /** Pet name if resolved externally */
  petName?: string | null;
  /** Callback when appointment is confirmed */
  onConfirmAppointment?: (callId: string) => void;
  /** Whether confirm is in progress */
  isConfirming?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Normalize outcome string to match our expected values
 */
function normalizeOutcome(outcome: string | null | undefined): CallOutcome | null {
  if (!outcome) return null;

  const lower = outcome.toLowerCase().trim();

  // Map various outcome strings to our canonical values
  if (lower === "scheduled" || lower === "appointment") return "scheduled";
  if (lower === "rescheduled") return "rescheduled";
  if (lower === "cancellation" || lower === "cancelled" || lower === "canceled")
    return "cancellation";
  if (lower === "callback" || lower === "call back" || lower === "message_taken")
    return "callback";
  if (lower === "emergency" || lower === "urgent_concern") return "emergency";
  if (lower === "info" || lower === "information") return "info";
  if (lower === "blank" || lower === "null" || lower === "voicemail") return null;

  return outcome as CallOutcome;
}

/**
 * Action Card Selector
 *
 * Polymorphic component that selects and renders the appropriate
 * action card based on the call outcome type, using VAPI structured data
 * and booking data from vapi_bookings table.
 */
export function ActionCardSelector({
  call,
  booking,
  callerName,
  petName,
  onConfirmAppointment,
  isConfirming,
  className,
}: ActionCardSelectorProps) {
  const {
    outcome,
    call_outcome_data,
    escalation_data,
    follow_up_data,
  } = call;

  // Normalize the outcome
  const normalizedOutcome = normalizeOutcome(outcome);

  // If no valid outcome, don't render anything
  if (!normalizedOutcome) {
    return null;
  }

  // Extract common data
  const outcomeSummary =
    call_outcome_data?.outcome_summary ?? call.summary ?? "";
  const keyTopics = call_outcome_data?.key_topics_discussed;
  const nextSteps = follow_up_data?.next_steps;
  const followUpSummary = follow_up_data?.follow_up_summary;
  const escalationSummary = escalation_data?.escalation_summary;
  const staffActionNeeded =
    escalation_data?.staff_action_needed ??
    escalation_data?.staff_action_required;

  switch (normalizedOutcome) {
    case "scheduled":
    case "rescheduled":
      return (
        <ScheduledAppointmentCard
          booking={booking}
          outcomeSummary={outcomeSummary}
          petName={petName}
          onConfirm={
            onConfirmAppointment
              ? () => onConfirmAppointment(call.id)
              : undefined
          }
          isConfirming={isConfirming}
          className={className}
        />
      );

    case "cancellation":
      return (
        <CanceledAppointmentCard
          booking={booking}
          outcomeSummary={outcomeSummary}
          petName={petName}
          className={className}
        />
      );

    case "emergency":
      return (
        <EmergencyCard
          escalationSummary={escalationSummary ?? outcomeSummary}
          outcomeSummary={outcomeSummary}
          staffActionNeeded={staffActionNeeded}
          keyTopics={keyTopics}
          petName={petName}
          className={className}
        />
      );

    case "callback":
      return (
        <CallbackCard
          escalationSummary={escalationSummary ?? outcomeSummary}
          staffActionNeeded={staffActionNeeded}
          nextSteps={nextSteps}
          callerName={callerName}
          petName={petName}
          phoneNumber={call.customer_phone}
          className={className}
        />
      );

    case "info":
      return (
        <InfoCard
          outcomeSummary={outcomeSummary}
          followUpSummary={followUpSummary}
          nextSteps={nextSteps}
          keyTopics={keyTopics}
          className={className}
        />
      );

    default:
      // Unknown outcome type - don't render anything
      return null;
  }
}
