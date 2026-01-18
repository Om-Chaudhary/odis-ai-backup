import { api } from "~/trpc/client";
import { Card } from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Avatar, AvatarFallback } from "@odis-ai/shared/ui/avatar";
import { User } from "lucide-react";

interface ClinicUsersTabProps {
  clinicId: string;
}

export function ClinicUsersTab({ clinicId }: ClinicUsersTabProps) {
  const { data: clinicUsers, isLoading } =
    api.admin.clinics.getClinicUsers.useQuery({
      clinicId,
    });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-600" />
          <p className="text-sm text-slate-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-900">Clinic Users</h3>
        <p className="text-sm text-slate-500">
          {clinicUsers?.length ?? 0} users have access to this clinic
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {clinicUsers && clinicUsers.length > 0 ? (
          clinicUsers.map((access) => {
            console.log(access.users);
            const user = access.users;
            if (!user) return null;

            const initials =
              [user.first_name, user.last_name]
                .filter(Boolean)
                .map((n) => n?.[0])
                .join("")
                .toUpperCase() || "?";

            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-amber-100 text-amber-700">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="font-medium text-slate-900">
                      {[user.first_name, user.last_name]
                        .filter(Boolean)
                        .join(" ") || "Unnamed User"}
                    </p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {access.role ?? "member"}
                  </Badge>
                  {user.role === "admin" && (
                    <Badge className="bg-amber-100 text-amber-700">
                      Platform Admin
                    </Badge>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center">
            <User className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm text-slate-500">
              No users assigned to this clinic
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
