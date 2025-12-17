import { IS_DEV } from '@odis-ai/extension-shared';
import type { DashboardCase } from '../hooks/useDailyDischarges';
import type { TestModeState } from '@odis-ai/extension-shared';

interface DischargeTableRowProps {
  caseItem: DashboardCase;
  onSend: (caseItem: DashboardCase) => void;
  testMode: TestModeState;
}

/**
 * Table row component for displaying a single discharge case
 */
export const DischargeTableRow = ({ caseItem, onSend, testMode }: DischargeTableRowProps) => {
  const isSending = caseItem.status === 'sending';

  // Use test mode contact info if enabled, otherwise use actual client info
  const isTestMode = IS_DEV && testMode.enabled;
  const displayEmail = isTestMode && testMode.testEmail ? testMode.testEmail : caseItem.hydrated?.ownerEmail;
  const displayPhone = isTestMode && testMode.testPhone ? testMode.testPhone : caseItem.hydrated?.ownerPhone;
  const hasEmail = !!displayEmail;
  const hasPhone = !!displayPhone;
  const hasContactInfo = hasPhone || hasEmail;

  // Can send if not currently sending and has at least one contact method (email or phone)
  // Note: We don't check for 'completed' status since there's no way to verify if a discharge was actually sent
  const canSend = !isSending && hasContactInfo;

  return (
    <tr>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold ${
            caseItem.source === 'manual' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
          }`}>
          {caseItem.source === 'manual' ? '📱 Mobile' : '📅 IDEXX'}
        </span>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
        {caseItem.scheduled_at
          ? new Date(caseItem.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '-'}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
        {caseItem.hydrated?.patientName}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{caseItem.hydrated?.ownerName}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        <div className="flex flex-col gap-1">
          <span
            className={`flex items-center gap-1 text-xs ${
              isTestMode ? 'font-semibold text-orange-600' : hasEmail ? 'text-green-600' : 'text-red-500'
            }`}>
            ✉️ {displayEmail || 'Missing'}
            {isTestMode && hasEmail && (
              <span className="ml-1 rounded bg-orange-100 px-1 text-[10px] font-semibold text-orange-800">TEST</span>
            )}
          </span>
          <span
            className={`flex items-center gap-1 text-xs ${
              isTestMode ? 'font-semibold text-orange-600' : hasPhone ? 'text-green-600' : 'text-red-500'
            }`}>
            📞 {displayPhone || 'Missing'}
            {isTestMode && hasPhone && (
              <span className="ml-1 rounded bg-orange-100 px-1 text-[10px] font-semibold text-orange-800">TEST</span>
            )}
          </span>
          {caseItem.hydrated?.isLoading && <span className="text-xs text-blue-500">Hydrating...</span>}
          {isTestMode && (!testMode.testEmail || !testMode.testPhone) && (
            <span className="text-xs text-orange-600">
              ⚠️{' '}
              {!testMode.testEmail && !testMode.testPhone
                ? 'No test contacts configured'
                : !testMode.testEmail
                  ? 'No test email'
                  : 'No test phone'}
            </span>
          )}
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm">
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
            caseItem.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : caseItem.status === 'error'
                ? 'bg-red-100 text-red-800'
                : caseItem.status === 'sending'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
          }`}>
          {caseItem.statusMessage || caseItem.status}
        </span>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
        {hasContactInfo && (
          <button
            onClick={() => onSend(caseItem)}
            disabled={!canSend}
            className="text-teal-600 hover:text-teal-900 disabled:text-gray-400">
            Send
          </button>
        )}
      </td>
    </tr>
  );
};
