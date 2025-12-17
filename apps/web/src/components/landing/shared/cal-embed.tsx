"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

interface CalEmbedProps {
  calLink: string;
  className?: string;
}

/**
 * Cal.com inline embed component
 * Uses official @calcom/embed-react package for proper Next.js integration
 * Embeds a Cal.com booking calendar directly into the page
 */
export function CalEmbed({ calLink, className = "" }: CalEmbedProps) {
  useEffect(() => {
    void (async function () {
      const cal = await getCalApi({ namespace: calLink });
      cal("ui", {
        theme: "light",
        styles: { branding: { brandColor: "#14b8a6" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, [calLink]);

  return (
    <Cal
      namespace={calLink}
      calLink={calLink}
      style={{
        width: "100%",
        height: "600px",
        maxHeight: "600px",
        overflow: "auto",
      }}
      config={{
        layout: "month_view",
        theme: "light",
      }}
      className={className}
    />
  );
}
