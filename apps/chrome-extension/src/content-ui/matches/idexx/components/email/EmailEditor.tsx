import { logger } from "@odis-ai/extension/shared";
import { useState, useEffect } from "react";
import type { DischargeSummary } from "../../utils/discharge-summary-fetcher";

const odisLogger = logger.child("[ODIS]");

interface EmailEditorProps {
  isOpen: boolean;
  onClose: () => void;
  dischargeSummary: DischargeSummary | null;
}

export const EmailEditor = ({
  isOpen,
  onClose,
  dischargeSummary,
}: EmailEditorProps) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const patientName =
    (dischargeSummary as { cases?: { patients?: Array<{ name?: string }> } })
      ?.cases?.patients?.[0]?.name || "Unknown Patient";

  // Populate email when discharge summary is loaded
  useEffect(() => {
    if (dischargeSummary) {
      setSubject(`Discharge Summary - ${patientName}`);
      setBody(dischargeSummary.content || "");
    }
  }, [dischargeSummary, patientName]);

  const handleSend = async () => {
    if (!dischargeSummary) return;

    try {
      setIsSending(true);
      // NOTE: Email functionality is implemented in pages/email-editor/
      // This component is kept for backward compatibility but should use the email-editor page instead
      // See: pages/email-editor/src/App.tsx and supabase/functions/send-discharge-email/

      odisLogger.info("Sending email", { subject, body });
      alert("Email functionality coming soon!");
      onClose();
    } catch (error) {
      odisLogger.error("Error sending email", { error });
      alert("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen || !dischargeSummary) return null;

  return (
    <div
      className="odis-email-overlay"
      onClick={handleOverlayClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleOverlayKeyDown}
      aria-label="Close email editor overlay"
    >
      <div className="odis-email-panel">
        {/* Header */}
        <div className="odis-email-header">
          <div className="odis-email-header-content">
            <div className="odis-email-title">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="odis-email-icon"
              >
                <path
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Email Discharge Summary</span>
            </div>
            <div className="odis-email-patient">Patient: {patientName}</div>
          </div>
          <button className="odis-email-close" onClick={onClose} title="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Email Form */}
        <div className="odis-email-content">
          <div className="odis-email-field">
            <label htmlFor="email-subject" className="odis-email-label">
              Subject
            </label>
            <input
              id="email-subject"
              type="text"
              className="odis-email-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
          </div>

          <div className="odis-email-field odis-email-field-body">
            <label htmlFor="email-body" className="odis-email-label">
              Message
            </label>
            <textarea
              id="email-body"
              className="odis-email-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email message..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="odis-email-footer">
          <button
            className="odis-email-btn odis-email-btn-secondary"
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            className="odis-email-btn odis-email-btn-primary"
            onClick={handleSend}
            disabled={isSending || !subject.trim() || !body.trim()}
          >
            {isSending ? (
              <>
                <svg
                  className="spinner"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    opacity="0.25"
                  />
                  <path
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.75"
                  />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
