/**
 * VAPI Webhook Background Jobs
 *
 * Fire-and-forget async operations that run after webhook processing.
 * These jobs don't block the webhook response and handle failures silently.
 *
 * @module vapi/webhooks/background-jobs
 */

// Transcript cleaning
export {
  cleanTranscriptInBackground,
  cleanOutboundTranscript,
  cleanInboundTranscript,
  type TranscriptCleanerOptions,
} from "./transcript-cleaner";

// Appointment date extraction
export {
  extractAndUpdateAppointmentDate,
  extractAppointmentDateFromTranscript,
  type AppointmentExtractorOptions,
} from "./appointment-extractor";

// Slack notifications
export {
  notifyAlumRockAppointmentBooked,
  notifyAppointmentBooked,
  type AppointmentNotificationOptions,
} from "./slack-notifier";
