/**
 * Event Tracker
 *
 * Utility functions for tracking user events, feature usage, sessions, and errors
 *
 * IMPORTANT: All analytics functions are designed to be non-blocking.
 * They use timeouts to prevent hanging and should never block the main application flow.
 */

/* eslint-disable func-style */

import { getSupabaseClient } from '../supabase/client';
import { logger } from '../utils/logger';
import type {
  UserEvent,
  FeatureUsage,
  SessionAnalytics,
  ErrorLog,
  TrackEventOptions,
  AnalyticsPlatform,
} from './types';

const analyticsLogger = logger.child('[ANALYTICS]');

// Timeout constants for analytics operations
const ANALYTICS_TIMEOUT_MS = 5000; // 5 seconds max for any analytics operation
const AUTH_CHECK_TIMEOUT_MS = 3000; // 3 seconds max for auth check

/**
 * Wrap a promise with a timeout
 * Returns undefined if timeout is reached (non-blocking behavior)
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T | undefined> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<undefined>(resolve => {
    timeoutId = setTimeout(() => {
      analyticsLogger.warn(`Analytics operation timed out: ${operationName}`, { timeoutMs });
      resolve(undefined);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    analyticsLogger.warn(`Analytics operation failed: ${operationName}`, { error });
    return undefined;
  }
}

/**
 * Get user with timeout - returns null if auth check times out
 */
async function getUserWithTimeout(): Promise<{ id: string } | null> {
  try {
    const supabase = getSupabaseClient();
    const result = await withTimeout(supabase.auth.getUser(), AUTH_CHECK_TIMEOUT_MS, 'getUser');
    return result?.data?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Detect the current platform
 */
export function detectPlatform(): AnalyticsPlatform {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    // Check if it's Firefox (Firefox also has chrome.runtime but with different properties)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (globalThis as any).browser !== 'undefined' && (globalThis as any).browser.runtime) {
      return 'firefox_extension';
    }
    return 'chrome_extension';
  }

  // For iOS, this would be detected differently (likely via user agent or app context)
  // For now, default to web
  if (typeof window !== 'undefined') {
    // Could check user agent for iOS
    const userAgent = window.navigator?.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      return 'ios';
    }
    return 'web';
  }

  return 'web';
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get or create session ID from storage
 */
export async function getSessionId(): Promise<string> {
  try {
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) {
      return stored;
    }

    const sessionId = generateSessionId();
    sessionStorage.setItem('analytics_session_id', sessionId);
    return sessionId;
  } catch {
    // Fallback if sessionStorage is not available
    return generateSessionId();
  }
}

/**
 * Track a user event
 *
 * This function is designed to be non-blocking. It will timeout after ANALYTICS_TIMEOUT_MS
 * and will never throw errors that could break the calling code.
 */
export async function trackEvent(event: Omit<UserEvent, 'platform'>, options: TrackEventOptions = {}): Promise<void> {
  try {
    // Use timeout-wrapped auth check
    const user = await getUserWithTimeout();

    if (!user) {
      analyticsLogger.debug('Cannot track event: user not authenticated or auth timed out');
      return;
    }

    const platform = detectPlatform();
    const sessionId = await getSessionId();

    const fullEvent: UserEvent = {
      ...event,
      platform,
      session_id: sessionId,
    };

    // Insert event with timeout
    const supabase = getSupabaseClient();
    const insertResult = await withTimeout(
      Promise.resolve(
        supabase.from('user_events').insert({
          user_id: user.id,
          event_type: fullEvent.event_type,
          event_category: fullEvent.event_category,
          event_action: fullEvent.event_action,
          platform: fullEvent.platform,
          source: fullEvent.source,
          session_id: fullEvent.session_id,
          case_id: fullEvent.case_id,
          patient_id: fullEvent.patient_id,
          discharge_summary_id: fullEvent.discharge_summary_id,
          scheduled_call_id: fullEvent.scheduled_call_id,
          scheduled_email_id: fullEvent.scheduled_email_id,
          metadata: fullEvent.metadata || {},
          properties: fullEvent.properties || {},
          success: fullEvent.success ?? true,
          error_message: fullEvent.error_message,
          error_code: fullEvent.error_code,
        }),
      ),
      ANALYTICS_TIMEOUT_MS,
      'insert_user_event',
    );

    if (insertResult?.error) {
      analyticsLogger.debug('Failed to track event', { error: insertResult.error, event_type: fullEvent.event_type });
      return;
    }

    analyticsLogger.debug('Event tracked', { event_type: fullEvent.event_type });

    // Track feature usage if requested (fire and forget - don't await)
    if (options.trackFeatureUsage && event.event_category === 'feature') {
      trackFeatureUsage({
        feature_name: event.event_type,
        feature_category: event.event_category,
        platform,
      }).catch(() => {}); // Fire and forget
    }

    // Update session analytics if requested (fire and forget - don't await)
    if (options.updateSession) {
      updateSessionAnalytics({
        session_id: sessionId,
        platform,
        event_type: event.event_type,
        event_category: event.event_category,
      }).catch(() => {}); // Fire and forget
    }
  } catch (error) {
    analyticsLogger.debug('Error tracking event', { error, event_type: event.event_type });
    // Don't throw - analytics failures shouldn't break the app
  }
}

