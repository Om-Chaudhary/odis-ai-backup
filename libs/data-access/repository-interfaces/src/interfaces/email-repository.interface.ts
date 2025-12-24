/**
 * Email Repository Interface
 *
 * Contract for database operations on scheduled_discharge_emails table.
 * Enables dependency injection and testability.
 *
 * @example
 * ```ts
 * class EmailService {
 *   constructor(private emailRepo: IEmailRepository) {}
 *
 *   async scheduleEmail(data: EmailInsert) {
 *     return this.emailRepo.create(data);
 *   }
 * }
 * ```
 */

/**
 * Email status types
 */
export type EmailStatus = "queued" | "sent" | "failed" | "canceled";

/**
 * Scheduled email entity
 */
export interface ScheduledEmail extends Record<string, unknown> {
  id: string;
  user_id: string;
  recipient_email: string;
  recipient_name?: string | null;
  subject: string;
  html_content: string;
  plain_content?: string | null;
  scheduled_for: string;
  status: EmailStatus;
  metadata: Record<string, unknown>;
  sent_at?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Options for querying emails
 */
export interface FindEmailsOptions {
  limit?: number;
  status?: EmailStatus;
  orderBy?: "scheduled_for" | "created_at" | "sent_at";
  ascending?: boolean;
}

/**
 * Email repository interface
 */
export interface IEmailRepository {
  /**
   * Find an email by ID
   *
   * @param id - Email identifier
   * @returns Email if found, null otherwise
   */
  findById(id: string): Promise<ScheduledEmail | null>;

  /**
   * Find emails by case ID
   *
   * @param caseId - Case identifier
   * @param options - Query options (limit, status filter, etc.)
   * @returns Array of emails for the case
   */
  findByCase(
    caseId: string,
    options?: FindEmailsOptions,
  ): Promise<ScheduledEmail[]>;

  /**
   * Find emails by user ID
   *
   * @param userId - User identifier
   * @param options - Query options (limit, status filter, etc.)
   * @returns Array of user's emails
   */
  findByUserId(
    userId: string,
    options?: FindEmailsOptions,
  ): Promise<ScheduledEmail[]>;

  /**
   * Find emails by recipient email address
   *
   * @param recipientEmail - Recipient email address
   * @param limit - Maximum number of emails to return
   * @returns Array of emails sent to recipient
   */
  findByRecipient(
    recipientEmail: string,
    limit?: number,
  ): Promise<ScheduledEmail[]>;

  /**
   * Find all pending emails scheduled for sending
   *
   * @param limit - Maximum number of emails to return (default: 50)
   * @returns Array of pending emails
   */
  findPendingEmails(limit?: number): Promise<ScheduledEmail[]>;

  /**
   * Find emails scheduled within a time range
   *
   * @param startTime - Start of time range (ISO 8601)
   * @param endTime - End of time range (ISO 8601)
   * @param status - Optional status filter
   * @returns Array of emails in time range
   */
  findByTimeRange(
    startTime: string,
    endTime: string,
    status?: EmailStatus,
  ): Promise<ScheduledEmail[]>;

  /**
   * Create a new scheduled email
   *
   * @param data - Email data (without auto-generated fields)
   * @returns Created email with all fields
   */
  create(data: Partial<ScheduledEmail>): Promise<ScheduledEmail>;

  /**
   * Update an email by ID
   *
   * @param id - Email identifier
   * @param data - Fields to update
   * @returns Updated email
   */
  update(id: string, data: Partial<ScheduledEmail>): Promise<ScheduledEmail>;

  /**
   * Update email status
   *
   * @param emailId - Email identifier
   * @param status - New status
   * @param metadata - Optional additional metadata to update
   * @returns Updated email record
   */
  updateStatus(
    emailId: string,
    status: EmailStatus,
    metadata?: Record<string, unknown>,
  ): Promise<ScheduledEmail>;

  /**
   * Mark an email as sent
   *
   * @param emailId - Email identifier
   * @param sentAt - Timestamp when email was sent (defaults to now)
   * @param metadata - Optional metadata (e.g., provider message ID)
   * @returns Updated email record
   */
  markAsSent(
    emailId: string,
    sentAt?: string,
    metadata?: Record<string, unknown>,
  ): Promise<ScheduledEmail>;

  /**
   * Mark an email as failed with error message
   *
   * @param emailId - Email identifier
   * @param errorMessage - Error message describing the failure
   * @returns Updated email record
   */
  markAsFailed(emailId: string, errorMessage: string): Promise<ScheduledEmail>;

  /**
   * Cancel a scheduled email
   *
   * @param emailId - Email identifier
   * @returns Updated email record
   */
  cancelEmail(emailId: string): Promise<ScheduledEmail>;

  /**
   * Delete an email by ID
   *
   * @param id - Email identifier
   */
  delete(id: string): Promise<void>;

  /**
   * Count emails by criteria
   *
   * @param criteria - Optional criteria to filter emails
   * @returns Total count of matching emails
   */
  count(criteria?: { user_id?: string; status?: EmailStatus }): Promise<number>;

  /**
   * Get email statistics for a user
   *
   * @param userId - User identifier
   * @returns Email statistics by status
   */
  getStatsByUser(userId: string): Promise<Record<EmailStatus, number>>;
}
