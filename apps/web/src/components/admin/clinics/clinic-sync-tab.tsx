import type { Database } from "@odis-ai/shared/types";
import { Card } from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import { RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

type Clinic = Database["public"]["Tables"]["clinics"]["Row"];

interface ClinicSyncTabProps {
  clinic: Clinic;
  clinicId: string;
}

export function ClinicSyncTab({ clinic }: ClinicSyncTabProps) {
  const handleTriggerSync = (type: "inbound" | "case") => {
    // TODO: Implement sync trigger via tRPC
    console.log("Trigger sync:", type);
  };

  return (
    <div className="space-y-6">
      {/* Manual Sync Triggers */}
      <Card className="border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Manual Sync Triggers
        </h3>
        <p className="mb-4 text-sm text-slate-500">
          Manually trigger sync operations for this clinic
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => handleTriggerSync("inbound")}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Trigger Inbound Sync
          </Button>

          <Button
            onClick={() => handleTriggerSync("case")}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Trigger Case Sync
          </Button>
        </div>
      </Card>

      {/* Sync Schedule Configuration */}
      <Card className="border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Sync Schedule
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Inbound Sync</p>
              <p className="text-xs text-slate-500">
                Sync inbound call data from IDEXX
              </p>
            </div>
            <Badge variant="secondary">Not Configured</Badge>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Case Sync</p>
              <p className="text-xs text-slate-500">
                Sync case data and discharge information
              </p>
            </div>
            <Badge variant="secondary">Not Configured</Badge>
          </div>
        </div>
      </Card>

      {/* IDEXX Credentials Status */}
      <Card className="border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          IDEXX Credentials
        </h3>

        <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
          {clinic.pims_type === "idexx" ? (
            <>
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Credentials Status
                </p>
                <p className="text-sm text-slate-600">
                  Use the PIMS Sync service to view and update IDEXX credentials
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  No IDEXX Credentials Required
                </p>
                <p className="text-sm text-slate-600">
                  This clinic uses {clinic.pims_type} as its PIMS
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Recent Sync History */}
      <Card className="border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Recent Sync History
        </h3>
        <div className="py-8 text-center">
          <RefreshCw className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm text-slate-500">
            Sync history will be displayed here
          </p>
        </div>
      </Card>
    </div>
  );
}
