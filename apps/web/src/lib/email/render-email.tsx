import type { ReactElement } from "react";
import { render } from "@react-email/components";

/**
 * Render a React email component to HTML string
 *
 * Uses @react-email/render for optimal email client compatibility.
 * This provides:
 * - Type safety
 * - Component reusability
 * - Better maintainability
 * - IDE support and autocomplete
 * - Proper DOCTYPE and email-safe HTML
 *
 * @param component - React element to render
 * @returns HTML string with proper DOCTYPE
 *
 * @example
 * ```tsx
 * const html = await renderEmailToHtml(
 *   <DischargeEmailTemplate
 *     patientName="Max"
 *     dischargeSummary={{
 *       diagnosis: "Ear infection",
 *       treatmentPlan: ["Apply ear drops twice daily"],
 *     }}
 *   />
 * );
 * ```
 */
export async function renderEmailToHtml(
  component: ReactElement,
): Promise<string> {
  // Use React Email's render function for optimal compatibility
  return await render(component);
}

/**
 * Convert HTML to plain text for email fallback
 *
 * This is a simple implementation that:
 * - Strips all HTML tags
 * - Converts common entities
 * - Preserves line breaks
 * - Cleans up excessive whitespace
 *
 * For more sophisticated conversion, consider using a library like:
 * - html-to-text
 * - turndown (for markdown)
 *
 * @param html - HTML string to convert
 * @returns Plain text version
 */
export function htmlToPlainText(html: string): string {
  return (
    html
      // Convert <br> and </p> to newlines
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")

      // Remove all HTML tags
      .replace(/<[^>]+>/g, "")

      // Convert common HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")

      // Clean up excessive whitespace
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s+\n/g, "\n\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * Inline CSS styles for better email client compatibility
 *
 * Many email clients strip <style> tags, so inlining CSS is often necessary.
 * This is a placeholder for a more sophisticated solution using libraries like:
 * - juice
 * - inline-css
 * - @react-email/render
 *
 * For now, our email components already use inline styles, so this is not needed.
 * But it's here for future enhancement.
 *
 * @param html - HTML with styles
 * @returns HTML with inlined styles
 */
export function inlineCss(html: string): string {
  // For now, just return the HTML as-is since we use inline styles
  // In the future, this could use a library like 'juice' to inline CSS
  return html;
}

/**
 * Prepare email content from React component
 *
 * Convenience function that renders a component to both HTML and plain text
 *
 * @param component - React email component
 * @returns Object with HTML and text versions
 *
 * @example
 * ```tsx
 * const { html, text } = await prepareEmailContent(
 *   <DischargeEmailTemplate {...props} />
 * );
 *
 * await sendEmail({
 *   to: recipient,
 *   subject: "Discharge Instructions",
 *   html,
 *   text,
 * });
 * ```
 */
export async function prepareEmailContent(component: ReactElement): Promise<{
  html: string;
  text: string;
}> {
  const html = await renderEmailToHtml(component);
  const text = htmlToPlainText(html);

  return { html, text };
}
