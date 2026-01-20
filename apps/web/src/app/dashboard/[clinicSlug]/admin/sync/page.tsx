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
import { SyncHistoryTable } from "~/components/admin/sync/sync-history-table";
import { SyncTriggerPanel } from "~/components/admin/sync/sync-trigger-panel";

export default function AdminSyncPage() {
  const { selectedClinicId, clinics, isGlobalView } = useAdminContext();
  const [triggerClinicId, setTriggerClinicId] = useState<string>("");

  const { data: history, isLoading } = api.admin.sync.getSyncHistory.useQuery({
    clinicId: selectedClinicId ?? undefined,
    limit: 20,
    offset: 0,
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

      {/* Quick Trigger Panel */}
      {isGlobalView && (
        <Card className="border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Manual Sync Trigger
          </h3>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Select Clinic
              </label>
              <Select
                value={triggerClinicId}
                onValueChange={setTriggerClinicId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a clinic to sync" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
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

      {/* Sync History */}
      <Card className="border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Sync History</h3>
          <p className="text-sm text-slate-500">
            {isGlobalView ? "All Clinics" : "Current Clinic"}
          </p>
        </div>

        <SyncHistoryTable
          data={(history?.syncs ?? []).map((sync) => ({
            ...sync,
            clinics: sync.clinics?.[0] ?? null,
          }))}
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
