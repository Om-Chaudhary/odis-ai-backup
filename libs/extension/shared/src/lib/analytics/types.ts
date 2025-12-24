/**
 * Analytics Types and Interfaces
 *
 * Type definitions for event tracking across extension and iOS platforms
 */

/**
 * Supported platforms for analytics
 */
export type AnalyticsPlatform = 'chrome_extension' | 'firefox_extension' | 'ios' | 'web';

/**
 * Event categories for grouping related events
 */
export type EventCategory =
  | 'auth'
  | 'case'
  | 'discharge'
  | 'template'
  | 'content'
  | 'dashboard'
  | 'sync'
  | 'error'
  | 'feature';

/**
 * Event actions (verbs)
 */
export type EventAction =
  | 'sign_up'
  | 'sign_in'
  | 'sign_out'
  | 'create'
  | 'update'
  | 'view'
  | 'delete'
  | 'schedule'
  | 'send'
  | 'insert'
  | 'extract'
  | 'sync'
  | 'generate'
  | 'start'
  | 'complete'
  | 'fail'
  | 'select'
  | 'cancel';

/**
 * Specific event types
 */
export type EventType =
  // Authentication
  | 'auth_sign_up'
  | 'auth_sign_in'
  | 'auth_sign_out'
  | 'auth_onboarding_completed'
  // Case management
  | 'case_ingested'
  | 'case_viewed'
  | 'case_updated'
  | 'case_deleted'
  // Discharge workflow
  | 'discharge_workflow_started'
  | 'discharge_workflow_completed'
  | 'discharge_summary_generated'
  | 'email_scheduled'
  | 'email_sent'
  | 'email_failed'
  | 'call_scheduled'
  | 'call_initiated'
  | 'call_completed'
  | 'call_failed'
  // Templates
  | 'template_inserted'
  | 'template_selected'
  // Content actions
  | 'note_inserted'
  | 'vitals_extracted'
  // Sync actions
  | 'patient_synced'
  | 'schedule_synced'
  // Dashboard
  | 'dashboard_send_single'
  | 'dashboard_send_all'
  // Errors
  | 'error_api'
  | 'error_validation'
  | 'error_network'
  | 'error_runtime';

/**
 * Feature names for feature usage tracking
 */
export type FeatureName =
  | 'discharge_scheduling'
  | 'discharge_orchestration'
  | 'template_insertion'
  | 'soap_template_insertion'
  | 'discharge_template_insertion'
  | 'note_insertion'
  | 'vitals_extraction'
  | 'patient_sync'
  | 'schedule_sync'
  | 'dashboard_single_send'
  | 'dashboard_bulk_send'
  | 'case_ingestion'
  | 'email_scheduling'
  | 'call_scheduling';

/**
 * Feature categories
 */
export type FeatureCategory = 'discharge' | 'templates' | 'extraction' | 'sync' | 'dashboard' | 'case';

/**
 * Base user event interface
 */
export interface UserEvent {
  /** Specific event type identifier */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  event_type: EventType | string;
  /** High-level category grouping */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  event_category: EventCategory | string;
  /** Action verb */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  event_action: EventAction | string;
  /** Platform where event occurred */
  platform: AnalyticsPlatform;
  /** Source context (e.g., 'idexx_extension', 'dashboard', 'mobile_app') */
  source?: string;
  /** Session identifier for grouping related events */
  session_id?: string;
  /** Related case ID */
  case_id?: string;
  /** Related patient ID */
  patient_id?: string;
  /** Related discharge summary ID */
  discharge_summary_id?: string;
  /** Related scheduled call ID */
  scheduled_call_id?: string;
  /** Related scheduled email ID */
  scheduled_email_id?: string;
  /** Flexible event-specific data */
  metadata?: Record<string, unknown>;
  /** Additional properties (duration, success metrics, etc.) */
  properties?: Record<string, unknown>;
  /** Whether the event represents a successful action */
  success?: boolean;
  /** Error message if event failed */
  error_message?: string;
  /** Error code if applicable */
  error_code?: string;
}

/**
 * Feature usage tracking interface
 */
export interface FeatureUsage {
  /** Name of the feature */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  feature_name: FeatureName | string;
  /** Category of the feature */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  feature_category: FeatureCategory | string;
  /** Platform where feature is used */
  platform: AnalyticsPlatform;
  /** Aggregated metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Session analytics interface
 */
export interface SessionAnalytics {
  /** Unique session identifier */
  session_id: string;
  /** Platform where session occurred */
  platform: AnalyticsPlatform;
  /** Session start time */
  started_at?: Date | string;
  /** Session end time */
  ended_at?: Date | string;
  /** Session duration in seconds */
  duration_seconds?: number;
  /** Number of events in this session */
  event_count?: number;
  /** Array of action types performed */
  actions_performed?: string[];
  /** Array of features used */
  features_used?: string[];
  /** Number of cases created */
  cases_created?: number;
  /** Number of discharges sent */
  discharges_sent?: number;
  /** User agent string */
  user_agent?: string;
  /** Extension version (for extension sessions) */
  extension_version?: string;
  /** App version (for iOS sessions) */
  app_version?: string;
  /** Device information */
  device_info?: Record<string, unknown>;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Error log interface
 */
export interface ErrorLog {
  /** Type of error */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  error_type: 'api_error' | 'validation_error' | 'network_error' | 'runtime_error' | string;
  /** Optional error code */
  error_code?: string;
  /** Human-readable error message */
  error_message: string;
  /** Platform where error occurred */
  platform: AnalyticsPlatform;
  /** Source location (component, function, API endpoint) */
  source?: string;
  /** Related case ID */
  case_id?: string;
  /** Related event ID */
  event_id?: string;
  /** Full stack trace if available */
  stack_trace?: string;
  /** Additional error context */
  error_data?: Record<string, unknown>;
  /** Request payload if applicable */
  request_data?: Record<string, unknown>;
  /** Response data if applicable */
  response_data?: Record<string, unknown>;
  /** Whether error has been resolved */
  resolved?: boolean;
  /** Resolution notes */
  resolution_notes?: string;
}

/**
 * Event tracking options
 */
export interface TrackEventOptions {
  /** Whether to track feature usage automatically */
  trackFeatureUsage?: boolean;
  /** Whether to update session analytics */
  updateSession?: boolean;
  /** Whether to log errors to error_logs table */
  logError?: boolean;
  /** Additional metadata to include */
  metadata?: Record<string, unknown>;
  /** Additional properties to include */
  properties?: Record<string, unknown>;
}
