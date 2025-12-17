import type { DashboardCase } from '../hooks/useDailyDischarges';

interface ConfirmScrapedCasesModalProps {
  cases: DashboardCase[];
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal component for confirming scraped cases before sending
 */
export const ConfirmScrapedCasesModal = ({ cases, onConfirm, onCancel }: ConfirmScrapedCasesModalProps) => {
  const idexxCases = cases.filter(c => c.source === 'idexx_neo');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold">Confirm Schedule Scraped Cases</h3>
        <p className="mb-4 text-sm text-gray-600">
          Found {idexxCases.length} cases from today's schedule. Send discharge summaries for these cases?
        </p>
        <div className="mb-4 max-h-64 overflow-y-auto">
          <ul className="space-y-2">
            {idexxCases.map(c => (
              <li key={c.id} className="flex items-center justify-between rounded bg-gray-50 p-2 text-sm">
                <span>
                  {c.hydrated?.patientName || 'Unknown'} - {c.hydrated?.ownerName || 'Unknown'}
                </span>
                <span className="text-xs text-gray-500">
                  {c.scheduled_at
                    ? new Date(c.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '-'}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
            Confirm & Send
          </button>
        </div>
      </div>
    </div>
  );
};
