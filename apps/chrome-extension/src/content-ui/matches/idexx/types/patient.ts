/**
 * Patient-related types
 */

export interface PatientWithCase {
  id: string;
  name: string;
  latest_case_id: string;
  latest_case_date: string;
}
