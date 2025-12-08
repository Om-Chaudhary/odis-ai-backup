"use client";

import { useEffect, useRef } from "react";

interface EmailPreviewFrameProps {
  html: string;
}

/**
 * Client component that renders email HTML in an iframe
 *
 * This simulates how the email will appear in an email client by rendering
 * the HTML in an isolated iframe context.
 */
export function EmailPreviewFrame({ html }: EmailPreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current?.contentWindow?.document) {
      const doc = iframeRef.current.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();
    }
  }, [html]);

  return (
    <div className="overflow-hidden rounded border border-gray-200 bg-white">
      <iframe
        ref={iframeRef}
        className="h-[800px] w-full border-0"
        title="Email Preview"
        sandbox="allow-same-origin"
      />
    </div>
  );
}
