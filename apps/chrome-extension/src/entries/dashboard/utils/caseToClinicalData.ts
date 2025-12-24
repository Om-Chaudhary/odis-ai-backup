import { getCurrentISOString } from '@odis-ai/extension/shared';
import type { DashboardCase } from '../hooks/useDailyDischarges';

/**
 * ClinicalData type matching the DischargeService interface
 */
export interface ClinicalData {
  patient: {
    name: string;
    species: string;
    breed: string;
    dateOfBirth?: string;
    sex?: string;
    weight?: string;
    weightUnit?: string;
  };
  client: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  consultation: {
    id: string;
    date: string;
    reason: string;
    notes: string;
  };
  clinic: {
    name: string;
    phone: string;
    emergencyPhone: string;
  };
  provider: {
    name: string;
  };
  existingCaseId?: string | null;
}

/**
 * Transforms a DashboardCase into ClinicalData format required for discharge workflow
 * @param caseItem - The dashboard case to transform
 * @param notes - Optional notes override (if fetched separately)
 * @returns ClinicalData object ready for discharge workflow
 */
export const caseToClinicalData = (caseItem: DashboardCase, notes?: string): ClinicalData => {
  const meta = caseItem.metadata as Record<string, unknown> | null;
  const idexx = (meta?.idexx as Record<string, unknown>) || {};

  // Use provided notes or fall back to metadata notes
  const consultationNotes = notes || (idexx.notes as string | undefined) || 'No notes available';

  // Parse owner name into first/last name
  const ownerName = caseItem.hydrated?.ownerName || '';
  const nameParts = ownerName.split(' ');
  const firstName = nameParts[0] || 'Owner';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    patient: {
      name: caseItem.hydrated?.patientName || (idexx.patient_name as string) || 'Unknown',
      species: (idexx.patient_species as string) || 'unknown',
      breed: (idexx.patient_breed as string) || 'unknown',
      sex: 'unknown', // Not always available in case metadata
      dateOfBirth: 'unknown',
      weight: 'unknown',
    },
    client: {
      firstName,
      lastName,
      phone: caseItem.hydrated?.ownerPhone || '',
      email: caseItem.hydrated?.ownerEmail || '',
    },
    consultation: {
      id: (idexx.appointment_id as string) || 'manual',
      date: caseItem.scheduled_at || getCurrentISOString(),
      reason: (idexx.appointment_reason as string) || 'Discharge',
      notes: consultationNotes,
    },
    clinic: {
      name: 'Veterinary Clinic', // TODO: Pull from user profile if possible
      phone: '',
      emergencyPhone: '',
    },
    provider: {
      name: (idexx.provider_name as string) || 'Veterinarian',
    },
    existingCaseId: caseItem.id,
  };
};
