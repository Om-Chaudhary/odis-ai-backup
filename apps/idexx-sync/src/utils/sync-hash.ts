/**
 * Sync Hash Utility
 *
 * Creates deterministic hashes for IDEXX appointment data to detect changes.
 * Used to efficiently identify which appointments have been modified since last sync.
 */

import { createHash } from "crypto";
import type { ScrapedAppointment } from "../types";

/**
 * Fields used for hash calculation.
 * Changes to any of these fields will result in a different hash.
 */
const HASH_FIELDS: (keyof ScrapedAppointment)[] = [
  "date",
  "start_time",
  "end_time",
  "patient_name",
  "client_name",
  "client_phone",
  "provider_name",
  "appointment_type",
  "status",
];

/**
 * Calculate a deterministic SHA256 hash for an appointment.
 * The hash is based on key fields that, if changed, indicate the appointment was modified.
 *
 * @param appointment - The scraped appointment data
 * @returns SHA256 hash as a hex string
 */
export function calculateSyncHash(appointment: ScrapedAppointment): string {
  // Build a deterministic string from relevant fields
  const hashInput = HASH_FIELDS.map((field) => {
    const value = appointment[field];
    return value === null || value === undefined ? "" : String(value).trim();
  }).join("|");

  return createHash("sha256").update(hashInput).digest("hex");
}

/**
 * Compare two appointments to determine if they've changed.
 *
 * @param current - Current appointment from IDEXX
 * @param existingHash - Hash from the database
 * @returns true if the appointment has changed
 */
export function hasAppointmentChanged(
  current: ScrapedAppointment,
  existingHash: string | null,
): boolean {
  if (!existingHash) {
    return true; // No existing hash means it's new
  }
  return calculateSyncHash(current) !== existingHash;
}
