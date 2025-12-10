/**
 * IEmailClient Interface
 *
 * Interface for email delivery systems using Resend or similar providers.
 * Enables dependency injection and testing for email operations.
 *
 * @example
 * ```typescript
 * class ResendEmailClient implements IEmailClient {
 *   async send(email: EmailInput): Promise<EmailResponse> {
 *     // Implementation using Resend SDK
 *   }
 * }
 * ```
 */

/**
 * Input for sending an email
 */
export interface EmailInput {
  /** Recipient email address(es) */
  to: string | string[];

  /** Email subject line */
  subject: string;

  /** HTML content of the email */
  html: string;

  /** Plain text version of the email (optional, auto-generated from HTML if not provided) */
  text?: string;

  /** Sender email address (optional, uses default if not provided) */
  from?: string;

  /** Reply-to email address (optional) */
  replyTo?: string;

  /** CC email address(es) (optional) */
  cc?: string | string[];

  /** BCC email address(es) (optional) */
  bcc?: string | string[];

  /** Email attachments (optional) */
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;

  /** Email tags for tracking (optional) */
  tags?: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * Response from sending an email
 */
export interface EmailResponse {
  /** Email ID from the provider (for tracking) */
  id: string;

  /** Additional metadata from the provider */
  [key: string]: unknown;
}

/**
 * Interface for email client operations
 */
export interface IEmailClient {
  /**
   * Send an email
   *
   * @param email - Email input with recipients, subject, and content
   * @returns Email response with ID for tracking
   * @throws Error if email sending fails
   */
  send(email: EmailInput): Promise<EmailResponse>;
}
