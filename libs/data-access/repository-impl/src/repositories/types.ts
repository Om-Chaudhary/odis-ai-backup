/**
 * Repository Type Definitions
 *
 * Domain model types for database tables used by repositories.
 * These types match the database schema for scheduled_discharge_calls,
 * scheduled_discharge_emails, and other tables.
 *
 * Note: These are temporary types until src/database.types.ts is regenerated.
 * Run `pnpm update-types` to sync with latest database schema.
 */

export interface ScheduledCall extends Record<string, unknown> {
  id: string;
  user_id: string;
  assistant_id: string;
  outbound_phone_number_id: string;
  customer_phone: string;
  scheduled_for: string;
  status: "queued" | "in-progress" | "completed" | "failed" | "canceled";
  vapi_call_id?: string | null;
  dynamic_variables: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ScheduledEmail extends Record<string, unknown> {
  id: string;
  user_id: string;
  recipient_email: string;
  recipient_name?: string | null;
  subject: string;
  html_content: string;
  plain_content?: string | null;
  scheduled_for: string;
  status: "queued" | "sent" | "failed" | "canceled";
  metadata: Record<string, unknown>;
  sent_at?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface User extends Record<string, unknown> {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  // Add other user fields as needed
}

/**
 * Call status types
 */
export type CallStatus =
  | "queued"
  | "in-progress"
  | "completed"
  | "failed"
  | "canceled";

/**
 * Email status types
 */
export type EmailStatus = "queued" | "sent" | "failed" | "canceled";

/**
 * Dynamic variables for VAPI calls
 */
export interface CallDynamicVariables {
  // Core identification
  pet_name?: string;
  owner_name?: string;
  vet_name?: string;

  // Clinic information
  clinic_name?: string;
  clinic_phone?: string;
  emergency_phone?: string;

  // Call context
  appointment_date?: string;
  call_type?: "discharge" | "follow-up";

  // Clinical details
  discharge_summary_content?: string;
  medications?: string;
  next_steps?: string;

  // Conditional fields
  sub_type?: "wellness" | "vaccination";
  condition?: string;
  recheck_date?: string;

  // Additional dynamic variables
  [key: string]: unknown;
}
