import { cn } from '@odis-ai/shared/ui/extension';

interface SendDischargeButtonProps {
  isDisabled: boolean;
  onSendDischarge: () => void;
}

export const SendDischargeButton = ({ isDisabled, onSendDischarge }: SendDischargeButtonProps) => (
  <button
    className={cn(
      'inline-flex items-center gap-1.5 rounded border border-teal-500 bg-teal-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200',
      'hover:border-teal-600 hover:bg-teal-600',
      'active:bg-teal-700',
      'disabled:cursor-not-allowed disabled:opacity-50',
    )}
    onClick={onSendDischarge}
    disabled={isDisabled}
    title="Open discharge page in dashboard"
    type="button">
    <span>Discharge</span>
    {/* External link icon */}
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  </button>
);
