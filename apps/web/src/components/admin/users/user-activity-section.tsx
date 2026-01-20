import { api } from "~/trpc/client";
import { Card } from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import { FileText, Phone, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UserActivitySectionProps {
  userId: string;
}

export function UserActivitySection({ userId }: UserActivitySectionProps) {
  const { data: activity, isLoading } =
    api.admin.users.getUserActivity.useQuery({
      userId,
      limit: 10,
    });

  return (
    <Card className="border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">
        Recent Activity
      </h3>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-amber-600" />
            <p className="text-sm text-slate-500">Loading activity...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Recent Cases */}
          {activity?.cases && activity.cases.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-medium text-slate-700">
                Recent Cases
              </h4>
              <div className="space-y-2">
                {}
                {activity.cases.map((case_) => (
                  <div
                    key={case_.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {case_.patient_name ?? "Unnamed Patient"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(case_.created_at!), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Calls */}
          {activity?.calls && activity.calls.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-medium text-slate-700">
                Recent Calls
              </h4>
              <div className="space-y-2">
                {}
                {activity.calls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                        <Phone className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {}
                          Call ID: {call.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(call.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {call.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Activity */}
          {(!activity?.cases || activity.cases.length === 0) &&
            (!activity?.calls || activity.calls.length === 0) && (
              <div className="py-8 text-center">
                <Clock className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <p className="text-sm text-slate-500">No recent activity</p>
              </div>
            )}
        </div>
      )}
    </Card>
  );
}
