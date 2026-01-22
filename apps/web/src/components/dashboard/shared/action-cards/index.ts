/**
 * Action Cards
 *
 * Outcome-specific cards for displaying call action items.
 * Each card type corresponds to a specific call outcome from VAPI.
 * Uses clean, utilitarian design with colored left accent bars.
 */

export { ActionCardSelector } from "./action-card-selector";
export { ScheduledAppointmentCard } from "./scheduled-appointment-card";
export { RescheduledAppointmentCard } from "./rescheduled-appointment-card";
export { CanceledAppointmentCard } from "./canceled-appointment-card";
export { EmergencyCard } from "./emergency-card";
export { InfoCard } from "./info-card";
export { CallbackCard } from "./callback-card";

// Base component for custom card implementations
export {
  SimpleCardBase,
  getCardVariantStyles,
  type CardVariant,
} from "./simple-card-base";

// Action card data utilities
export {
  getActionCardData,
  deriveActionCardData,
  type ActionCardData,
  type LegacyCallData,
} from "./derive-action-card-data";
