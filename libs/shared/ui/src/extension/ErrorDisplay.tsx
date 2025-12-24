import type { FallbackProps } from 'react-error-boundary';

/**
 * ErrorDisplay component for use with error boundaries
 * Displays error information in a user-friendly format
 */
export function ErrorDisplay({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div
      role="alert"
      className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
    >
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <pre className="text-sm mb-4 overflow-auto">{error.message}</pre>
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
