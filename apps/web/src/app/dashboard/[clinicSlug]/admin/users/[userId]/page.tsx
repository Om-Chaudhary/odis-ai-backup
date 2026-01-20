"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/client";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Avatar, AvatarFallback } from "@odis-ai/shared/ui/avatar";
import { ArrowLeft, Shield, User as UserIcon } from "lucide-react";
import { UserProfileSection } from "~/components/admin/users/user-profile-section";
import { UserClinicsSection } from "~/components/admin/users/user-clinics-section";
import { UserActivitySection } from "~/components/admin/users/user-activity-section";

export default function UserDetailPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const userId = params.userId;

  const { data: user, isLoading } = api.admin.users.getById.useQuery({
    userId,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-amber-600" />
          <p className="text-sm text-slate-500">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <UserIcon className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h3 className="mb-2 text-lg font-semibold text-slate-900">
            User Not Found
          </h3>
          <p className="mb-4 text-sm text-slate-500">
            The user you're looking for doesn't exist
          </p>
          <Button variant="outline" onClick={() => router.push("/admin/users")}>
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  const initials =
    [user.first_name, user.last_name]
      .filter(Boolean)
      .map((n) => n?.[0])
      .join("")
      .toUpperCase() || "?";

  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    "Unnamed User";

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/users")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-amber-100 text-xl text-amber-700">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {fullName}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    user.role === "admin"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "capitalize"
                  }
                >
                  {user.role === "admin" && <Shield className="mr-1 h-3 w-3" />}
                  {user.role ?? "staff"}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{user.email}</p>
              {user.clinic_name && (
                <p className="text-sm text-slate-500">
                  Clinic: {user.clinic_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Section */}
        <UserProfileSection user={user} userId={userId} />

        {/* Clinics Section */}
        <UserClinicsSection user={user} userId={userId} />
      </div>

      {/* Activity Section */}
      <UserActivitySection userId={userId} />
    </div>
  );
}
