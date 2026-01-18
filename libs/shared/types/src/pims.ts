/**
 * PIMS Provider Interface
 * Abstraction for all Practice Information Management Systems (IDEXX Neo, Avimark, Cornerstone, etc.)
 */
export interface IPimsProvider {
  /**
   * Provider name (e.g., 'idexx-neo', 'ezyvet', 'cornerstone')
   */
  readonly name: string;

  /**
   * Authenticate with the PIMS using credentials
   */
  authenticate(credentials: PimsCredentials): Promise<boolean>;

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean;

  /**
   * Fetch schedule configuration from PIMS
   * Note: Many PIMS don't expose this via API - clinics configure manually in ODIS
   * @returns Schedule config if available, null otherwise
   */
  fetchScheduleConfig?(): Promise<PimsScheduleConfig | null>;

  /**
   * Fetch appointments for a date range
   */
  fetchAppointments(startDate: Date, endDate: Date): Promise<PimsAppointment[]>;

  /**
   * Fetch consultation details by ID
   */
  fetchConsultation(consultationId: string): Promise<PimsConsultation | null>;

  /**
   * Cleanup resources (close browser, etc.)
   */
  close(): Promise<void>;
}

/**
 * PIMS authentication credentials
 */
export interface PimsCredentials {
  username: string;
  password: string;
  companyId?: string; // IDEXX-specific
  additionalFields?: Record<string, string>;
}

/**
 * PIMS schedule configuration
 */
export interface PimsScheduleConfig {
  openTime: string; // HH:mm format
  closeTime: string; // HH:mm format
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  slotDurationMinutes: number;
  defaultCapacity: number; // Max appointments per slot
  timezone: string;
  rawConfig?: unknown; // Original config from PIMS
}

/**
 * PIMS appointment data
 */
export interface PimsAppointment {
  id: string;
  consultationId: string | null;
  date: string; // YYYY-MM-DD
  startTime: Date | null;
  duration: number | null; // minutes
  status: string;
  patient: {
    id: string | null;
    name: string | null;
    species: string | null;
    breed: string | null;
  };
  client: {
    id: string | null;
    name: string | null;
    phone: string | null;
    email: string | null;
  };
  provider: {
    id: string | null;
    name: string | null;
  };
  type: string | null;
  reason: string | null;
}

/**
 * PIMS consultation details
 */
export interface PimsConsultation {
  id: string;
  /** Combined notes from consultation (SOAP notes, general notes) */
  notes: string | null;
  /** Discharge summary - critical for VAPI discharge calls */
  dischargeSummary: string | null;
  /** Products and services provided */
  productsServices: string | null;
  /** Products and services declined by client */
  declinedProductsServices: string | null;
  /** Consultation status */
  status: string;
  /** Reason for visit */
  reason: string | null;
  /** Consultation date */
  date: string | null;
}

/**
 * Sync operation result
 */
export interface SyncResult {
  success: boolean;
  syncId: string;
  stats: SyncStats;
  durationMs: number;
  errors?: Array<{
    message: string;
    context?: Record<string, unknown>;
  }>;
}

/**
 * Sync statistics
 */
export interface SyncStats {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  deleted?: number; // Reconciliation only
}

/**
 * Reconciliation result
 */
export interface ReconciliationResult extends SyncResult {
  stats: SyncStats & {
    deleted: number;
    reconciled: number;
  };
  deletedCases?: string[]; // Case IDs that were soft-deleted
}

/**
 * Sync options
 */
export interface SyncOptions {
  startDate: Date;
  endDate: Date;
  forceFullSync?: boolean;
  parallelBatchSize?: number;
}

/**
 * Inbound sync options
 */
export interface InboundSyncOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  forceFullSync?: boolean;
}

/**
 * Case sync options
 */
export interface CaseSyncOptions {
  startDate: Date;
  endDate: Date;
  parallelBatchSize?: number;
}

/**
 * Reconciliation options
 */
export interface ReconciliationOptions {
  lookbackDays?: number; // Default: 7
}
