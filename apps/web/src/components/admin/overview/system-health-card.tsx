"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, Server } from "lucide-react";
import { Card } from "@odis-ai/shared/ui/card";

interface HealthStatus {
  status: "healthy" | "unhealthy";
  uptime: string;
  lastCheck: Date;
  serviceName: string;
}

export function SystemHealthCard() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      const pimsUrl =
        process.env.NEXT_PUBLIC_PIMS_SYNC_URL ??
        "https://pims-sync-production.up.railway.app";
      const response = await fetch(`${pimsUrl}/health`);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json();

      setHealth({
        status: "healthy",
        uptime: data.uptime ?? "Unknown",
        lastCheck: new Date(),
        serviceName: "PIMS Sync Service",
      });
      setError(null);
    } catch (err) {
      setHealth({
        status: "unhealthy",
        uptime: "N/A",
        lastCheck: new Date(),
        serviceName: "PIMS Sync Service",
      });
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void checkHealth();
    const interval = setInterval(() => {
      void checkHealth();
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health?.status === "healthy";

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
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                loading
                  ? "bg-white/10"
                  : isHealthy
                    ? "bg-teal-400/20 shadow-[0_0_20px_rgba(49,171,163,0.3)]"
                    : "bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              }`}
            >
              <Server
                className={`h-5 w-5 ${
                  loading
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
                {health?.serviceName ?? "Loading..."}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {!loading && (
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all ${
                isHealthy
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
              className={`text-lg font-bold tabular-nums transition-colors ${
                isHealthy ? "text-teal-300" : "text-slate-400"
              }`}
            >
              {loading ? "..." : (health?.uptime ?? "N/A")}
            </div>
          </div>

          {/* Last Check */}
          <div className="rounded-lg border border-white/5 bg-white/5 p-3 backdrop-blur-sm transition-all hover:bg-white/10">
            <div className="mb-1 text-[10px] font-semibold tracking-wider text-teal-400/60 uppercase">
              Last Check
            </div>
            <div className="text-sm font-medium text-slate-300 tabular-nums">
              {loading
                ? "..."
                : health?.lastCheck
                  ? new Date(health.lastCheck).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "N/A"}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-xs text-red-300">{error}</p>
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
