/**
 * Html Wrapper Component
 *
 * This wraps the @react-email Html component and catches/suppresses the
 * "Html should not be imported outside of pages/_document" error that occurs
 * during Next.js static page generation.
 *
 * The error is a false positive - we're using React Email for server-side
 * email rendering, not for Next.js pages.
 */

import type { ReactNode } from "react";

interface HtmlWrapperProps {
  children: ReactNode;
  lang?: string;
  dir?: "ltr" | "rtl";
}

/**
 * Simple Html wrapper that renders an <html> tag for email templates.
 * This avoids the @react-email/html component's Next.js detection that
 * throws errors during static page generation.
 */
export function HtmlWrapper({
  children,
  lang = "en",
  dir = "ltr",
}: HtmlWrapperProps) {
  return (
    <html lang={lang} dir={dir}>
      {children}
    </html>
  );
}
