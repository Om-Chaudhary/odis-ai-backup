/**
 * IDEXX Appointment Management Types
 * Types for creating, searching, and managing appointments
 */

/**
 * Input for creating a new appointment
 */
export interface CreateAppointmentInput {
  // Existing patient workflow
  patientId?: string; // For existing patients
  patientName?: string; // For lookup or new patients
  clientName?: string; // Owner name
  clientId?: string; // For existing clients

  // New client/patient data (if creating new)
  newClient?: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  newPatient?: {
    name: string;
    species: string;
    breed?: string;
    age?: string;
    color?: string;
    sex?: string;
    weight?: string;
  };

  // Appointment details
  providerId?: string;
  providerName?: string;
  reason: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  roomId?: string;
  note?: string;
  appointmentTypeId?: string; // If IDEXX requires appointment type
}

/**
 * Result of an appointment operation (create, update, cancel)
 */
export interface AppointmentOperationResult {
  success: boolean;
  appointmentId?: string;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * IDEXX patient search result
 */
export interface IdexxPatient {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  species: string;
  breed?: string;
  age?: string;
  color?: string;
  sex?: string;
  weight?: string;
}

/**
 * IDEXX client/owner information
 */
export interface IdexxClient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/**
 * IDEXX provider information
 */
export interface IdexxProvider {
  id: string;
  name: string;
  email?: string;
  licenseNumber?: string;
}

/**
 * IDEXX appointment type/category
 */
export interface IdexxAppointmentType {
  id: string;
  name: string;
  duration?: number; // Duration in minutes
  color?: string;
}

/**
 * IDEXX room/resource information
 */
export interface IdexxRoom {
  id: string;
  name: string;
  capacity?: number;
}

/**
 * Search patient parameters
 */
export interface SearchPatientParams {
  query: string; // Name or ID
  limit?: number; // Max results to return
}

/**
 * Patient search result wrapper
 */
export interface PatientSearchResult {
  patients: IdexxPatient[];
  totalCount: number;
}

/**
 * IDEXX API appointment creation payload
 * Based on expected API structure (to be confirmed via discovery)
 */
export interface IdexxAppointmentCreatePayload {
  patient_id?: string | number;
  client_id?: string | number;
  provider_id?: string | number;
  appointment_type_id?: string | number;
  room_id?: string | number;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM or HH:MM:SS
  end_time: string; // HH:MM or HH:MM:SS
  reason?: string;
  notes?: string;
  status?: string; // Default: "Scheduled"
}

/**
 * IDEXX API appointment response
 * Based on expected API structure (to be confirmed via discovery)
 */
export interface IdexxAppointmentResponse {
  id: string | number;
  appointment_id?: string | number;
  patient_id: string | number;
  client_id: string | number;
  provider_id?: string | number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  reason?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Options for appointment search/filtering
 */
export interface AppointmentSearchOptions {
  patientId?: string;
  clientId?: string;
  providerId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status?: string;
}

/**
 * Cancel appointment input
 */
export interface CancelAppointmentInput {
  appointmentId: string;
  /** Cancel action: "cancel" for soft cancel (recommended), "delete" for hard delete */
  action?: "cancel" | "delete";
  reason?: string;
}

/**
 * IDEXX appointment view data (lookup data)
 * Response from GET /appointments/getAppointmentView
 */
export interface IdexxAppointmentViewData {
  slotInterval: number;
  businessHours: Array<{
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
  }>;
  appointmentTypes: IdexxAppointmentType[];
  appointmentRooms: IdexxRoom[];
  providers: IdexxProvider[];
  deputyEnabled: boolean;
}

/**
 * IDEXX appointment details
 * Response from GET /appointments/getAppointment?id={id}
 */
export interface IdexxAppointmentDetails {
  id: string;
  status: string;
  startAtLocal: string;
  endAtLocal: string;
  notes: string;
  deleted: boolean;
  block: boolean;
  bookedBy: string;
  createdAt: string;
  patient: {
    id: number;
    name: string;
    breed?: { id: number; name: string };
    species?: { id: number; name: string };
    gender?: { id: number; name: string };
    client: {
      id: number;
      firstName: string;
      lastName: string;
      email?: string;
      homePhone?: string;
      mobilePhone?: string;
    };
  };
  appointmentType: {
    id: number;
    name: string;
    duration: number;
    color: string;
  };
  appointmentRoom: {
    id: number;
    name: string;
    position: number;
  };
  provider: {
    id: number;
    name: string;
  };
  cancelledReason: string | null;
}

/**
 * Result of getting appointment details
 */
export interface GetAppointmentResult {
  success: boolean;
  appointment?: IdexxAppointmentDetails;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * IDEXX multipart form data for appointment creation
 * Based on actual API discovery
 */
export interface IdexxAppointmentCreateFormData {
  patient_id: string | number;
  type_id: string | number;
  user_id: string | number;
  room: string | number;
  appointment_date: string; // YYYY-MM-DD
  time: string; // HH:MM
  time_end: string; // HH:MM
  useRealEndTime: string; // "true"
}
