/**
 * Sync Tracking Module
 *
 * Manages schedule_syncs records for auditing sync operations.
 */

import { getSupabaseClient } from '@odis-ai/extension-shared';
import type { Database } from '@database-types';

type SyncType = 'schedule' | 'notes' | 'full';
type SyncStatus = 'in_progress' | 'completed' | 'failed' | 'partial';

interface CreateSyncOptions {
  userId: string;
  syncDate: Date;
  syncType: SyncType;
  metadata?: Record<string, unknown>;
}

interface UpdateSyncOptions {
  status?: SyncStatus;
  completedAt?: Date;
  totalItems?: number;
  syncedCount?: number;
  skippedCount?: number;
  failedCount?: number;
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

type ScheduleSync = Database['public']['Tables']['schedule_syncs']['Row'];

/**
 * Create a new sync tracking record
 */
const createSyncRecord = async (options: CreateSyncOptions): Promise<ScheduleSync> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('schedule_syncs')
    .insert({
      user_id: options.userId,
      sync_date: options.syncDate.toISOString().split('T')[0],
      sync_type: options.syncType,
      status: 'in_progress',
      metadata: {
        ...options.metadata,
        triggered_by: 'manual',
        source: 'idexx_neo',
      },
    })
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation (sync already exists)
    if (error.code === '23505') {
      // Return existing sync record
      const { data: existing, error: existingError } = await supabase
        .from('schedule_syncs')
        .select()
        .eq('user_id', options.userId)
        .eq('sync_date', options.syncDate.toISOString().split('T')[0])
        .eq('sync_type', options.syncType)
        .single();

      if (existingError) {
        throw new Error(`Failed to fetch existing sync record: ${existingError.message}`);
      }

      if (existing) return existing;
    }
    throw new Error(`Failed to create sync record: ${error.message}`);
  }

  return data;
};

/**
 * Update an existing sync tracking record
 */
const updateSyncRecord = async (syncId: string, updates: UpdateSyncOptions): Promise<void> => {
  const supabase = getSupabaseClient();

  const updateData: Record<string, unknown> = {};

  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt.toISOString();
  if (updates.totalItems !== undefined) updateData.total_items = updates.totalItems;
  if (updates.syncedCount !== undefined) updateData.synced_count = updates.syncedCount;
  if (updates.skippedCount !== undefined) updateData.skipped_count = updates.skippedCount;
  if (updates.failedCount !== undefined) updateData.failed_count = updates.failedCount;
  if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;
  if (updates.errorDetails !== undefined) updateData.error_details = updates.errorDetails;
  if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

  const { error } = await supabase.from('schedule_syncs').update(updateData).eq('id', syncId);

  if (error) {
    throw new Error(`Failed to update sync record: ${error.message}`);
  }
};

/**
 * Get sync history for a user
 */
const getSyncHistory = async (userId: string, limit: number = 10): Promise<ScheduleSync[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('schedule_syncs')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch sync history: ${error.message}`);
  }

  return data || [];
};

/**
 * Get the most recent sync for a specific date and type
 */
const getLastSync = async (userId: string, syncDate: Date, syncType: SyncType): Promise<ScheduleSync | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('schedule_syncs')
    .select('*')
    .eq('user_id', userId)
    .eq('sync_date', syncDate.toISOString().split('T')[0])
    .eq('sync_type', syncType)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch last sync: ${error.message}`);
  }

  return data;
};

export { createSyncRecord, updateSyncRecord, getSyncHistory, getLastSync };
export type { SyncType, SyncStatus, CreateSyncOptions, UpdateSyncOptions, ScheduleSync };
