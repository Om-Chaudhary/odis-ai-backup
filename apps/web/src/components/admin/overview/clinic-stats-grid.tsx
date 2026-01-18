import { createClient } from "@odis-ai/data-access/db/server";
import { Building2, Users, FileText, TrendingUp } from "lucide-react";
import { Card } from "@odis-ai/shared/ui/card";

async function getStats() {
  const supabase = await createClient();

  // Get clinic count
  const { count: clinicCount } = await supabase
    .from("clinics")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Get user count
  const { count: userCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  // Get case count (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count: caseCount } = await supabase
    .from("cases")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo.toISOString());

  // Get active syncs count
  const { count: activeSyncs } = await supabase
    .from("case_sync_audits")
    .select("*", { count: "exact", head: true })
    .eq("status", "running");

  return {
    clinics: clinicCount ?? 0,
    users: userCount ?? 0,
    cases: caseCount ?? 0,
    activeSyncs: activeSyncs ?? 0,
  };
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  trend?: string;
}

function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="group overflow-hidden rounded-xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
      <div className="relative p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm shadow-teal-500/20 transition-transform group-hover:scale-105">
            <Icon className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          {trend && (
            <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-[11px] font-semibold text-emerald-600">
                {trend}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-0.5">
          <div className="text-2xl font-bold tracking-tight text-slate-800 tabular-nums">
            {value.toLocaleString()}
          </div>
          <div className="text-xs font-medium text-slate-500">{label}</div>
        </div>
      </div>
    </Card>
  );
}

export async function ClinicStatsGrid() {
  const stats = await getStats();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Active Clinics"
        value={stats.clinics}
        icon={Building2}
        trend="+2 this month"
      />
      <StatCard label="Total Users" value={stats.users} icon={Users} />
      <StatCard
        label="Cases (7d)"
        value={stats.cases}
        icon={FileText}
        trend="+12%"
      />
      <StatCard
        label="Active Syncs"
        value={stats.activeSyncs}
        icon={Building2}
      />
    </div>
  );
}
