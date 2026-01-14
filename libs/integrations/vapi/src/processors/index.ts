/**
 * VAPI Tool Processors
 *
 * Pure business logic functions for all VAPI tools.
 * These processors are framework-agnostic and easy to test.
 *
 * @module vapi/processors
 *
 * @example
 * ```typescript
 * import {
 *   processBookAppointment,
 *   processLeaveMessage,
 * } from "@odis-ai/integrations/vapi/processors";
 * ```
 */

// Appointments
export {
  processCheckAvailability,
  processBookAppointment,
  parseDateToISO,
  parseTimeToISO,
  formatTime12Hour,
} from "./appointments";

// Messaging
export { processLeaveMessage } from "./messaging";

// Triage
export { processLogEmergencyTriage } from "./triage";
