"use client";

import type { CallOutcome, BookingData } from "../../inbound/types";
import { ScheduledAppointmentCard } from "./scheduled-appointment-card";
import { RescheduledAppointmentCard } from "./rescheduled-appointment-card";
import { CanceledAppointmentCard } from "./canceled-appointment-card";
import { InfoCard } from "./info-card";
import { EmergencyCard } from "./emergency-card";
import { CallbackCard } from "./callback-card";
import {
  getActionCardData,
  type ActionCardData,
  type LegacyCallData,
} from "./derive-action-card-data";

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
  /** Pre-computed action card data from VAPI (new calls) */
  action_card_data?: ActionCardData | null;
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
  /** Whether this card has been confirmed/dismissed */
  isConfirmed?: boolean;
  /** Callback when card is confirmed (only for confirmable cards) */
  onConfirm?: () => void;
  /** Whether confirm is in progress */
  isConfirming?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Action Card Selector
 *
 * Polymorphic component that selects and renders the appropriate
 * action card based on the call outcome type.
 *
 * Data sources (in order of preference):
 * 1. action_card_data - Pre-computed structured output from VAPI (new calls)
 * 2. Legacy fields - Derived from call_outcome_data, escalation_data, etc. (old calls)
 * 3. Booking data - From vapi_bookings table for appointment-related cards
 *
 * Confirm functionality is available for:
 * - Scheduled appointments
 * - Rescheduled appointments
 * - Cancelled appointments
 * - Callback requests
 *
 * Info and Emergency cards do NOT have confirm buttons.
 */
export function ActionCardSelector({
  call,
  booking,
  callerName,
  petName,
  isConfirmed,
  onConfirm,
  isConfirming,
  className,
}: ActionCardSelectorProps) {
  // Get action card data with fallback to legacy derivation
  const legacyCallData: LegacyCallData = {
    outcome: call.outcome,
    summary: call.summary,
    customer_phone: call.customer_phone,
    call_outcome_data: call.call_outcome_data,
    escalation_data: call.escalation_data,
    follow_up_data: call.follow_up_data,
  };

  const cardData = getActionCardData(call.action_card_data, legacyCallData, booking);

  // If no valid card data, don't render
  // Note: We now render confirmed cards with the "Confirmed" badge instead of hiding them
  if (!cardData) {
    return null;
  }

  // Legacy fallback data (used when action_card_data fields are incomplete)
  const outcomeSummary =
    call.call_outcome_data?.outcome_summary ?? call.summary ?? "";
  const keyTopics = call.call_outcome_data?.key_topics_discussed;
  const escalationSummary = call.escalation_data?.escalation_summary;
  const staffActionNeeded =
    call.escalation_data?.staff_action_needed ??
    call.escalation_data?.staff_action_required;
  const followUpSummary = call.follow_up_data?.follow_up_summary;
  const nextSteps = call.follow_up_data?.next_steps;

  switch (cardData.card_type) {
    case "scheduled":
      return (
        <ScheduledAppointmentCard
          booking={booking}
          outcomeSummary={
            cardData.appointment_data?.reason ?? outcomeSummary
          }
          petName={cardData.appointment_data?.patient_name ?? petName}
          onConfirm={isConfirmed ? undefined : onConfirm}
          isConfirming={isConfirming}
          isConfirmed={isConfirmed}
          className={className}
        />
      );

    case "rescheduled":
      return (
        <RescheduledAppointmentCard
          booking={booking}
          outcomeSummary={cardData.reschedule_reason ?? outcomeSummary}
          petName={cardData.appointment_data?.patient_name ?? petName}
          onConfirm={isConfirmed ? undefined : onConfirm}
          isConfirming={isConfirming}
          isConfirmed={isConfirmed}
          className={className}
        />
      );

    case "cancellation":
      return (
        <CanceledAppointmentCard
          booking={booking}
          outcomeSummary={cardData.cancellation_reason ?? outcomeSummary}
          petName={cardData.appointment_data?.patient_name ?? petName}
          onConfirm={isConfirmed ? undefined : onConfirm}
          isConfirming={isConfirming}
          isConfirmed={isConfirmed}
          className={className}
        />
      );

    case "emergency":
      return (
        <EmergencyCard
          escalationSummary={escalationSummary ?? outcomeSummary}
          outcomeSummary={outcomeSummary}
          staffActionNeeded={staffActionNeeded}
          keyTopics={cardData.emergency_data?.symptoms ?? keyTopics}
          petName={petName}
          // New: pass ER name directly when available
          erName={cardData.emergency_data?.er_name}
          className={className}
        />
      );

    case "callback":
      return (
        <CallbackCard
          escalationSummary={
            cardData.callback_data?.reason ?? escalationSummary ?? outcomeSummary
          }
          staffActionNeeded={staffActionNeeded}
          nextSteps={nextSteps}
          callerName={cardData.callback_data?.caller_name ?? callerName}
          petName={cardData.callback_data?.pet_name ?? petName}
          phoneNumber={cardData.callback_data?.phone_number ?? call.customer_phone}
          onConfirm={isConfirmed ? undefined : onConfirm}
          isConfirming={isConfirming}
          isConfirmed={isConfirmed}
          className={className}
        />
      );

    case "info":
      return (
        <InfoCard
          outcomeSummary={cardData.info_data?.summary ?? outcomeSummary}
          followUpSummary={followUpSummary}
          nextSteps={nextSteps}
          keyTopics={cardData.info_data?.topics ?? keyTopics}
          className={className}
        />
      );

    default:
      return null;
  }
}
