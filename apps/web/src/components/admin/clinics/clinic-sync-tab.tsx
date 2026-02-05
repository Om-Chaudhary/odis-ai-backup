"use client";

import { useState } from "react";
import type { Database } from "@odis-ai/shared/types";
import { api } from "~/trpc/client";
import { Card } from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { Switch } from "@odis-ai/shared/ui/switch";
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  Save,
  Loader2,
  CalendarClock,
  Database as DatabaseIcon,
  KeyRound,
  History,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type Clinic = Database["public"]["Tables"]["clinics"]["Row"];

interface ClinicSyncTabProps {
  clinic: Clinic;
  clinicId: string;
}

type SyncType = "cases" | "enrich" | "reconciliation";

interface ScheduleConfig {
  type: SyncType;
  cron: string;
  enabled: boolean;
}

const DEFAULT_SCHEDULES: ScheduleConfig[] = [
  { type: "cases", cron: "0 8,12,17 * * 1-5", enabled: true },
  { type: "enrich", cron: "0 9,13,18 * * 1-5", enabled: true },
  { type: "reconciliation", cron: "0 2 * * *", enabled: true },
];

const SYNC_TYPE_INFO: Record<
  SyncType,
  { label: string; description: string; icon: typeof DatabaseIcon }
> = {
  cases: {
    label: "Cases Sync",
    description: "Pull appointments from IDEXX to create cases",
    icon: CalendarClock,
  },
  enrich: {
    label: "Enrich Sync",
    description: "Add SOAP notes and consultation data + AI pipeline",
    icon: DatabaseIcon,
  },
  reconciliation: {
    label: "Reconciliation",
    description: "Clean up orphaned cases (7-day lookback)",
    icon: RefreshCw,
  },
};

