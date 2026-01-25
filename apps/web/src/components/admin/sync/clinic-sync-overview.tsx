"use client";

import { api } from "~/trpc/client";
import { Card } from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Building2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAdminContext } from "~/lib/admin-context";
import type { Json } from "@odis-ai/shared/types";

interface SyncSchedule {
  type: "inbound" | "cases" | "reconciliation";
  cron: string;
  enabled: boolean;
}

interface ScheduleConfig {
  clinic_id: string;
  sync_schedules: Json | null;
}

export function ClinicSyncOverview() {
  const { clinics } = useAdminContext();

  const { data: allSchedules, isLoading: schedulesLoading } =
    api.admin.sync.getSyncSchedules.useQuery({}) as {
      data: ScheduleConfig[] | undefined;
      isLoading: boolean;
    };

  const { data: credentialedClinicIdsArray, isLoading: credentialsLoading } =
    api.admin.sync.getClinicsWithCredentials.useQuery();

  // Convert array to Set for efficient lookup
  const credentialedClinicIds = credentialedClinicIdsArray
    ? new Set(credentialedClinicIdsArray)
    : undefined;

  // Create a map of clinic ID to schedules
  const schedulesByClinic = new Map<string, SyncSchedule[]>();
  if (allSchedules) {
    for (const schedule of allSchedules) {
      if (schedule.sync_schedules && Array.isArray(schedule.sync_schedules)) {
        const parsedSchedules: SyncSchedule[] = [];
        for (const s of schedule.sync_schedules) {
          if (s && typeof s === "object" && "type" in s && "cron" in s) {
            parsedSchedules.push({
              type: s.type as "inbound" | "cases" | "reconciliation",
              cron: s.cron as string,
              enabled: (s.enabled as boolean) ?? true,
            });
          }
        }
        if (parsedSchedules.length > 0) {
          schedulesByClinic.set(schedule.clinic_id, parsedSchedules);
        }
      }
    }
  }

  // Filter to only IDEXX Neo clinics WITH active credentials
  const idexxClinics = clinics.filter(
    (c) =>
      c.pims_type === "idexx_neo" &&
      credentialedClinicIds?.has(c.id),
  );

  if (schedulesLoading || credentialsLoading) {
    return (
      <Card className="border-slate-200 bg-white p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Clinic Sync Configuration
          </h3>
          <p className="text-sm text-slate-500">
            Overview of sync schedules for all IDEXX clinics
          </p>
        </div>
        <Badge variant="outline">
          {idexxClinics.length} IDEXX{" "}
          {idexxClinics.length === 1 ? "Clinic" : "Clinics"}
        </Badge>
      </div>

      {idexxClinics.length === 0 ? (
        <div className="py-8 text-center">
          <Building2 className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm text-slate-500">
            No IDEXX clinics with credentials configured
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {idexxClinics.map((clinic) => {
            const schedules = schedulesByClinic.get(clinic.id);
            const hasSchedules = schedules && schedules.length > 0;
            const activeSchedules =
              schedules?.filter((s) => s.enabled).length ?? 0;

            return (
              <div
                key={clinic.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      hasSchedules ? "bg-emerald-100" : "bg-slate-200"
                    }`}
                  >
                    {hasSchedules ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-slate-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {clinic.name}
                      </p>
                      <Badge
                        variant={clinic.is_active ? "default" : "secondary"}
                        className={
                          clinic.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }
                      >
                        {clinic.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      {hasSchedules ? (
                        <>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {activeSchedules} active{" "}
                            {activeSchedules === 1 ? "schedule" : "schedules"}
                          </span>
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            {schedules
                              ?.map((s) => s.type.charAt(0).toUpperCase())
                              .join(", ")}
                          </span>
                        </>
                      ) : (
                        <span className="text-amber-600">
                          No sync schedules configured
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Link href={`/admin/clinics/${clinic.id}?tab=sync`}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    Configure
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
