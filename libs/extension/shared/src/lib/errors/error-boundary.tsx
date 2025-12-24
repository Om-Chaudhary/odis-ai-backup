/**
 * Error boundary component for extension
 *
 * Provides a user-friendly fallback UI when an error occurs in any
 * extension context (popup, dashboard, content scripts, etc.)
 */

import { logger } from "../utils/logger";
import { ErrorBoundary } from "react-error-boundary";
import type { ReactNode } from "react";
import type { FallbackProps } from "react-error-boundary";

const errorLogger = logger.child("[ErrorBoundary]");

/**
 * Default fallback UI shown when an error occurs
 */
const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "200px",
      padding: "20px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}
  >
    <div
      style={{
        maxWidth: "600px",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontSize: "20px",
          fontWeight: "bold",
          color: "#ef4444",
          marginBottom: "12px",
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "16px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {error.message ?? "An unexpected error occurred"}
      </p>
      <button
        onClick={resetErrorBoundary}
        style={{
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: "500",
          color: "#ffffff",
          backgroundColor: "#3b82f6",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#2563eb";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#3b82f6";
        }}
      >
        Try again
      </button>
    </div>
  </div>
);

/**
 * Error handler that logs errors and tracks them
 */
const handleError = async (
  error: Error,
  info: { componentStack?: string | null },
) => {
  errorLogger.error("React error caught by boundary", {
    error: error.message,
    stack: error.stack,
    componentStack: info.componentStack,
  });

  // Try to track the error
  try {
    const { trackError } = await import("../analytics/index");
    await trackError(error, {
      source: "error_boundary",
      error_type: "react_error",
    });
  } catch (trackingError) {
    // Ignore tracking errors to prevent infinite loop
    errorLogger.warn("Failed to track error", { trackingError });
  }
};

/**
 * Extension-wide error boundary component
 *
 * Wraps the entire application to catch and handle React errors gracefully.
 * Provides a user-friendly fallback UI with a "Try again" button.
 *
 * @example
 * ```tsx
 * import { ExtensionErrorBoundary } from '@odis-ai/extension/shared';
 *
 * root.render(
 *   <ExtensionErrorBoundary>
 *     <App />
 *   </ExtensionErrorBoundary>
 * );
 * ```
 */
const ExtensionErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
    {children}
  </ErrorBoundary>
);

export { ExtensionErrorBoundary, ErrorFallback };
