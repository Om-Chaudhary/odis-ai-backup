import { fetchClientContact } from '../utils/idexx/fetchClientContact';
import { getSupabaseClient, logger, fetchTodayCases } from '@odis-ai/extension-shared';
import { useEffect, useState } from 'react';
import type { Database } from '@database-types';

const odisLogger = logger.child('[ODIS-DASHBOARD]');

type Case = Database['public']['Tables']['cases']['Row'];

export interface DashboardCase extends Omit<Case, 'status'> {
  hydrated?: {
    ownerPhone?: string;
    ownerEmail?: string;
    ownerName?: string;
    patientName?: string;
    isHydrated: boolean;
    isLoading: boolean;
    error?: string;
  };
  status: 'pending' | 'scheduled' | 'sending' | 'completed' | 'error';
  statusMessage?: string;
  actionRequired?: 'missing_contact' | 'auth_required' | null;
}

export const useDailyDischarges = () => {
  const [cases, setCases] = useState<DashboardCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to fetch today's cases
  const fetchCases = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = getSupabaseClient();

      // Fetch cases for today - include both mobile app cases (source: 'manual') and IDEXX cases
      const data = await fetchTodayCases(supabase, {
        sources: ['manual', 'idexx_neo'],
        orderBy: 'scheduled_at',
        orderDirection: 'ascending',
      });

      // Transform to DashboardCase
      const dashboardCases: DashboardCase[] = data.map(c => {
        // Determine initial status
        let status: DashboardCase['status'] = 'pending';
        if (c.status === 'completed') status = 'completed';

        // Check metadata for contact info
        const meta = c.metadata as Record<string, unknown> | null;
        const idexxMeta = (meta?.idexx as Record<string, unknown>) || {};

        const hasPhone = !!idexxMeta.client_phone;
        const hasEmail = !!idexxMeta.client_email;

        return {
          ...c,
          status,
          hydrated: {
            ownerPhone: idexxMeta.client_phone as string | undefined,
            ownerEmail: idexxMeta.client_email as string | undefined,
            ownerName: idexxMeta.client_name as string | undefined,
            patientName: idexxMeta.patient_name as string | undefined,
            isHydrated: hasPhone && hasEmail, // Consider hydrated if we have both
            isLoading: false,
          },
          actionRequired: !hasPhone && !hasEmail ? 'missing_contact' : null,
        };
      });

      setCases(dashboardCases);

      // Trigger background hydration for missing data
      hydrateMissingData(dashboardCases);
    } catch (err) {
      odisLogger.error('Failed to fetch cases', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  // Hydrate missing contact info using IDEXX API (if available)
  const hydrateMissingData = async (currentCases: DashboardCase[]) => {
    const casesToHydrate = currentCases.filter(c => {
      const meta = c.metadata as Record<string, unknown> | null;
      const isIdexx = c.source === 'idexx_neo' || !!(meta?.idexx as Record<string, unknown>)?.client_id;
      const missingContact = !c.hydrated?.ownerPhone || !c.hydrated?.ownerEmail;
      return isIdexx && missingContact && !c.hydrated?.isLoading;
    });

    if (casesToHydrate.length === 0) return;

    odisLogger.info(`Hydrating ${casesToHydrate.length} cases...`);

    // Mark as loading
    setCases(prev =>
      prev.map(c =>
        casesToHydrate.some(h => h.id === c.id) ? { ...c, hydrated: { ...c.hydrated!, isLoading: true } } : c,
      ),
    );

    // Process one by one to be gentle on IDEXX API
    for (const caseItem of casesToHydrate) {
      const meta = caseItem.metadata as Record<string, unknown> | null;
      const clientId = (meta?.idexx as Record<string, unknown>)?.client_id as string | undefined;

      if (!clientId) continue;

      try {
        // Fetch contact information using standardized utility
        const contactResult = await fetchClientContact(clientId);
        const phone = contactResult.phone || caseItem.hydrated?.ownerPhone || null;
        const email = contactResult.email || caseItem.hydrated?.ownerEmail || null;

        // Update state with found data
        setCases(prev =>
          prev.map(c => {
            if (c.id !== caseItem.id) return c;

            const isHydrated = !!phone && !!email;
            const actionRequired = !phone && !email ? 'missing_contact' : null;

            return {
              ...c,
              hydrated: {
                ...c.hydrated!,
                ownerPhone: phone ?? undefined,
                ownerEmail: email ?? undefined,
                isHydrated,
                isLoading: false,
              },
              actionRequired,
            };
          }),
        );

        // Small delay between requests
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        odisLogger.error(`Failed to hydrate case ${caseItem.id}`, { error: err });
        setCases(prev =>
          prev.map(c =>
            c.id === caseItem.id
              ? { ...c, hydrated: { ...c.hydrated!, isLoading: false, error: 'Failed to fetch contact info' } }
              : c,
          ),
        );
      }
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  return { cases, setCases, isLoading, error, refresh: fetchCases };
};
