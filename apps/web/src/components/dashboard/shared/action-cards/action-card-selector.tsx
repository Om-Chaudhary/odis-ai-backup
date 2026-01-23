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
  const nextSteps = call.follow_up_data?.next_steps;

  switch (cardData.card_type) {
    case "scheduled":
      return (
        <ScheduledAppointmentCard
          booking={booking}
          appointmentDate={cardData.appointment_data?.date}
          appointmentTime={cardData.appointment_data?.time}
          appointmentReason={cardData.appointment_data?.reason}
          outcomeSummary={outcomeSummary}
          onConfirm={isConfirmed ? undefined : onConfirm}
          isConfirming={isConfirming}
          isConfirmed={isConfirmed}
          className={className}
        />
      );

    case "rescheduled": {
      // Check both new location (appointment_data) and legacy location (root)
      const rescheduleReason =
        cardData.appointment_data?.reschedule_reason ??
        cardData.reschedule_reason;
      const originalAppointment =
        cardData.appointment_data?.original_appointment ??
        cardData.original_appointment;

      return (
        <RescheduledAppointmentCard
          booking={booking}
          appointmentDate={cardData.appointment_data?.date}
          appointmentTime={cardData.appointment_data?.time}
          originalDate={originalAppointment?.date}
          originalTime={originalAppointment?.time}
          rescheduleReason={rescheduleReason}
          outcomeSummary={outcomeSummary}
          onConfirm={isConfirmed ? undefined : onConfirm}
          isConfirming={isConfirming}
          isConfirmed={isConfirmed}
          className={className}
        />
      );
    }

    case "cancellation": {
      // Check both new location (appointment_data) and legacy location (root)
      const cancellationReason =
        cardData.appointment_data?.cancellation_reason ??
        cardData.cancellation_reason;

      return (
        <CanceledAppointmentCard
          booking={booking}
          appointmentDate={cardData.appointment_data?.date}
          appointmentTime={cardData.appointment_data?.time}
          cancellationReason={cancellationReason}
          outcomeSummary={outcomeSummary}
          onConfirm={isConfirmed ? undefined : onConfirm}
          isConfirming={isConfirming}
          isConfirmed={isConfirmed}
          className={className}
        />
      );
    }

    case "emergency":
      return (
        <EmergencyCard
          escalationSummary={escalationSummary ?? outcomeSummary}
          keyTopics={cardData.emergency_data?.symptoms ?? keyTopics}
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
          reason={cardData.info_data?.reason}
          outcomeSummary={cardData.info_data?.summary ?? outcomeSummary}
          keyTopics={cardData.info_data?.topics ?? keyTopics}
          className={className}
        />
      );

    default:
      return null;
  }
}
