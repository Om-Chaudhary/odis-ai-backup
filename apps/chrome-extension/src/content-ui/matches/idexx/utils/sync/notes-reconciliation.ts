/**
 * Notes Reconciliation Module
 *
 * Fetches consultation notes and products/services from IDEXX for previously synced cases
 * and updates case metadata with the clinical notes and line items.
 */

import { createSyncRecord, updateSyncRecord } from './sync-tracking';
import { fetchConsultationData } from '../extraction/consultation-fetcher';
import { getSupabaseClient, requireAuthSession, logger } from '@odis-ai/extension/shared';
import type { IdexxConsultationLine } from '../../types';
import type { Database } from '@database-types';

const odisLogger = logger.child('[ODIS:Reconciliation]');

/**
 * Format consultation line items (products/services) into a readable string
 * @param lines - Array of consultation line items
 * @param declinedOnly - If true, only return declined items; if false, only return accepted items
 * @returns Formatted string of products/services
 */
const formatProductsServices = (lines: IdexxConsultationLine[] | undefined, declinedOnly: boolean): string => {
  odisLogger.debug('🔍 Formatting products/services', {
    totalLines: lines?.length || 0,
    declinedOnly,
    hasLines: !!lines,
  });

  if (!lines || lines.length === 0) {
    odisLogger.debug('⚠️ No lines to format');
    return '';
  }

  const filtered = lines.filter(line => (declinedOnly ? line.isDeclined : !line.isDeclined));

  odisLogger.debug('🔍 Filtered products', {
    declinedOnly,
    totalLines: lines.length,
    filteredCount: filtered.length,
    filtered: filtered.map(l => ({ name: l.productService, isDeclined: l.isDeclined, qty: l.quantity })),
  });

  if (filtered.length === 0) {
    odisLogger.debug('⚠️ No products after filtering');
    return '';
  }

  const formatted = filtered
    .map(line => {
      const parts = [line.productService];
      if (line.quantity && line.quantity !== 1) {
        parts.push(`(Qty: ${line.quantity})`);
      }
      return parts.join(' ');
    })
    .join('; ');

  odisLogger.debug('✅ Formatted result', {
    declinedOnly,
    result: formatted,
  });

  return formatted;
};

type Case = Database['public']['Tables']['cases']['Row'];

interface ReconciliationOptions {
  /** Start date for cases to reconcile (inclusive) */
  startDate: Date;
  /** End date for cases to reconcile (inclusive) */
  endDate: Date;
  /** Only reconcile cases without existing consultation_notes */
  skipAlreadyReconciled?: boolean;
  /** Maximum number of cases to process (for rate limiting) */
  maxCases?: number;
  /** Callback for progress updates */
  onProgress?: (current: number, total: number, caseName: string) => void;
}

interface ReconciliationResult {
  syncId: string;
  totalCases: number;
  reconciledCount: number;
  skippedCount: number;
  failedCount: number;
  errors: Array<{ caseId: string; error: string }>;
  durationMs: number;
}

/**
 * Get cases that need notes reconciliation
 */
