/**
 * Email utility functions
 *
 * Simple utilities for processing HTML emails.
 * No longer uses @react-email since templates are now plain HTML generators.
 */

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function inlineCss(html: string): string {
  // For future enhancement: could use a library like juice to inline CSS
  // For now, our templates already have inline styles
  return html;
}
