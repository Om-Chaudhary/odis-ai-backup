import { fetchConsultationData } from '../../../../content-ui/matches/idexx/utils/extraction/consultation-fetcher';
import { logger } from '@odis-ai/extension/shared';
import type { DashboardCase } from '../../hooks/useDailyDischarges';

const odisLogger = logger.child('[ODIS-DASHBOARD]');

/**
 * Fetch internal notes from IDEXX consultation for a case
 * This is used when a case doesn't have notes but has a consultation_id
 */
export const fetchInternalNotesForCase = async (caseItem: DashboardCase): Promise<string | null> => {
  try {
    // Only fetch notes for IDEXX cases
    if (caseItem.source !== 'idexx_neo') {
      odisLogger.debug('Case is not from IDEXX, skipping note fetch', {
        caseId: caseItem.id,
        source: caseItem.source,
      });
      return null;
    }

    const meta = caseItem.metadata as Record<string, unknown> | null;
    const idexxMeta = (meta?.idexx as Record<string, unknown>) || {};

    // Try to get consultation_id from metadata (appointments may not have consultation_id yet)
    // If no consultation_id, try using appointment_id (some appointments become consultations)
    const consultationId = idexxMeta.consultation_id || idexxMeta.appointment_id;

    if (!consultationId) {
      odisLogger.debug('No consultation/appointment ID found in case metadata', { caseId: caseItem.id });
      return null;
    }

    // Fetch consultation data from IDEXX API
    // This will work from the dashboard since it uses the IDEXX API endpoint
    const consultationData = await fetchConsultationData(String(consultationId));

    // Extract notes from consultation data
    // IDEXX API structure: consultationNotes.notes or consultation.notes
    const consultationNotes = consultationData.consultationNotes as { notes?: string } | undefined;
    const rawNotes = consultationNotes?.notes || consultationData.consultation.notes || '';

    if (!rawNotes.trim()) {
      odisLogger.debug('No notes found in consultation data', { consultationId });
      return null;
    }

    odisLogger.info('Successfully fetched internal notes', {
      caseId: caseItem.id,
      consultationId,
      notesLength: rawNotes.length,
    });

    return rawNotes;
  } catch (error) {
    // Silently fail - this is expected if consultation doesn't exist or isn't accessible
    odisLogger.debug('Could not fetch internal notes (this is normal if consultation not yet created)', {
      caseId: caseItem.id,
      error,
    });
    return null;
  }
};
