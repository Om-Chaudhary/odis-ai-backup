"use client";

import { useEffect } from "react";
import { api } from "~/trpc/client";
import { Card } from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Server, AlertCircle, CheckCircle2 } from "lucide-react";

export function HealthMonitor() {
  const { data: health, refetch } = api.admin.sync.getServiceHealth.useQuery();

  // Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const isHealthy = health?.status === "healthy";

  return (
    <Card className="border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
              isHealthy
                ? "bg-emerald-100 shadow-lg shadow-emerald-500/20"
                : "bg-red-100 shadow-lg shadow-red-500/20"
            }`}
          >
            <Server
              className={`h-6 w-6 ${
                isHealthy ? "text-emerald-600" : "text-red-600"
              }`}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Service Health
            </h3>
            <p className="text-sm text-slate-500">
              {health?.service ?? "PIMS Sync Service"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {health?.uptime && (
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500">Uptime</p>
              <p className="text-lg font-semibold text-slate-900">
                {health.uptime}
              </p>
            </div>
          )}

          <Badge
            variant={isHealthy ? "default" : "destructive"}
            className={`flex items-center gap-2 ${
              isHealthy
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {isHealthy ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Healthy
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                Unhealthy
              </>
            )}
          </Badge>
        </div>
      </div>

      {!isHealthy && health?.error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{health.error}</p>
        </div>
      )}
    </Card>
  );
}
