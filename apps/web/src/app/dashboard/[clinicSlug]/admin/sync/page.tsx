"use client";

import { useState } from "react";
import { api } from "~/trpc/client";
import { Card } from "@odis-ai/shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import { useAdminContext } from "~/lib/admin-context";
import { HealthMonitor } from "~/components/admin/sync/health-monitor";
import { ActiveSyncsCard } from "~/components/admin/sync/active-syncs-card";
import {
  SyncHistoryTable,
  type SyncHistoryItem,
} from "~/components/admin/sync/sync-history-table";
import { SyncTriggerPanel } from "~/components/admin/sync/sync-trigger-panel";
import { ClinicSyncOverview } from "~/components/admin/sync/clinic-sync-overview";
import { ClinicSyncScheduleCard } from "~/components/admin/sync/clinic-sync-schedule-card";
import { useSyncAuditRealtime } from "~/components/admin/sync/hooks";
import { CalendarClock } from "lucide-react";

export default function AdminSyncPage() {
  const { selectedClinicId, clinics, isGlobalView } = useAdminContext();
  const [triggerClinicId, setTriggerClinicId] = useState<string>("");
  const utils = api.useUtils();

  const { data: credentialedClinicIdsArray } =
    api.admin.sync.getClinicsWithCredentials.useQuery();

  // Convert array to Set for efficient lookup
  const credentialedClinicIds = credentialedClinicIdsArray
    ? new Set(credentialedClinicIdsArray)
    : undefined;

  // Filter to only IDEXX Neo clinics WITH active credentials
  const idexxClinics = clinics.filter(
    (c) => c.pims_type === "idexx_neo" && credentialedClinicIds?.has(c.id),
  );

  // Find the selected clinic to get its details
  const selectedClinic = clinics.find((c) => c.id === selectedClinicId);
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
      <ActiveSyncsCard clinicId={selectedClinicId ?? undefined} />

      {/* Sync Schedule Configuration - Clinic View Only */}
      {!isGlobalView && selectedClinicId && selectedClinic ? (
        <ClinicSyncScheduleCard
          clinicId={selectedClinicId}
          clinicSlug={selectedClinic.slug}
          clinicTimezone={selectedClinic.timezone ?? undefined}
          isIdexxClinic={isIdexxClinic}
        />
      ) : isGlobalView ? (
        <Card className="border-slate-200 bg-white p-6">
          <div className="py-8 text-center">
            <CalendarClock className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <h3 className="mb-2 text-lg font-semibold text-slate-900">
              Select a Clinic
            </h3>
            <p className="text-sm text-slate-500">
              Choose a specific clinic from the dropdown above to configure sync
              schedules
            </p>
          </div>
        </Card>
      ) : null}

      {/* Clinic Sync Overview - Global View */}
      {isGlobalView && <ClinicSyncOverview />}

      {/* Quick Trigger Panel - Global View */}
      {isGlobalView && idexxClinics.length > 0 && (
        <Card className="border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Manual Sync Trigger
          </h3>
          <p className="mb-4 text-sm text-slate-500">
            Select an IDEXX clinic and trigger a manual sync operation
          </p>
          <div className="flex items-end gap-4">
            <div className="w-72">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Select Clinic
              </label>
              <Select
                value={triggerClinicId}
                onValueChange={setTriggerClinicId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an IDEXX clinic" />
                </SelectTrigger>
                <SelectContent>
                  {idexxClinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {triggerClinicId && <SyncTriggerPanel clinicId={triggerClinicId} />}
          </div>
        </Card>
      )}

      {/* Quick Trigger Panel - Clinic View */}
      {!isGlobalView && selectedClinicId && isIdexxClinic && (
        <Card className="border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Manual Sync Trigger
          </h3>
          <p className="mb-4 text-sm text-slate-500">
            Trigger a manual sync operation for this clinic
          </p>
          <SyncTriggerPanel clinicId={selectedClinicId} />
        </Card>
      )}

      {/* Sync History */}
      <Card className="border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Sync History</h3>
          <p className="text-sm text-slate-500">
            {isGlobalView ? "All Clinics" : "Current Clinic"}
          </p>
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
