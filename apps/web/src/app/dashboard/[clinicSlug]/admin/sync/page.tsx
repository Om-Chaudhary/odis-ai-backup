"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/client";
import { Card } from "@odis-ai/shared/ui/card";
import { useAdminContext } from "~/lib/admin-context";
import { HealthMonitor } from "~/components/admin/sync/health-monitor";
import { ActiveSyncsCard } from "~/components/admin/sync/active-syncs-card";
import {
  SyncHistoryTable,
  type SyncHistoryItem,
} from "~/components/admin/sync/sync-history-table";
import { SyncTriggerPanel } from "~/components/admin/sync/sync-trigger-panel";
import { ClinicSyncScheduleCard } from "~/components/admin/sync/clinic-sync-schedule-card";
import { useSyncAuditRealtime } from "~/components/admin/sync/hooks";

export default function AdminSyncPage() {
  // Get clinic slug directly from URL params (most reliable source)
  const params = useParams<{ clinicSlug: string }>();
  const clinicSlugFromUrl = params.clinicSlug;

  // Get clinics list from context, but derive selected clinic from URL
  const { clinics } = useAdminContext();

  // Find the clinic by slug from URL (single source of truth)
  const selectedClinic =
    clinics.find((c) => c.slug === clinicSlugFromUrl) ?? null;
  const selectedClinicId = selectedClinic?.id ?? null;

  const utils = api.useUtils();

  const { data: credentialedClinicIdsArray } =
    api.admin.sync.getClinicsWithCredentials.useQuery();

  // Convert array to Set for efficient lookup
  const credentialedClinicIds = credentialedClinicIdsArray
    ? new Set(credentialedClinicIdsArray)
    : undefined;

  // Check if selected clinic is an IDEXX clinic with credentials
  const isIdexxClinic =
    (selectedClinic?.pims_type === "idexx_neo" &&
      credentialedClinicIds?.has(selectedClinicId ?? "")) ??
    false;

  const { data: history, isLoading } = api.admin.sync.getSyncHistory.useQuery({
    clinicId: selectedClinicId ?? undefined,
    limit: 20,
    offset: 0,
  });

  // Subscribe to realtime updates to refresh sync history when syncs complete or fail
  useSyncAuditRealtime({
    clinicId: selectedClinicId ?? undefined,
    onSyncCompleted: () => {
      void utils.admin.sync.getSyncHistory.invalidate();
    },
    onSyncFailed: () => {
      void utils.admin.sync.getSyncHistory.invalidate();
    },
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PIMS Sync</h1>
          <p className="text-sm text-slate-500">
            Monitor and manage PIMS synchronization operations
          </p>
        </div>
      </div>

      {/* Health Monitor */}
      <HealthMonitor />

      {/* Active Syncs */}
      <ActiveSyncsCard
        clinicId={selectedClinicId ?? undefined}
        clinicSlug={clinicSlugFromUrl}
      />

      {/* Sync Schedule Configuration */}
      {selectedClinicId && selectedClinic && (
        <ClinicSyncScheduleCard
          clinicId={selectedClinicId}
          clinicSlug={selectedClinic.slug}
          clinicTimezone={selectedClinic.timezone ?? undefined}
          isIdexxClinic={isIdexxClinic}
        />
      )}

      {/* Manual Sync Trigger - only for IDEXX clinics */}
      {selectedClinicId && isIdexxClinic && (
        <Card className="border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Manual Sync Trigger
          </h3>
          <p className="mb-4 text-sm text-slate-500">
            Trigger a manual sync operation for this clinic
          </p>
          {/* Key forces remount when clinic changes to ensure fresh mutation state */}
          <SyncTriggerPanel
            key={selectedClinicId}
            clinicId={selectedClinicId}
          />
        </Card>
      )}

      {/* Sync History */}
      <Card className="border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Sync History</h3>
          <p className="text-sm text-slate-500">Current Clinic</p>
        </div>

        <SyncHistoryTable
          data={(history?.syncs ?? []).map((sync): SyncHistoryItem => {
            const clinicData = sync.clinics as unknown as {
              id: string;
              name: string;
              slug: string;
            } | null;
            return {
              id: sync.id,
              clinic_id: sync.clinic_id,
              sync_type: sync.sync_type,
              created_at: sync.created_at,
              updated_at: sync.updated_at,
              status: sync.status,
              appointments_found: sync.appointments_found,
              cases_created: sync.cases_created,
              cases_updated: sync.cases_updated,
              cases_skipped: sync.cases_skipped,
              cases_deleted: sync.cases_deleted,
              error_message: sync.error_message,
              clinics: clinicData,
            };
          })}
          isLoading={isLoading}
          clinicSlug={clinicSlugFromUrl}
        />

        {history && (
          <div className="mt-4 text-center text-sm text-slate-500">
            Showing {history.syncs.length} of {history.total} sync operations
          </div>
        )}
      </Card>
    </div>
  );
}
