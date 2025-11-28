/**
 * Feature Flags Configuration
 *
 * Centralized feature flags using Vercel Flags SDK
 * See: https://flags-sdk.dev/
 */

import { flag } from "flags/next";

/**
 * Enable voicemail detection and automatic message leaving for VAPI calls
 *
 * NOTE: This flag is now managed per-user in the database (users.voicemail_detection_enabled).
 * The value is fetched from the database in the execute-call route.
 *
 * To toggle this flag:
 * - Use the toggle in /dashboard/cases
 * - Or update the users table directly
 *
 * When enabled:
 * - VAPI will detect voicemail systems automatically
 * - Leave a personalized message using dynamic variables
 * - End the call after leaving the message
 *
 * When disabled:
 * - VAPI will attempt the call normally without voicemail detection
 * - If it reaches voicemail, the call may just end or continue based on assistant prompt
 */
export const enableVoicemailDetection = flag({
  key: "enable-voicemail-detection",
  description:
    "Enable automatic voicemail detection and message leaving (per-user setting)",
  defaultValue: false,
  decide() {
    // This flag is now managed per-user in the database
    // See users.voicemail_detection_enabled column
    // The execute-call route fetches this value from the database
    return false;
  },
});
