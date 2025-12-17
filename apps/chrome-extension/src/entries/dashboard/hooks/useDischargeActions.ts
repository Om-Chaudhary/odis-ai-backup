import { executeDischargeWorkflow } from '../services/DischargeService';
import { setCaseSending, setCaseCompleted, setCaseError, getReadyCases } from '../utils/caseStatusHelpers';
import { caseToClinicalData } from '../utils/caseToClinicalData';
import { fetchInternalNotesForCase } from '../utils/idexx/fetchInternalNotes';
import { getSupabaseClient, logger, requireAuthToken, testModeStorage, IS_DEV, trackEvent } from '@odis-ai/extension-shared';
import { useState } from 'react';
import type { DashboardCase } from './useDailyDischarges';

const odisLogger = logger.child('[ODIS-DASHBOARD]');

interface UseDischargeActionsParams {
  cases: DashboardCase[];
  setCases: React.Dispatch<React.SetStateAction<DashboardCase[]>>;
}

/**
 * Custom hook for handling discharge actions (send single case, send all ready cases)
 */
export const useDischargeActions = ({ cases, setCases }: UseDischargeActionsParams) => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Send discharge for a single case
   */
  const sendDischarge = async (caseItem: DashboardCase): Promise<void> => {
    try {
      // Update status to sending
      setCases(prev => setCaseSending(prev, caseItem.id));

      // Get auth token
      const supabase = getSupabaseClient();
      const accessToken = await requireAuthToken();

      // Fetch notes if missing
      const meta = caseItem.metadata as Record<string, unknown> | null;
      const idexx = (meta?.idexx as Record<string, unknown>) || {};
      let notes = idexx.notes as string | undefined;

      if (!notes || notes === 'No notes available') {
        odisLogger.info('No notes found, fetching internal notes from IDEXX', { caseId: caseItem.id });
        const internalNotes = await fetchInternalNotesForCase(caseItem);
        if (internalNotes) {
          notes = internalNotes;
          // Update case metadata with fetched notes
          await supabase
            .from('cases')
            .update({
              metadata: {
                ...meta,
                idexx: {
                  ...idexx,
                  notes: internalNotes,
                },
              },
            })
            .eq('id', caseItem.id);
        }
      }

      // Check test mode status for logging
      if (IS_DEV) {
        const testMode = await testModeStorage.get();
        if (testMode.enabled) {
          odisLogger.warn('🧪 TEST MODE ACTIVE - Sending individual discharge to test contacts', {
            caseId: caseItem.id,
            patientName: caseItem.hydrated?.patientName,
            testEmail: testMode.testEmail,
            testPhone: testMode.testPhone,
            emailScheduleMinutes: testMode.emailScheduleMinutes,
            phoneScheduleMinutes: testMode.phoneScheduleMinutes,
          });
        }
      }

      // Transform case to ClinicalData
      const clinicalData = caseToClinicalData(caseItem, notes);

      // Track dashboard single send action
      await trackEvent(
        {
          event_type: 'dashboard_send_single',
          event_category: 'dashboard',
          event_action: 'send',
          source: 'dashboard',
          case_id: caseItem.id,
        },
        { trackFeatureUsage: true, updateSession: true },
      );

      // Execute discharge workflow
      const result = await executeDischargeWorkflow(clinicalData, accessToken);

      if (result.success) {
        setCases(prev => setCaseCompleted(prev, caseItem.id, result.actions));
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed';
      setCases(prev => setCaseError(prev, caseItem.id, errorMessage));
    }
  };

  /**
   * Send discharges for all ready cases
   */
  const sendAllReady = async (): Promise<void> => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Check test mode status for logging
    if (IS_DEV) {
      const testMode = await testModeStorage.get();
      if (testMode.enabled) {
        odisLogger.warn('🧪 TEST MODE ACTIVE - Sending discharges to test contacts', {
          testEmail: testMode.testEmail,
          testPhone: testMode.testPhone,
          emailScheduleMinutes: testMode.emailScheduleMinutes,
          phoneScheduleMinutes: testMode.phoneScheduleMinutes,
        });
      }
    }

    const readyCases = getReadyCases(cases);

    // Track dashboard bulk send action
    await trackEvent(
      {
        event_type: 'dashboard_send_all',
        event_category: 'dashboard',
        event_action: 'send',
        source: 'dashboard',
        metadata: {
          case_count: readyCases.length,
        },
      },
      { trackFeatureUsage: true, updateSession: true },
    );

    for (const c of readyCases) {
      await sendDischarge(c);
      // Small delay to prevent rate limiting
      await new Promise(r => setTimeout(r, 1000));
    }

    setIsProcessing(false);
  };

  return {
    sendDischarge,
    sendAllReady,
    isProcessing,
  };
};
