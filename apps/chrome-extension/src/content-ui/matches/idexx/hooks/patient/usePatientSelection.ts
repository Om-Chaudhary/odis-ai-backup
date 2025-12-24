import {
  fetchPatientLatestSoapNote,
  fetchPatientByConsultationId,
  detectIdexxPatientNameFromDom,
  searchPatientsByName,
} from '../../utils/extraction/patient-fetcher';
import { logger, useSupabaseAuth, getCurrentISOString } from '@odis-ai/extension/shared';
import { useEffect, useState } from 'react';
import type { PatientWithCase } from '../../types';

const odisLogger = logger.child('[ODIS]');

export interface UsePatientSelectionReturn {
  selectedPatient: PatientWithCase | null;
  selectedPatientHasNotes: boolean | null;
}

/**
 * Hook for managing patient selection and fetching patient data
 *
 * @param consultationId - Optional IDEXX consultation ID for primary patient lookup.
 *                         When provided, the hook will first try to find the patient
 *                         by consultation_id in case metadata. Only returns a patient if
 *                         the case has transcriptions, ensuring auto-selection only happens
 *                         when the user has created a case with transcriptions.
 *                         Falls back to DOM name detection if not found.
 */
export const usePatientSelection = (consultationId?: string | null): UsePatientSelectionReturn => {
  const { user } = useSupabaseAuth();
  const [selectedPatient, setSelectedPatient] = useState<PatientWithCase | null>(null);
  const [selectedPatientHasNotes, setSelectedPatientHasNotes] = useState<boolean | null>(null);

  // Fetch patient data when authenticated or when consultationId changes
  useEffect(() => {
    let isMounted = true;

    const initPatientData = async () => {
      if (!user) return;

      try {
        let matchedPatient: PatientWithCase | null = null;

        // PRIMARY LOOKUP: Try to find patient by consultation_id first
        // This is more reliable as it matches the exact consultation being viewed
        if (consultationId) {
          odisLogger.debug('Looking up patient by consultation ID', { consultationId });
          const patientByConsultation = await fetchPatientByConsultationId(consultationId);
          if (!isMounted) return;

          if (patientByConsultation) {
            odisLogger.info('Found patient by consultation ID', {
              consultationId,
              patientName: patientByConsultation.name,
              patientId: patientByConsultation.id,
            });
            matchedPatient = patientByConsultation;
          } else {
            odisLogger.debug('No patient found by consultation ID, falling back to DOM detection', {
              consultationId,
            });
          }
        }

        // FALLBACK: If no consultationId provided or lookup failed, try DOM name detection
        if (!matchedPatient) {
          const domName = detectIdexxPatientNameFromDom();

          if (domName) {
            // Search for patients by name across all patients
            const searchResults = await searchPatientsByName(domName);
            if (!isMounted) return;

            if (searchResults.length > 0) {
              // Found matching patient(s) by name
              matchedPatient = searchResults[0]; // Use the most recent one
              odisLogger.debug('Found patient by DOM name search', {
                domName,
                patientId: matchedPatient.id,
              });
            } else {
              // No matching patient found - create a placeholder to show "No case for [name]"
              matchedPatient = {
                id: `dom:${domName}`,
                name: domName,
                latest_case_id: '',
                latest_case_date: getCurrentISOString(),
              };
              odisLogger.debug('No case found for DOM name, using placeholder', { domName });
            }
          }
        }

        // If we have a matched patient (by consultation ID with transcriptions or DOM name)
        if (matchedPatient) {
          setSelectedPatient(matchedPatient);
        } else {
          // No matched patient - don't auto-select
          setSelectedPatient(null);
          return;
        }

        const patientToSelect = matchedPatient;

        // Check if patient has SOAP notes (skip for DOM-only placeholders)
        if (!patientToSelect.id.startsWith('dom:')) {
          try {
            const soapNote = await fetchPatientLatestSoapNote(patientToSelect.id);
            if (isMounted) setSelectedPatientHasNotes(!!soapNote);
          } catch (error) {
            odisLogger.error('❌ Error checking for SOAP notes', { error });
            if (isMounted) setSelectedPatientHasNotes(false);
          }
        } else {
          // DOM-only patient (no case)
          if (isMounted) setSelectedPatientHasNotes(false);
        }
      } catch (error) {
        odisLogger.error('Error fetching patient data', { error });

        // If Supabase fetch fails, still try to use DOM-detected name so the UI shows context
        try {
          const domName = detectIdexxPatientNameFromDom();
          if (domName && isMounted) {
            setSelectedPatient({
              id: `dom:${domName}`,
              name: domName,
              latest_case_id: '',
              latest_case_date: getCurrentISOString(),
            });
          }
        } catch {
          // ignore
        }
      }
    };

    initPatientData();

    return () => {
      isMounted = false;
    };
  }, [user, consultationId]); // Re-run when user auth state or consultationId changes

  return {
    selectedPatient,
    selectedPatientHasNotes,
  };
};
