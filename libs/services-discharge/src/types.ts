/**
 * Discharge Executor Types
 *
 * Types for the modular discharge execution system.
 * These types define the results returned by executor functions.
 */

import type { SupabaseClientType } from "@odis-ai/types/supabase";

/* ========================================
   Call Execution Types
   ======================================== */

/**
 * Result of executing a scheduled call
 */
export interface CallExecutionResult {
  /** Whether the execution was successful */
  success: boolean;

  /** The scheduled call ID from the database */
  callId: string;

  /** VAPI call ID (if call was initiated) */
  vapiCallId?: string;

  /** Current status of the call */
  status?: string;

  /** Error message if execution failed */
  error?: string;

  /** Whether the call was already processed (prevents double execution) */
  alreadyProcessed?: boolean;
}

/* ========================================
   Email Execution Types
   ======================================== */

/**
 * Result of executing a scheduled email
 */
export interface EmailExecutionResult {
  /** Whether the execution was successful */
  success: boolean;

  /** The scheduled email ID from the database */
  emailId: string;

  /** Resend email ID (if email was sent) */
  resendEmailId?: string;

  /** Error message if execution failed */
  error?: string;

  /** Whether the email was already processed (prevents double execution) */
  alreadyProcessed?: boolean;
}

/* ========================================
   Executor Dependencies
   ======================================== */

/**
 * Dependencies for executor functions
 * Used for dependency injection in tests
 */
export interface ExecutorDependencies {
  supabase: SupabaseClientType;
}
