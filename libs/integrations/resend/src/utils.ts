/**
 * Email Utility Functions
 *
 * These functions don't require the resend library and can be safely
 * imported anywhere without pulling in @react-email dependencies.
 */

/**
 * Validate email address format
 *
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate plain text version from HTML content
 * Strips HTML tags and converts common elements to plain text equivalents
 *
 * @param html - HTML content
 * @returns Plain text version
 */
export function htmlToPlainText(html: string): string {
  return (
    html
      // Convert line breaks
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      // Convert headings
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n$1\n")
      // Remove remaining tags
      .replace(/<[^>]+>/g, "")
      // Decode HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .trim()
  );
}
