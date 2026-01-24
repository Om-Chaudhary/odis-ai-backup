/**
 * Status Mapping Utilities
 * Maps PIMS appointment statuses to case statuses
 */

import type { Database } from "@odis-ai/shared/types";

type CaseStatus = Database["public"]["Enums"]["CaseStatus"];
type CaseType = Database["public"]["Enums"]["CaseType"];

/**
 * Status mapping from PIMS appointment statuses to CaseStatus
 * Maps to existing CaseStatus enum: reviewed | ongoing | completed | draft
 */
const APPOINTMENT_STATUS_MAP: Record<string, CaseStatus> = {
  scheduled: "draft",
  confirmed: "draft",
  "checked-in": "ongoing",
  "in-progress": "ongoing",
  completed: "completed",
  discharged: "completed",
  cancelled: "reviewed",
  "no-show": "reviewed",
};

/**
 * Type mapping from PIMS appointment types to CaseType
 * Maps to existing CaseType enum: checkup | emergency | surgery | follow_up
 */
const APPOINTMENT_TYPE_MAP: Record<string, CaseType> = {
  exam: "checkup",
  checkup: "checkup",
  "well-visit": "checkup",
  wellness: "checkup",
  vaccination: "checkup",
  vaccine: "checkup",
  surgery: "surgery",
  dental: "surgery",
  emergency: "emergency",
  urgent: "emergency",
  "follow-up": "follow_up",
  recheck: "follow_up",
  diagnostic: "checkup",
  consultation: "checkup",
};

/**
 * Normalize a status/type string for consistent matching
 */
function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[_\s]+/g, "-");
}

/**
 * Map PIMS appointment status to case status
 */
export function mapAppointmentStatus(status: string): CaseStatus {
  const normalized = normalizeKey(status);
  return APPOINTMENT_STATUS_MAP[normalized] ?? "draft";
}

/**
 * Map PIMS appointment type to case type
 */
export function mapAppointmentType(type: string | null): CaseType {
  if (!type) return "checkup";
  const normalized = normalizeKey(type);
  return APPOINTMENT_TYPE_MAP[normalized] ?? "checkup";
}
