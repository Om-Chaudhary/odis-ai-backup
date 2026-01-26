/**
 * Appointment Processors
 *
 * Business logic for appointment-related tools.
 *
 * Read Operations (query local DB):
 * - processCheckAvailability
 * - processCheckAvailabilityRange
 * - processVerifyAppointment
 *
 * Write Operations (update local DB + queue IDEXX jobs):
 * - processBookAppointment
 * - processCancelAppointment
 * - processRescheduleAppointment
 */

// Read operations
export { processCheckAvailability } from "./check-availability";
export { processCheckAvailabilityRange } from "./check-availability-range";
export { processVerifyAppointment } from "./verify-appointment";

// Write operations
export {
  processBookAppointment,
  parseDateToISO,
  parseTimeToISO,
  formatTime12Hour,
} from "./book-appointment";
export { processCancelAppointment } from "./cancel-appointment";
export { processRescheduleAppointment } from "./reschedule-appointment";
