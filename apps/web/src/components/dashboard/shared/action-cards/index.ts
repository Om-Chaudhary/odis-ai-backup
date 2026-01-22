/**
 * Action Cards
 *
 * Outcome-specific cards for displaying call action items.
 * Each card type corresponds to a specific call outcome from VAPI.
 * Uses editorial magazine-style design with structured key-value display.
 */

export { ActionCardSelector } from "./action-card-selector";
export { ScheduledAppointmentCard } from "./scheduled-appointment-card";
export { CanceledAppointmentCard } from "./canceled-appointment-card";
export { EmergencyCard } from "./emergency-card";
export { InfoCard } from "./info-card";
export { CallbackCard } from "./callback-card";

// Editorial base components (for custom card implementations)
export {
  EditorialCardBase,
  EditorialHeader,
  EditorialFieldList,
  EditorialActionButton,
  EditorialStatusBadge,
  getEditorialVariantStyles,
  type EditorialVariant,
  type FieldItem,
} from "./editorial";

// Action card data utilities
export {
  getActionCardData,
  deriveActionCardData,
  type ActionCardData,
  type LegacyCallData,
} from "./derive-action-card-data";
