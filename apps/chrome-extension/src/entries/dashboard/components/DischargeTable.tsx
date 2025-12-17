import { ConfirmScrapedCasesModal } from './ConfirmScrapedCasesModal';
import { ConfirmSendDischargesModal } from './ConfirmSendDischargesModal';
import { DischargeTableRow } from './DischargeTableRow';
import { TestModeSettings } from './TestModeSettings';
import { useDailyDischarges } from '../hooks/useDailyDischarges';
import { useDischargeActions } from '../hooks/useDischargeActions';
import { useScheduleScraping } from '../hooks/useScheduleScraping';
import { getReadyCount } from '../utils/caseStatusHelpers';
import { isAuthError, formatErrorMessage, testModeStorage, useStorage, IS_DEV } from '@odis-ai/extension-shared';
import { useState } from 'react';

export const DischargeTable = () => {
  const { cases, setCases, isLoading, error, refresh } = useDailyDischarges();
  const { sendDischarge, sendAllReady, isProcessing } = useDischargeActions({ cases, setCases });
  const { scrapeSchedule, isScrapingSchedule } = useScheduleScraping({ refresh });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const testMode = useStorage(testModeStorage);

  const handleScrapeSchedule = async () => {
    const result = await scrapeSchedule();

    if (!result.success) {
      const error = result.error ? new Error(result.error) : new Error('Failed to scrape schedule');
      const errorMessage = isAuthError(error)
        ? 'Please sign in to scrape schedule.'
        : formatErrorMessage(error, 'Failed to scrape schedule');
      alert(errorMessage);
      return;
    }

    if (result.appointmentsFound === 0) {
      alert('No appointments found in schedule for today.');
      return;
    }

    // Show confirmation modal after a brief delay to allow state to update
    setTimeout(() => {
      setShowConfirmModal(true);
    }, 500);

    alert(`Found ${result.appointmentsFound} appointments. ${result.casesCreated} cases created/updated.`);
  };

  const handleConfirmScrapedCases = async () => {
    setShowConfirmModal(false);

    // Send all IDEXX cases for today that are pending
    const idexxCases = cases.filter(c => c.source === 'idexx_neo' && c.status === 'pending');
    for (const c of idexxCases) {
      await sendDischarge(c);
      await new Promise(r => setTimeout(r, 1000));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <h3 className="font-bold">Error loading discharges</h3>
        <p>{error}</p>
        <button onClick={refresh} className="mt-2 font-medium underline">
          Try Again
        </button>
      </div>
    );
  }

  const readyCount = getReadyCount(cases);

  const handleSendAllReady = () => {
    // If test mode is enabled, send directly without confirmation
    if (testMode.enabled) {
      sendAllReady();
      return;
    }
    // Otherwise, show confirmation
    setShowSendConfirmModal(true);
  };

  const handleConfirmSendAll = () => {
    setShowSendConfirmModal(false);
    sendAllReady();
  };

  return (
    <div className="space-y-4">
      {/* Test Mode Settings (dev only) */}
      <TestModeSettings />

      {/* Test Mode Indicator Banner */}
      {IS_DEV && testMode.enabled && (
        <div className="rounded-lg border-2 border-orange-400 bg-orange-50 p-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-orange-900">⚠️ Test Mode Active</h3>
              <p className="text-xs text-orange-700">
                All discharges will be sent to:{' '}
                {testMode.testEmail && <span className="font-medium">{testMode.testEmail}</span>}
                {testMode.testEmail && testMode.testPhone && ' / '}
                {testMode.testPhone && <span className="font-medium">{testMode.testPhone}</span>}
                {!testMode.testEmail && !testMode.testPhone && 'No test contact configured'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Scheduled Discharges ({cases.length})</h2>
          <p className="text-sm text-gray-500">{readyCount} ready to send</p>
        </div>
        <div className="space-x-2">
          <button
            onClick={handleScrapeSchedule}
            disabled={isScrapingSchedule}
            className="rounded-md border border-teal-600 px-4 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50 disabled:opacity-50">
            {isScrapingSchedule ? 'Scraping...' : 'Scrape Schedule'}
          </button>
          <button
            onClick={refresh}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Refresh
          </button>
          <button
            onClick={handleSendAllReady}
            disabled={readyCount === 0 || isProcessing}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
            {isProcessing ? 'Sending...' : 'Send All Ready'}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Contact Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {cases.map(c => (
              <DischargeTableRow key={c.id} caseItem={c} onSend={sendDischarge} testMode={testMode} />
            ))}
            {cases.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                  No scheduled discharges found for today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal for Scraped Cases */}
      {showConfirmModal && (
        <ConfirmScrapedCasesModal
          cases={cases}
          onConfirm={handleConfirmScrapedCases}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      {/* Confirmation Modal for Sending Discharges */}
      {showSendConfirmModal && (
        <ConfirmSendDischargesModal
          count={readyCount}
          onConfirm={handleConfirmSendAll}
          onCancel={() => setShowSendConfirmModal(false)}
        />
      )}
    </div>
  );
};
