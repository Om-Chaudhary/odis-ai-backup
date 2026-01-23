/**
 * Email Repository
 *
 * Database operations for scheduled_discharge_emails table.
 * Provides domain-specific queries for email scheduling and management.
 *
 * @example
 * ```ts
 * const emailRepo = new EmailRepository(supabase);
 *
 * // Find pending emails
 * const pending = await emailRepo.findPendingEmails();
 *
 * // Mark email as sent
 * await emailRepo.markAsSent("email_123");
 *
 * // Find emails by user
 * const userEmails = await emailRepo.findByUserId("user_123");
 * ```
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository } from "./base";
import type { ScheduledEmail, EmailStatus } from "./types";

export class EmailRepository extends BaseRepository<ScheduledEmail> {
  constructor(supabase: SupabaseClient) {
    super(supabase, "scheduled_discharge_emails");
  }

  /**
   * Find all pending emails scheduled for sending
   *
   * @param limit - Maximum number of emails to return (default: 50)
   * @returns Array of pending emails
   *
   * @example
   * ```ts
   * const pendingEmails = await emailRepo.findPendingEmails(100);
   * ```
   */
  async findPendingEmails(limit = 50): Promise<ScheduledEmail[]> {
    this.logger.debug("Finding pending emails", { limit });

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("status", "queued")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(limit);

    if (error) {
      this.logger.error("Failed to find pending emails", {
        error: error.message,
      });
      return [];
    }

    this.logger.debug("Found pending emails", { count: data?.length ?? 0 });
    return (data as ScheduledEmail[]) ?? [];
  }

  /**
   * Find emails by user ID
   *
   * @param userId - User identifier
   * @param options - Query options (limit, status filter, etc.)
   * @returns Array of user's emails
   *
   * @example
   * ```ts
   * const userEmails = await emailRepo.findByUserId("user_123", {
   *   limit: 20,
   *   status: "sent"
   * });
   * ```
   */
  async findByUserId(
    userId: string,
    options?: {
      limit?: number;
      status?: EmailStatus;
      orderBy?: "scheduled_for" | "created_at" | "sent_at";
      ascending?: boolean;
    },
  ): Promise<ScheduledEmail[]> {
    this.logger.debug("Finding emails by user ID", { userId, options });

    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId);

    // Apply status filter if provided
    if (options?.status) {
      query = query.eq("status", options.status);
    }

    // Apply ordering
    const orderColumn = options?.orderBy ?? "created_at";
    query = query.order(orderColumn, {
      ascending: options?.ascending ?? false,
      nullsFirst: false,
    });

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error("Failed to find emails by user ID", {
        userId,
        error: error.message,
      });
      return [];
    }

    this.logger.debug("Found user emails", { count: data?.length ?? 0 });
    return (data as ScheduledEmail[]) ?? [];
  }

  /**
   * Find emails by recipient email address
   *
   * @param recipientEmail - Recipient email address
   * @param limit - Maximum number of emails to return
   * @returns Array of emails sent to recipient
   *
   * @example
   * ```ts
   * const recipientEmails = await emailRepo.findByRecipient("john@example.com");
   * ```
   */
  async findByRecipient(
    recipientEmail: string,
    limit = 50,
  ): Promise<ScheduledEmail[]> {
    this.logger.debug("Finding emails by recipient", {
      recipientEmail,
      limit,
    });

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("recipient_email", recipientEmail.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error("Failed to find emails by recipient", {
        recipientEmail,
        error: error.message,
      });
      return [];
    }

    this.logger.debug("Found recipient emails", { count: data?.length ?? 0 });
    return (data as ScheduledEmail[]) ?? [];
  }

  /**
   * Find emails scheduled within a time range
   *
   * @param startTime - Start of time range (ISO 8601)
   * @param endTime - End of time range (ISO 8601)
   * @param status - Optional status filter
   * @returns Array of emails in time range
   *
   * @example
   * ```ts
   * const todayEmails = await emailRepo.findByTimeRange(
   *   "2025-11-17T00:00:00Z",
   *   "2025-11-17T23:59:59Z",
   *   "queued"
   * );
   * ```
   */
  async findByTimeRange(
    startTime: string,
    endTime: string,
    status?: EmailStatus,
  ): Promise<ScheduledEmail[]> {
    this.logger.debug("Finding emails by time range", {
      startTime,
      endTime,
      status,
    });

    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .gte("scheduled_for", startTime)
      .lte("scheduled_for", endTime);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("scheduled_for", {
      ascending: true,
    });

    if (error) {
      this.logger.error("Failed to find emails by time range", {
        error: error.message,
      });
      return [];
    }

    this.logger.debug("Found emails in time range", {
      count: data?.length ?? 0,
    });
    return (data as ScheduledEmail[]) ?? [];
  }

  /**
   * Update email status
   *
   * @param emailId - Email identifier
   * @param status - New status
   * @param metadata - Optional additional metadata to update
   * @returns Updated email record
   *
   * @example
   * ```ts
   * await emailRepo.updateStatus("email_123", "sent", {
   *   provider_message_id: "msg_abc123"
   * });
   * ```
   */
  async updateStatus(
    emailId: string,
    status: EmailStatus,
    metadata?: Record<string, unknown>,
  ): Promise<ScheduledEmail> {
    this.logger.info("Updating email status", { emailId, status, metadata });

    const updateData: Partial<ScheduledEmail> = { status };

    // Merge metadata if provided
    if (metadata) {
      const existingEmail = await this.findById(emailId);
      if (existingEmail) {
        updateData.metadata = {
          ...existingEmail.metadata,
          ...metadata,
        };
      }
    }

    return this.update(emailId, updateData);
  }

  /**
   * Mark an email as sent
   *
   * @param emailId - Email identifier
   * @param sentAt - Timestamp when email was sent (defaults to now)
   * @param metadata - Optional metadata (e.g., provider message ID)
   * @returns Updated email record
   *
   * @example
   * ```ts
   * await emailRepo.markAsSent("email_123", undefined, {
   *   provider: "resend",
   *   message_id: "msg_abc123"
   * });
   * ```
   */
  async markAsSent(
    emailId: string,
    sentAt?: string,
    metadata?: Record<string, unknown>,
  ): Promise<ScheduledEmail> {
    this.logger.info("Marking email as sent", { emailId, sentAt, metadata });

    const updateData: Partial<ScheduledEmail> = {
      status: "sent",
      sent_at: sentAt ?? new Date().toISOString(),
    };

    // Merge metadata if provided
    if (metadata) {
      const existingEmail = await this.findById(emailId);
      if (existingEmail) {
        updateData.metadata = {
          ...existingEmail.metadata,
          ...metadata,
        };
      }
    }

    return this.update(emailId, updateData);
  }

  /**
   * Mark an email as failed with error message
   *
   * @param emailId - Email identifier
   * @param errorMessage - Error message describing the failure
   * @returns Updated email record
   *
   * @example
   * ```ts
   * await emailRepo.markAsFailed("email_123", "SMTP connection timeout");
   * ```
   */
  async markAsFailed(
    emailId: string,
    errorMessage: string,
  ): Promise<ScheduledEmail> {
    this.logger.warn("Marking email as failed", { emailId, errorMessage });

    return this.update(emailId, {
      status: "failed",
      error_message: errorMessage,
    });
  }

  /**
   * Get email statistics for a user
   *
   * @param userId - User identifier
   * @returns Email statistics by status
   *
   * @example
   * ```ts
   * const stats = await emailRepo.getStatsByUser("user_123");
   * // Returns: { queued: 3, sent: 15, failed: 1, canceled: 0 }
   * ```
   */
  async getStatsByUser(userId: string): Promise<Record<EmailStatus, number>> {
    this.logger.debug("Getting email statistics for user", { userId });

    const stats: Record<EmailStatus, number> = {
      queued: 0,
      sent: 0,
      failed: 0,
      canceled: 0,
    };

    // Single query with GROUP BY for all statuses
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("status")
      .eq("user_id", userId);

    if (error) {
      this.logger.error("Failed to get email statistics", {
        userId,
        error: error.message,
      });
      return stats;
    }

    // Count occurrences of each status
    if (data) {
      for (const row of data) {
        const status = row.status as EmailStatus;
        if (status in stats) {
          stats[status]++;
        }
      }
    }

    this.logger.debug("Email statistics retrieved", { userId, stats });
    return stats;
  }

  /**
   * Cancel a scheduled email
   *
   * @param emailId - Email identifier
   * @returns Updated email record
   *
   * @example
   * ```ts
   * await emailRepo.cancelEmail("email_123");
   * ```
   */
  async cancelEmail(emailId: string): Promise<ScheduledEmail> {
    this.logger.info("Canceling scheduled email", { emailId });

    return this.update(emailId, {
      status: "canceled",
    });
  }
}
