"use client";

import { Activity, AlertCircle, Server } from "lucide-react";
import { Card } from "@odis-ai/shared/ui/card";
import { api } from "~/trpc/client";

export function SystemHealthCard() {
  // Use tRPC query instead of direct fetch to avoid CORS issues
  const {
    data: health,
    isLoading: loading,
    error,
  } = api.admin.sync.getServiceHealth.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30 seconds
    retry: 1,
  });

  const isHealthy = health?.status === "healthy";
  const errorMessage =
    error?.message ?? (health?.status === "unhealthy" ? health.error : null);

  return (
    <Card
      className="group relative overflow-hidden rounded-xl border-0"
      style={{
        background:
          "linear-gradient(135deg, hsl(175 35% 15%) 0%, hsl(175 30% 12%) 50%, hsl(175 25% 10%) 100%)",
      }}
    >
      {/* Subtle grid pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:20px_20px]" />
      </div>

      <div className="relative p-5">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${loading
                ? "bg-white/10"
                : isHealthy
                  ? "bg-teal-400/20 shadow-[0_0_20px_rgba(49,171,163,0.3)]"
                  : "bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                }`}
            >
              <Server
                className={`h-5 w-5 ${loading
                  ? "text-slate-400"
                  : isHealthy
                    ? "text-teal-300"
                    : "text-red-400"
                  }`}
                strokeWidth={2}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90">
                System Status
              </h3>
              <p className="text-xs text-teal-400/70">
                {health?.service ?? "Loading..."}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {!loading && (
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all ${isHealthy
                ? "bg-teal-400/20 text-teal-300"
                : "bg-red-500/20 text-red-300"
                }`}
            >
              {isHealthy ? (
                <>
                  <Activity className="h-3.5 w-3.5 animate-pulse" />
                  <span className="text-[11px] font-semibold tracking-wide uppercase">
                    Operational
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-semibold tracking-wide uppercase">
                    Offline
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Uptime */}
          <div className="rounded-lg border border-white/5 bg-white/5 p-3 backdrop-blur-sm transition-all hover:bg-white/10">
            <div className="mb-1 text-[10px] font-semibold tracking-wider text-teal-400/60 uppercase">
              Uptime
            </div>
            <div
              className={`text-lg font-bold tabular-nums transition-colors ${isHealthy ? "text-teal-300" : "text-slate-400"
                }`}
            >
              {loading ? "..." : (health?.uptime ?? "N/A")}
            </div>
          </div>

          {/* Version */}
          <div className="rounded-lg border border-white/5 bg-white/5 p-3 backdrop-blur-sm transition-all hover:bg-white/10">
            <div className="mb-1 text-[10px] font-semibold tracking-wider text-teal-400/60 uppercase">
              Version
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-xs text-red-300">{errorMessage}</p>
          </div>
        )}

        {/* Activity Pulse Indicator */}
        {isHealthy && !loading && (
          <div className="absolute top-4 right-4">
            <div className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(49,171,163,0.6)]" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
