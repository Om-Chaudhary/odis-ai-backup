"use client";

import { useState } from "react";
import { api } from "~/trpc/client";
import { Card } from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Label } from "@odis-ai/shared/ui/label";
import { Switch } from "@odis-ai/shared/ui/switch";
import {
  RefreshCw,
  Clock,
  Save,
  Loader2,
  CalendarClock,
  Database as DatabaseIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ScheduleBuilder } from "./schedule-builder";

interface ClinicSyncScheduleCardProps {
  clinicId: string;
  clinicSlug: string;
  clinicTimezone?: string;
  isIdexxClinic: boolean;
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

export function ClinicSyncScheduleCard({
  clinicId,
  clinicSlug: _clinicSlug,
  clinicTimezone,
  isIdexxClinic,
}: ClinicSyncScheduleCardProps) {
  const utils = api.useUtils();

  // Fetch sync config
  const { data: syncConfig, isLoading: configLoading } =
    api.admin.sync.getClinicSyncConfig.useQuery({ clinicId });

  // Local state for editing schedules
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Mutations
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

  return (
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
              {clinicTimezone ?? "America/Los_Angeles"}
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
                  <ScheduleBuilder
                    value={schedule.cron}
                    onChange={(newCron) =>
                      handleScheduleChange(schedule.type, "cron", newCron)
                    }
                    enabled={schedule.enabled}
                    timezone={clinicTimezone ?? "America/Los_Angeles"}
                    label={info.label}
                    description={info.description}
                  />
                </div>
              </div>
            );
          })}
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
              <p className="text-sm text-slate-500">No schedules configured</p>
              {isIdexxClinic && (
                <p className="mt-1 text-xs text-slate-400">
                  Click "Configure" to set up automated sync schedules
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!isIdexxClinic && (
        <div className="mt-4 rounded-lg bg-amber-50 p-3">
          <p className="text-sm text-amber-800">
            Sync schedules are only available for IDEXX clinics.
          </p>
        </div>
      )}
    </Card>
  );
}
