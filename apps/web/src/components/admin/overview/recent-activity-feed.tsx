import { createServiceClient } from "@odis-ai/data-access/db/server";
import { Card } from "@odis-ai/shared/ui/card";
import {
  Clock,
  Building2,
  User,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "clinic_created" | "user_joined" | "sync_completed" | "sync_failed";
  title: string;
  description: string;
  timestamp: Date;
  status?: "success" | "error";
}

async function getRecentActivity(): Promise<ActivityItem[]> {
  const supabase = await createServiceClient();
  const activities: ActivityItem[] = [];

  // Get recent clinics (last 10)
  const { data: clinics } = await supabase
    .from("clinics")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (clinics) {
    clinics.forEach((clinic) => {
      activities.push({
        id: `clinic-${clinic.id}`,
        type: "clinic_created",
        title: "New Clinic Created",
        description: clinic.name,
        timestamp: new Date(clinic.created_at),
      });
    });
  }

  // Get recent users (last 5)
  const { data: users } = await supabase
    .from("users")
    .select("id, first_name, last_name, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (users) {
    users.forEach((user) => {
      const name =
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        "Unknown User";
      activities.push({
        id: `user-${user.id}`,
        type: "user_joined",
        title: "New User Joined",
        description: name,
        timestamp: new Date(user.created_at),
      });
    });
  }

  // Get recent sync audits (last 10)
  const { data: syncs } = await supabase
    .from("case_sync_audits")
    .select("id, status, completed_at, clinic_id, clinics(name)")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(10);

  if (syncs) {
    syncs.forEach((sync) => {
      // Handle Supabase join which can be returned as an array or object
      const clinicData = sync.clinics;
      const clinicName = Array.isArray(clinicData)
        ? clinicData[0]?.name
        : ((clinicData as { name: string } | null)?.name ?? "Unknown Clinic");
      activities.push({
        id: `sync-${sync.id}`,
        type: sync.status === "completed" ? "sync_completed" : "sync_failed",
        title: sync.status === "completed" ? "Sync Completed" : "Sync Failed",
        description: clinicName,
        timestamp: new Date(sync.completed_at),
        status: sync.status === "completed" ? "success" : "error",
      });
    });
  }

  // Sort all activities by timestamp
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);
}

function getActivityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "clinic_created":
      return Building2;
    case "user_joined":
      return User;
    case "sync_completed":
    case "sync_failed":
      return RefreshCw;
  }
}

function getActivityColor(
  type: ActivityItem["type"],
  status?: ActivityItem["status"],
) {
  if (status === "error") return "text-red-600 bg-red-100";
  if (status === "success") return "text-emerald-600 bg-emerald-100";

  switch (type) {
    case "clinic_created":
      return "text-amber-600 bg-amber-100";
    case "user_joined":
      return "text-blue-600 bg-blue-100";
    case "sync_completed":
      return "text-emerald-600 bg-emerald-100";
    case "sync_failed":
      return "text-red-600 bg-red-100";
  }
}

export async function RecentActivityFeed() {
  const activities = await getRecentActivity();

  return (
    <Card className="border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
            <Clock className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
            <p className="text-sm text-slate-500">Latest platform events</p>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Clock className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(
                activity.type,
                activity.status,
              );

              return (
                <div
                  key={activity.id}
                  className="group flex items-start gap-4 p-4 transition-colors hover:bg-slate-50"
                >
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${colorClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">
                          {activity.title}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {activity.description}
                        </p>
                      </div>
                      {activity.status && (
                        <div className="flex-shrink-0">
                          {activity.status === "success" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDistanceToNow(activity.timestamp, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
