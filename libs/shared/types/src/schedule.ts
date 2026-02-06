/**
 * Schedule and Business Hours Types
 */

/**
 * Configuration for a single day's business hours
 */
export interface DayHoursConfig {
  /** Whether the clinic is open on this day */
  enabled: boolean;
  /** Opening time in HH:MM format (e.g., "09:00") - required if enabled is true */
  open?: string;
  /** Closing time in HH:MM format (e.g., "17:00") - required if enabled is true */
  close?: string;
}

/**
 * Per-day business hours configuration
 * Keys are day numbers: 0=Sunday, 1=Monday, ..., 6=Saturday
 *
 * Example:
 * {
 *   "0": { "enabled": false },                                    // Sunday closed
 *   "1": { "enabled": true, "open": "09:00", "close": "17:00" },  // Monday 9-5
 *   "2": { "enabled": true, "open": "09:00", "close": "17:00" },  // Tuesday 9-5
 *   "3": { "enabled": true, "open": "09:00", "close": "17:00" },  // Wednesday 9-5
 *   "4": { "enabled": true, "open": "09:00", "close": "17:00" },  // Thursday 9-5
 *   "5": { "enabled": true, "open": "09:00", "close": "17:00" },  // Friday 9-5
 *   "6": { "enabled": true, "open": "10:00", "close": "15:00" }   // Saturday 10-3 (different hours!)
 * }
 */
export type DailyHours = Record<string, DayHoursConfig>;

// ============================================================================
// Time Range Scheduling Types (V2)
// ============================================================================

/**
 * Represents a time range with start and end timestamps
 */
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Appointment source types
 */
export type AppointmentSource = "idexx" | "vapi" | "manual";

/**
 * Appointment status types
 */
export type AppointmentStatus =
  | "scheduled"
  | "in_progress"
  | "finalized"
  | "cancelled"
  | "no_show";

/**
 * V2 Appointment using time ranges instead of separate start/end times
 * Maps to schedule_appointments_v2 table
 */
export interface ScheduleAppointmentV2 {
  id: string;
  clinicId: string;
  timeRange: TimeRange;
  date: string; // YYYY-MM-DD (derived from time range)
  source: AppointmentSource;
  neoAppointmentId?: string;
  patientName?: string;
  clientName?: string;
  clientPhone?: string;
  providerName?: string;
  roomId?: string;
  appointmentType?: string;
  status: AppointmentStatus;
  syncHash?: string;
  lastSyncedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * VAPI Booking status
 */
export type VapiBookingStatus = "pending" | "confirmed" | "cancelled";

/**
 * V2 VAPI Booking using time ranges
 * Maps to vapi_bookings_v2 table
 */
export interface VapiBookingV2 {
  id: string;
  clinicId: string;
  timeRange: TimeRange;
  date: string;
  clientName: string;
  clientPhone: string;
  patientName: string;
  species?: string;
  breed?: string;
  reason?: string;
  isNewClient: boolean;
  status: VapiBookingStatus;
  confirmationNumber?: string;
  vapiCallId?: string;
  holdExpiresAt?: Date;
  hasConflict: boolean;
  originalTimeRange?: TimeRange;
  rescheduledAt?: Date;
  rescheduledReason?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * V2 Availability slot returned by get_available_slots_v2
 */
export interface AvailabilitySlotV2 {
  slotStart: Date;
  slotEnd: Date;
  capacity: number;
  bookedCount: number;
  availableCount: number;
  isBlocked: boolean;
  blockReason?: string;
}

/**
 * Result of check_availability_v2 function
 */
export interface AvailabilityCheckResultV2 {
  isAvailable: boolean;
  capacity: number;
  bookedCount: number;
  availableCount: number;
  isBlocked: boolean;
  blockReason?: string;
}

/**
 * Result of book_appointment_with_hold_v2 function
 */
export interface BookingResultV2 {
  success: boolean;
  bookingId?: string;
  confirmationNumber?: string;
  timeRange?: TimeRange;
  error?: string;
  alternatives?: Array<{ start: Date; end: Date }>;
}

/**
 * Input for creating a V2 appointment
 */
export interface CreateAppointmentV2Input {
  clinicId: string;
  startTime: Date;
  endTime: Date;
  source?: AppointmentSource;
  neoAppointmentId?: string;
  patientName?: string;
  clientName?: string;
  clientPhone?: string;
  providerName?: string;
  roomId?: string;
  appointmentType?: string;
  status?: AppointmentStatus;
  syncHash?: string;
}

/**
 * Input for booking an appointment via VAPI (V2)
 */
export interface BookAppointmentV2Input {
  clinicId: string;
  startTime: Date;
  endTime: Date;
  clientName: string;
  clientPhone: string;
  patientName: string;
  species?: string;
  reason?: string;
  isNewClient?: boolean;
  vapiCallId?: string;
  holdMinutes?: number;
}