export function ClinicSyncTab({ clinic, clinicId }: ClinicSyncTabProps) {
  const utils = api.useUtils();

  // Fetch sync config
  const { data: syncConfig, isLoading: configLoading } =
    api.admin.sync.getClinicSyncConfig.useQuery({ clinicId });

  // Fetch credential status
  const { data: credentialStatus, isLoading: credentialLoading } =
    api.admin.sync.getIdexxCredentialStatus.useQuery({ clinicId });

  // Fetch recent sync history
  const { data: historyData, isLoading: historyLoading } =
    api.admin.sync.getSyncHistory.useQuery({
      clinicId,
      limit: 5,
      offset: 0,
    });

  // Local state for editing schedules
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Mutations
  const triggerSyncMutation = api.admin.sync.triggerSync.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      void utils.admin.sync.getActiveSyncs.invalidate();
      void utils.admin.sync.getSyncHistory.invalidate();
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  const triggerAppointmentSyncMutation =
    api.admin.sync.triggerAppointmentSync.useMutation({
      onSuccess: (data) => {
        toast.success(data.message);
        void utils.admin.sync.getSyncHistory.invalidate();
      },
      onError: (error) => {
        toast.error(`Appointment sync failed: ${error.message}`);
      },
    });

  const updateScheduleMutation = api.admin.sync.updateSyncSchedule.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Sync schedule ${data.action === "created" ? "created" : "updated"} successfully`,
      );
      setIsEditing(false);
      setHasChanges(false);
      void utils.admin.sync.getClinicSyncConfig.invalidate({ clinicId });
    },
    onError: (error) => {
      toast.error(`Failed to save schedule: ${error.message}`);
    },
  });

  // Initialize schedules when config loads
  const initializeSchedules = () => {
    if (
      syncConfig?.config?.schedules &&
      syncConfig.config.schedules.length > 0
    ) {
      setSchedules(syncConfig.config.schedules);
    } else {
      setSchedules(DEFAULT_SCHEDULES);
    }
  };

  const handleTriggerSync = (type: SyncType) => {
    triggerSyncMutation.mutate({ clinicId, type });
  };

  const handleTriggerAppointmentSync = () => {
    triggerAppointmentSyncMutation.mutate({ clinicId, daysAhead: 7 });
  };

  const handleStartEditing = () => {
    initializeSchedules();
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleScheduleChange = (
    type: SyncType,
    field: "cron" | "enabled",
    value: string | boolean,
  ) => {
    setSchedules((prev) =>
      prev.map((s) => (s.type === type ? { ...s, [field]: value } : s)),
    );
    setHasChanges(true);
  };

  const handleSaveSchedules = () => {
    updateScheduleMutation.mutate({
      clinicId,
      schedules,
    });
  };

  const isIdexxClinic = clinic.pims_type === "idexx_neo";

  return (
    <div className="space-y-6">
      {/* Manual Sync Triggers */}
      <Card className="border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Manual Sync Triggers
            </h3>
            <p className="text-sm text-slate-500">
              Manually trigger sync operations for this clinic
            </p>
          </div>
          {triggerSyncMutation.isPending && (
            <Badge variant="outline" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running...
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => handleTriggerSync("cases")}
            variant="outline"
            className="gap-2"
            disabled={triggerSyncMutation.isPending || !isIdexxClinic}
          >
            <Play className="h-4 w-4" />
            Cases Sync
          </Button>

          <Button
            onClick={() => handleTriggerSync("enrich")}
            variant="outline"
            className="gap-2"
            disabled={triggerSyncMutation.isPending || !isIdexxClinic}
          >
            <Play className="h-4 w-4" />
            Enrich Sync
          </Button>

          <Button
            onClick={() => handleTriggerSync("reconciliation")}
            variant="outline"
            className="gap-2"
            disabled={triggerSyncMutation.isPending || !isIdexxClinic}
          >
            <Play className="h-4 w-4" />
            Reconciliation
          </Button>
        </div>

        {!isIdexxClinic && (
          <p className="mt-3 text-sm text-amber-600">
            Manual sync is only available for IDEXX clinics.
          </p>
        )}
      </Card>

      {/* Inbound Sync (Appointment Availability) */}
      <Card className="border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Inbound Appointment Sync
            </h3>
            <p className="text-sm text-slate-500">
              Sync appointments from IDEXX to update VAPI availability slots
            </p>
          </div>
          {triggerAppointmentSyncMutation.isPending && (
            <Badge variant="outline" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Syncing...
            </Badge>
          )}
        </div>

        <div className="mb-4 rounded-lg bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">What this does:</span>{" "}
            Fetches appointments from IDEXX Neo and updates the{" "}
            <code className="rounded bg-slate-200 px-1 text-xs">
              schedule_slots.booked_count
            </code>{" "}
            field so VAPI shows accurate availability when callers ask to book
            appointments.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleTriggerAppointmentSync}
            variant="outline"
            className="gap-2"
            disabled={
              triggerAppointmentSyncMutation.isPending || !isIdexxClinic
            }
          >
            {triggerAppointmentSyncMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarClock className="h-4 w-4" />
            )}
            Sync Appointments (7 days)
          </Button>
        </div>

        {!isIdexxClinic && (
          <p className="mt-3 text-sm text-amber-600">
            Appointment sync is only available for IDEXX clinics.
          </p>
        )}
      </Card>

      {/* Sync Schedule Configuration */}
      <Card className="border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Sync Schedule
            </h3>
            <p className="text-sm text-slate-500">
              Configure automated sync schedules (cron expressions)
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Timezone:{" "}
              <span className="font-mono">
                {clinic.timezone ?? "America/Los_Angeles"}
              </span>{" "}
              (clinic timezone)
            </p>
          </div>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEditing}
              disabled={configLoading || !isIdexxClinic}
            >
              Configure
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEditing}
                disabled={updateScheduleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveSchedules}
                disabled={!hasChanges || updateScheduleMutation.isPending}
                className="gap-1"
              >
                {updateScheduleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          )}
        </div>

        {configLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            {schedules.map((schedule) => {
              const info = SYNC_TYPE_INFO[schedule.type];
              const Icon = info.icon;
              return (
                <div
                  key={schedule.type}
                  className="flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <Icon className="mt-0.5 h-5 w-5 text-slate-600" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {info.label}
                        </p>
                        <p className="text-xs text-slate-500">
                          {info.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`${schedule.type}-enabled`}
                          className="text-xs text-slate-600"
                        >
                          Enabled
                        </Label>
                        <Switch
                          id={`${schedule.type}-enabled`}
                          checked={schedule.enabled}
                          onCheckedChange={(checked) =>
                            handleScheduleChange(
                              schedule.type,
                              "enabled",
                              checked,
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`${schedule.type}-cron`}
                        className="text-xs whitespace-nowrap text-slate-600"
                      >
                        Cron:
                      </Label>
                      <Input
                        id={`${schedule.type}-cron`}
                        value={schedule.cron}
                        onChange={(e) =>
                          handleScheduleChange(
                            schedule.type,
                            "cron",
                            e.target.value,
                          )
                        }
                        placeholder="0 9 * * *"
                        className="h-8 font-mono text-sm"
                        disabled={!schedule.enabled}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-slate-500">
              Cron format: minute hour day-of-month month day-of-week (e.g., "0
              9 * * 1-5" = 9 AM Mon-Fri)
            </p>
            <p className="text-xs text-slate-500">
              Cron schedules are evaluated in the clinic timezone shown above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {syncConfig?.config?.schedules &&
            syncConfig.config.schedules.length > 0 ? (
              syncConfig.config.schedules.map((schedule) => {
                const info = SYNC_TYPE_INFO[schedule.type];
                const Icon = info.icon;
                return (
                  <div
                    key={schedule.type}
                    className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-slate-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {info.label}
                        </p>
                        <p className="font-mono text-xs text-slate-500">
                          {schedule.cron}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={schedule.enabled ? "default" : "secondary"}
                      className={
                        schedule.enabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }
                    >
                      {schedule.enabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center">
                <Clock className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">
                  No schedules configured
                </p>
                {isIdexxClinic && (
                  <p className="mt-1 text-xs text-slate-400">
                    Click "Configure" to set up automated sync schedules
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* IDEXX Credentials Status */}
      <Card className="border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          IDEXX Credentials
        </h3>

        {credentialLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : !isIdexxClinic ? (
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">
                No IDEXX Credentials Required
              </p>
              <p className="text-sm text-slate-600">
                This clinic uses {clinic.pims_type ?? "unknown"} as its PIMS
              </p>
            </div>
          </div>
        ) : credentialStatus?.hasCredentials ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-4">
              <KeyRound className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">
                    Credentials Configured
                  </p>
                  <Badge
                    variant={
                      credentialStatus.credential?.validationStatus === "valid"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      credentialStatus.credential?.validationStatus === "valid"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }
                  >
                    {credentialStatus.credential?.validationStatus ?? "Unknown"}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400">Last Validated:</span>{" "}
                    {credentialStatus.credential?.lastValidatedAt
                      ? new Date(
                          credentialStatus.credential.lastValidatedAt,
                        ).toLocaleDateString()
                      : "Never"}
                  </div>
                  <div>
                    <span className="text-slate-400">Last Used:</span>{" "}
                    {credentialStatus.credential?.lastUsedAt
                      ? new Date(
                          credentialStatus.credential.lastUsedAt,
                        ).toLocaleDateString()
                      : "Never"}
                  </div>
                  <div>
                    <span className="text-slate-400">Sync Enabled:</span>{" "}
                    {credentialStatus.credential?.syncEnabled ? "Yes" : "No"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">
                No Credentials Found
              </p>
              <p className="text-sm text-slate-600">
                IDEXX credentials need to be configured before syncing can work.
                Contact support to set up credentials for this clinic.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Recent Sync History */}
      <Card className="border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Recent Sync History
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              void utils.admin.sync.getSyncHistory.invalidate({ clinicId })
            }
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : historyData?.syncs && historyData.syncs.length > 0 ? (
          <div className="space-y-2">
            {historyData.syncs.map((sync) => (
              <div
                key={sync.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3"
              >
                <div className="flex items-center gap-3">
                  {sync.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : sync.status === "failed" ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <History className="h-4 w-4 text-slate-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900 capitalize">
                      {sync.sync_type?.replace("_", " ") ?? "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(sync.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {sync.status === "completed" && (
                    <div className="flex gap-3 text-xs text-slate-500">
                      {sync.appointments_found !== null && (
                        <span>Found: {sync.appointments_found}</span>
                      )}
                      {sync.cases_created !== null && (
                        <span>Created: {sync.cases_created}</span>
                      )}
                      {sync.cases_updated !== null && (
                        <span>Updated: {sync.cases_updated}</span>
                      )}
                    </div>
                  )}
                  <Badge
                    variant={
                      sync.status === "completed" ? "default" : "destructive"
                    }
                    className={
                      sync.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : sync.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-700"
                    }
                  >
                    {sync.status}
                  </Badge>
                </div>
              </div>
            ))}
            {historyData.total > 5 && (
              <p className="pt-2 text-center text-xs text-slate-500">
                Showing 5 of {historyData.total} sync operations
              </p>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <History className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm text-slate-500">
              No sync history for this clinic
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
