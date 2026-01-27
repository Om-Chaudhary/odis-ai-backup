import type { FallbackProps } from "react-error-boundary";

/**
 * ErrorDisplay component for use with error boundaries
 * Displays error information in a user-friendly format
 */
export function ErrorDisplay({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
    >
      <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
      <pre className="mb-4 overflow-auto text-sm">{errorMessage}</pre>
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="rounded bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
        >
          Try again
        </button>
      )}
    </div>
  );
}