const getCasesNeedingReconciliation = async (userId: string, options: ReconciliationOptions): Promise<Case[]> => {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('cases')
    .select('*')
    .eq('user_id', userId)
    .eq('source', 'idexx_neo')
    .gte('scheduled_at', options.startDate.toISOString())
    .lte('scheduled_at', options.endDate.toISOString())
    .order('scheduled_at', { ascending: true });

  if (options.maxCases) {
    query = query.limit(options.maxCases);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch cases: ${error.message}`);
  }

  // Filter in memory if needed (Supabase doesn't support JSONB null checks in RLS context easily)
  let cases = data || [];

  if (options.skipAlreadyReconciled) {
    cases = cases.filter(c => {
      const metadata = c.metadata as Record<string, unknown> | null;
      const idexx = metadata?.idexx as Record<string, unknown> | undefined;
      return !idexx?.consultation_notes;
    });
  }

  return cases;
};

/**
 * Lookup consultation ID from appointment ID
 * This may require calling an IDEXX API or navigating to the consultation page
 */
const lookupConsultationId = async (appointmentId: string): Promise<string | null> => {
  // Implementation depends on IDEXX API capabilities
  // Option 1: IDEXX provides appointment-to-consultation mapping API
  // Option 2: Parse from consultation page URL when user navigates there
  // Option 3: Store mapping during initial sync if available

  // For now, return null - implementation TBD based on IDEXX API research
  // In practice, the consultation_id should be captured during the initial sync
  // from the appointments API response if available
  odisLogger.debug('Consultation ID lookup not implemented', { appointmentId });
  return null;
};

/**
 * Reconcile notes for a single case
 */
const reconcileSingleCase = async (
  caseItem: Case,
  supabase: ReturnType<typeof getSupabaseClient>,
): Promise<boolean> => {
  const metadata = caseItem.metadata as Record<string, unknown> | null;
  const idexx = metadata?.idexx as Record<string, unknown> | undefined;

  if (!idexx) {
    odisLogger.debug('Case has no IDEXX metadata, skipping', {
      caseId: caseItem.id,
    });
    return false;
  }

  // Get consultation ID (may need lookup if not stored)
  let consultationId = idexx.consultation_id as string | undefined;

  if (!consultationId) {
    // Try to find consultation from appointment
    const lookedUpId = await lookupConsultationId(idexx.appointment_id as string);
    consultationId = lookedUpId ?? undefined;
  }

  if (!consultationId) {
    odisLogger.debug('No consultation found for case', {
      caseId: caseItem.id,
      appointmentId: idexx.appointment_id,
    });
    return false;
  }

  // Fetch consultation data from IDEXX
  const consultationData = await fetchConsultationData(consultationId);

  // Extract notes
  const consultationNotes =
    (consultationData.consultationNotes as { notes?: string } | undefined)?.notes ||
    consultationData.consultation?.notes ||
    '';

  // Extract products/services
  odisLogger.debug('🛒 Raw consultation lines data', {
    caseId: caseItem.id,
    consultationId,
    hasConsultationLines: !!consultationData.consultationLines,
    linesCount: consultationData.consultationLines?.length || 0,
    rawLines: consultationData.consultationLines,
  });

  const productsServices = formatProductsServices(consultationData.consultationLines, false);
  const declinedProductsServices = formatProductsServices(consultationData.consultationLines, true);

  odisLogger.debug('🛒 Formatted products/services', {
    caseId: caseItem.id,
    consultationId,
    acceptedProducts: productsServices,
    declinedProducts: declinedProductsServices,
    acceptedCount: productsServices ? productsServices.split(';').length : 0,
    declinedCount: declinedProductsServices ? declinedProductsServices.split(';').length : 0,
  });

  // Check if we have any data to reconcile (notes OR products/services)
  const hasNotes = !!consultationNotes;
  const hasProducts = !!productsServices || !!declinedProductsServices;

  if (!hasNotes && !hasProducts) {
    odisLogger.debug('Consultation has no notes or products/services', {
      caseId: caseItem.id,
      consultationId,
    });
    return false;
  }

  // Update case metadata
  const updatedMetadata = {
    ...metadata,
    idexx: {
      ...idexx,
      consultation_id: consultationId,
      consultation_notes: consultationNotes || idexx.consultation_notes,
      consultation_status: consultationData.consultation?.status,
      products_services: productsServices || idexx.products_services,
      declined_products_services: declinedProductsServices || idexx.declined_products_services,
      notes_synced_at: new Date().toISOString(),
    },
  };

  odisLogger.debug('💾 Saving metadata to database', {
    caseId: caseItem.id,
    consultationId,
    metadataToSave: {
      hasNotes: !!consultationNotes,
      hasProducts: !!productsServices,
      hasDeclinedProducts: !!declinedProductsServices,
      products: productsServices,
      declinedProducts: declinedProductsServices,
    },
  });

  const { error } = await supabase.from('cases').update({ metadata: updatedMetadata }).eq('id', caseItem.id);

  if (error) {
    throw new Error(`Failed to update case: ${error.message}`);
  }

  odisLogger.info('✅ Reconciled case data', {
    caseId: caseItem.id,
    consultationId,
    notesLength: consultationNotes.length,
    hasProducts: !!productsServices,
    hasDeclinedProducts: !!declinedProductsServices,
    acceptedProductsPreview: productsServices?.substring(0, 100),
    declinedProductsPreview: declinedProductsServices?.substring(0, 100),
  });

  return true;
};

/**
 * Main reconciliation function
 */
const reconcileCaseNotes = async (options: ReconciliationOptions): Promise<ReconciliationResult> => {
  const startTime = Date.now();
  const supabase = getSupabaseClient();
  const session = await requireAuthSession();

  odisLogger.info('Starting notes reconciliation', {
    startDate: options.startDate.toISOString(),
    endDate: options.endDate.toISOString(),
  });

  // Create sync tracking record
  const syncRecord = await createSyncRecord({
    userId: session.user.id,
    syncDate: options.startDate,
    syncType: 'notes',
  });

  try {
    // Get cases that need reconciliation
    const cases = await getCasesNeedingReconciliation(session.user.id, options);

    const result: ReconciliationResult = {
      syncId: syncRecord.id,
      totalCases: cases.length,
      reconciledCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
      durationMs: 0,
    };

    // Process each case
    for (let i = 0; i < cases.length; i++) {
      const caseItem = cases[i];
      const metadata = caseItem.metadata as Record<string, unknown> | null;
      const idexx = metadata?.idexx as Record<string, unknown> | undefined;
      const patientName = (idexx?.patient_name as string) || 'Unknown';

      options.onProgress?.(i + 1, cases.length, patientName);

      try {
        const reconciled = await reconcileSingleCase(caseItem, supabase);
        if (reconciled) {
          result.reconciledCount++;
        } else {
          result.skippedCount++;
        }
      } catch (error) {
        result.failedCount++;
        result.errors.push({
          caseId: caseItem.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        odisLogger.warn('Failed to reconcile case', {
          caseId: caseItem.id,
          error,
        });
      }
    }

    result.durationMs = Date.now() - startTime;

    // Update sync record
    await updateSyncRecord(syncRecord.id, {
      status: result.failedCount === result.totalCases ? 'failed' : result.failedCount > 0 ? 'partial' : 'completed',
      completedAt: new Date(),
      totalItems: result.totalCases,
      syncedCount: result.reconciledCount,
      skippedCount: result.skippedCount,
      failedCount: result.failedCount,
      metadata: { durationMs: result.durationMs },
    });

    odisLogger.info('Notes reconciliation complete', { ...result });
    return result;
  } catch (error) {
    await updateSyncRecord(syncRecord.id, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

export { reconcileCaseNotes, getCasesNeedingReconciliation, reconcileSingleCase };
export type { ReconciliationOptions, ReconciliationResult };