/**
 * Track feature usage
 *
 * Non-blocking function with timeout protection.
 */
export async function trackFeatureUsage(feature: FeatureUsage): Promise<void> {
  try {
    const user = await getUserWithTimeout();

    if (!user) {
      return;
    }

    const supabase = getSupabaseClient();

    // Try to update existing feature usage record with timeout
    const existingResult = await withTimeout(
      Promise.resolve(
        supabase
          .from('feature_usage')
          .select('id, usage_count')
          .eq('user_id', user.id)
          .eq('feature_name', feature.feature_name)
          .eq('platform', feature.platform)
          .single(),
      ),
      ANALYTICS_TIMEOUT_MS,
      'select_feature_usage',
    );

    const existing = existingResult?.data;

    if (existing) {
      // Update existing record with timeout
      await withTimeout(
        Promise.resolve(
          supabase
            .from('feature_usage')
            .update({
              usage_count: existing.usage_count + 1,
              last_used_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id),
        ),
        ANALYTICS_TIMEOUT_MS,
        'update_feature_usage',
      );
    } else {
      // Insert new record with timeout
      await withTimeout(
        Promise.resolve(
          supabase.from('feature_usage').insert({
            user_id: user.id,
            feature_name: feature.feature_name,
            feature_category: feature.feature_category,
            platform: feature.platform,
            usage_count: 1,
            first_used_at: new Date().toISOString(),
            last_used_at: new Date().toISOString(),
            metadata: feature.metadata || {},
          }),
        ),
        ANALYTICS_TIMEOUT_MS,
        'insert_feature_usage',
      );
    }
  } catch (error) {
    analyticsLogger.debug('Error tracking feature usage', { error, feature_name: feature.feature_name });
  }
}

/**
 * Start a new session
 *
 * Non-blocking function with timeout protection.
 * Returns a session ID immediately, database insert happens in background.
 */
export async function startSession(analytics: Partial<SessionAnalytics> = {}): Promise<string> {
  const sessionId = analytics.session_id || (await getSessionId());

  try {
    const user = await getUserWithTimeout();

    if (!user) {
      return sessionId;
    }

    const platform = detectPlatform();

    const sessionData: Partial<SessionAnalytics> = {
      session_id: sessionId,
      platform,
      started_at: new Date().toISOString(),
      event_count: 0,
      cases_created: 0,
      discharges_sent: 0,
      actions_performed: [],
      features_used: [],
      ...analytics,
    };

    const supabase = getSupabaseClient();

    // Insert with timeout - don't block on this
    const result = await withTimeout(
      Promise.resolve(
        supabase.from('session_analytics').insert({
          user_id: user.id,
          session_id: sessionData.session_id!,
          platform: sessionData.platform!,
          started_at: sessionData.started_at,
          event_count: sessionData.event_count || 0,
          cases_created: sessionData.cases_created || 0,
          discharges_sent: sessionData.discharges_sent || 0,
          actions_performed: sessionData.actions_performed || [],
          features_used: sessionData.features_used || [],
          user_agent: sessionData.user_agent,
          extension_version: sessionData.extension_version,
          app_version: sessionData.app_version,
          device_info: sessionData.device_info,
          metadata: sessionData.metadata || {},
        }),
      ),
      ANALYTICS_TIMEOUT_MS,
      'insert_session',
    );

    if (result?.error) {
      analyticsLogger.debug('Failed to start session in DB', { error: result.error });
    } else {
      analyticsLogger.debug('Session started', { session_id: sessionId });
    }

    return sessionId;
  } catch (error) {
    analyticsLogger.debug('Error starting session', { error });
    return sessionId;
  }
}

/**
 * Update session analytics
 *
 * Non-blocking function with timeout protection.
 */
export async function updateSessionAnalytics(update: {
  session_id: string;
  platform: AnalyticsPlatform;
  event_type?: string;
  event_category?: string;
  action?: string;
  feature?: string;
  case_created?: boolean;
  discharge_sent?: boolean;
}): Promise<void> {
  try {
    const user = await getUserWithTimeout();

    if (!user) {
      return;
    }

    const supabase = getSupabaseClient();

    // Get current session data with timeout
    const sessionResult = await withTimeout(
      Promise.resolve(
        supabase
          .from('session_analytics')
          .select('*')
          .eq('user_id', user.id)
          .eq('session_id', update.session_id)
          .single(),
      ),
      ANALYTICS_TIMEOUT_MS,
      'select_session',
    );

    const session = sessionResult?.data;

    if (!session) {
      // Create session if it doesn't exist (fire and forget)
      startSession({
        session_id: update.session_id,
        platform: update.platform,
      }).catch(() => {});
      return;
    }

    // Build update object
    const updates: Partial<SessionAnalytics> = {
      event_count: (session.event_count || 0) + 1,
    };

    // Update arrays
    const actionsPerformed = [...(session.actions_performed || [])];
    if (update.action && !actionsPerformed.includes(update.action)) {
      actionsPerformed.push(update.action);
      updates.actions_performed = actionsPerformed;
    }

    const featuresUsed = [...(session.features_used || [])];
    if (update.feature && !featuresUsed.includes(update.feature)) {
      featuresUsed.push(update.feature);
      updates.features_used = featuresUsed;
    }

    if (update.case_created) {
      updates.cases_created = (session.cases_created || 0) + 1;
    }

    if (update.discharge_sent) {
      updates.discharges_sent = (session.discharges_sent || 0) + 1;
    }

    // Update with timeout
    await withTimeout(
      Promise.resolve(supabase.from('session_analytics').update(updates).eq('id', session.id)),
      ANALYTICS_TIMEOUT_MS,
      'update_session',
    );
  } catch (error) {
    analyticsLogger.debug('Error updating session analytics', { error, session_id: update.session_id });
  }
}

/**
 * End a session
 *
 * Non-blocking function with timeout protection.
 */
export async function endSession(sessionId: string): Promise<void> {
  try {
    const user = await getUserWithTimeout();

    if (!user) {
      return;
    }

    const supabase = getSupabaseClient();

    // Get session with timeout
    const sessionResult = await withTimeout(
      Promise.resolve(
        supabase
          .from('session_analytics')
          .select('started_at')
          .eq('user_id', user.id)
          .eq('session_id', sessionId)
          .single(),
      ),
      ANALYTICS_TIMEOUT_MS,
      'select_session_for_end',
    );

    const session = sessionResult?.data;

    if (!session || !session.started_at) {
      return;
    }

    const endedAt = new Date();
    const startedAt = new Date(session.started_at);
    const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    // Update with timeout
    const updateResult = await withTimeout(
      Promise.resolve(
        supabase
          .from('session_analytics')
          .update({
            ended_at: endedAt.toISOString(),
            duration_seconds: durationSeconds,
            updated_at: endedAt.toISOString(),
          })
          .eq('user_id', user.id)
          .eq('session_id', sessionId),
      ),
      ANALYTICS_TIMEOUT_MS,
      'update_session_end',
    );

    if (updateResult?.error) {
      analyticsLogger.debug('Failed to end session', { error: updateResult.error, sessionId });
    } else {
      analyticsLogger.debug('Session ended', { sessionId, durationSeconds });
      // Clear session ID from storage
      try {
        sessionStorage.removeItem('analytics_session_id');
      } catch {
        // Ignore storage errors
      }
    }
  } catch (error) {
    analyticsLogger.debug('Error ending session', { error, sessionId });
  }
}

/**
 * Log an error
 *
 * Non-blocking function with timeout protection.
 */
export async function logError(error: ErrorLog): Promise<void> {
  try {
    const user = await getUserWithTimeout();
    const supabase = getSupabaseClient();

    // Insert with timeout
    const result = await withTimeout(
      Promise.resolve(
        supabase.from('error_logs').insert({
          user_id: user?.id || null,
          error_type: error.error_type,
          error_code: error.error_code,
          error_message: error.error_message,
          platform: error.platform,
          source: error.source,
          case_id: error.case_id,
          event_id: error.event_id,
          stack_trace: error.stack_trace,
          error_data: error.error_data || {},
          request_data: error.request_data,
          response_data: error.response_data,
          resolved: error.resolved || false,
          resolution_notes: error.resolution_notes,
        }),
      ),
      ANALYTICS_TIMEOUT_MS,
      'insert_error_log',
    );

    if (result?.error) {
      analyticsLogger.debug('Failed to log error to DB', { error: result.error, error_type: error.error_type });
    } else {
      analyticsLogger.debug('Error logged', { error_type: error.error_type });
    }
  } catch (err) {
    analyticsLogger.debug('Error logging error', { error: err, error_type: error.error_type });
  }
}

/**
 * Helper function to track errors with automatic event creation
 */
export async function trackError(
  error: Error,
  context: {
    source?: string;
    case_id?: string;
    event_id?: string;
    request_data?: Record<string, unknown>;
    response_data?: Record<string, unknown>;
    error_type?: ErrorLog['error_type'];
  } = {},
): Promise<void> {
  const platform = detectPlatform();

  // Log to error_logs table
  await logError({
    error_type: context.error_type || 'runtime_error',
    error_message: error.message,
    error_code: error.name,
    platform,
    source: context.source,
    case_id: context.case_id,
    event_id: context.event_id,
    stack_trace: error.stack,
    error_data: {
      name: error.name,
      message: error.message,
    },
    request_data: context.request_data,
    response_data: context.response_data,
  });

  // Also track as an error event
  await trackEvent(
    {
      event_type: `error_${context.error_type?.replace('_error', '') || 'runtime'}`,
      event_category: 'error',
      event_action: 'fail',
      source: context.source,
      case_id: context.case_id,
      success: false,
      error_message: error.message,
      error_code: error.name,
      metadata: {
        error_name: error.name,
        stack_trace: error.stack,
      },
    },
    { logError: false }, // Already logged above
  );
}
