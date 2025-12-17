import { extractConsultationId } from '../../utils/extraction/consultation-fetcher';
import { fetchPatientLatestSoapNote } from '../../utils/extraction/patient-fetcher';
import { extractVitalsFromNotes, autoFillVitalSigns } from '../../utils/extraction/vitals-autofill';
import { formatSoapNoteAsHtml } from '../../utils/formatting/soap-note-fetcher';
import { insertTemplate } from '../../utils/transformation/template-inserter';
import { logger, trackEvent } from '@odis-ai/extension-shared';
import { useState } from 'react';
import type { PatientWithCase } from '../../types';
import type { CKEditorInfo } from '../../utils/dom/ckeditor-detector';

const odisLogger = logger.child('[ODIS]');

/**
 * Hook for managing SOAP note insertion
 */
export const useNoteInsertion = (ckeditorInfo: CKEditorInfo) => {
  const [isInsertingNote, setIsInsertingNote] = useState(false);

  const insertNote = async (selectedPatient: PatientWithCase | null) => {
    if (!selectedPatient || isInsertingNote) return;

    try {
      setIsInsertingNote(true);

      const soapNote = await fetchPatientLatestSoapNote(selectedPatient.id);

      if (!soapNote) {
        alert(`No SOAP notes found for ${selectedPatient.name}. Please create a SOAP note first.`);
        return;
      }

      const htmlContent = formatSoapNoteAsHtml(soapNote);
      await insertTemplate(ckeditorInfo, htmlContent, {
        position: 'end',
        autoEnableEditMode: true,
      });

      // Track note insertion
      await trackEvent(
        {
          event_type: 'note_inserted',
          event_category: 'content',
          event_action: 'insert',
          source: 'idexx_extension',
          patient_id: selectedPatient.id,
          case_id: selectedPatient.latest_case_id || undefined,
          success: true,
          metadata: {
            patient_name: selectedPatient.name,
            has_soap_note: !!soapNote,
          },
        },
        { trackFeatureUsage: true, updateSession: true },
      );

      // Auto-extract and fill vitals from the inserted note
      try {
        // Get the plain text content from the SOAP note
        const plainTextContent = `
          Subjective: ${soapNote.subjective || ''}
          Objective: ${soapNote.objective || ''}
          Assessment: ${soapNote.assessment || ''}
          Plan: ${soapNote.plan || ''}
        `;

        // Extract vitals (without case_id for now, just auto-fill the form)
        const consultationId = extractConsultationId();
        const result = await extractVitalsFromNotes(plainTextContent, undefined, consultationId ?? undefined);

        if (result.success && Object.keys(result.vitals).length > 0) {
          // Auto-fill the vital signs form
          autoFillVitalSigns(result.vitals);

          // Track vitals extraction
          await trackEvent(
            {
              event_type: 'vitals_extracted',
              event_category: 'content',
              event_action: 'extract',
              source: 'idexx_extension',
              patient_id: selectedPatient.id,
              case_id: selectedPatient.latest_case_id || undefined,
              success: true,
              metadata: {
                vitals_count: Object.keys(result.vitals).length,
                extracted_from: 'soap_note',
              },
            },
            { trackFeatureUsage: true, updateSession: true },
          );
        }
      } catch (vitalError) {
        // Don't fail the whole operation if vitals extraction fails
        odisLogger.warn('Failed to extract vitals from note', { error: vitalError });
      }
    } catch (error) {
      odisLogger.error('Error inserting SOAP note', { error });

      if (error instanceof Error && error.message.includes('not signed in')) {
        alert('ODIS Extension: Please sign in to the extension to insert SOAP notes.');
      } else {
        alert(`ODIS Extension: Error loading SOAP note: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsInsertingNote(false);
    }
  };

  return {
    isInsertingNote,
    insertNote,
  };
};
