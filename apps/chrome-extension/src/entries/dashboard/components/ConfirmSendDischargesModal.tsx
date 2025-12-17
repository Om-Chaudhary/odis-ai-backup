interface ConfirmSendDischargesModalProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal component for confirming before sending discharges
 */
export const ConfirmSendDischargesModal = ({ count, onConfirm, onCancel }: ConfirmSendDischargesModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="max-w-md rounded-lg bg-white p-6 shadow-xl">
      <h3 className="mb-4 text-lg font-semibold">Confirm Send Discharges</h3>
      <p className="mb-6 text-sm text-gray-600">
        Are you sure you want to send {count} discharge {count === 1 ? 'summary' : 'summaries'}?
      </p>
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
