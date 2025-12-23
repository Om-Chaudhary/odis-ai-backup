"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/client";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  PawPrint,
  Calendar,
  Building,
  Clock,
  TestTube,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Button } from "@odis-ai/ui/button";
import { Badge } from "@odis-ai/ui/badge";
import { Skeleton } from "@odis-ai/ui/skeleton";
import { Switch } from "@odis-ai/ui/switch";
import { Label } from "@odis-ai/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/ui/select";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-rose-100 text-rose-700",
  veterinarian: "bg-emerald-100 text-emerald-700",
  vet_tech: "bg-blue-100 text-blue-700",
  practice_owner: "bg-purple-100 text-purple-700",
  client: "bg-slate-100 text-slate-700",
};

function StatCard({
  title,
  value,
  icon: Icon,
  href,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  href?: string;
}) {
  const router = useRouter();

  return (
    <Card
      className={href ? "cursor-pointer transition-colors hover:bg-slate-50" : ""}
      onClick={href ? () => router.push(href) : undefined}
    >
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{title}</p>
        </div>
        {href && <ExternalLink className="ml-auto h-4 w-4 text-slate-400" />}
      </CardContent>
    </Card>
  );
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [isEditing, setIsEditing] = useState(false);
  const [editedRole, setEditedRole] = useState<string | null>(null);
  const [editedTestMode, setEditedTestMode] = useState<boolean | null>(null);

  const { data, isLoading, error, refetch } = api.admin.getUser.useQuery({
    userId,
  });

  const updateMutation = api.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      setIsEditing(false);
      setEditedRole(null);
      setEditedTestMode(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });

  const handleSaveChanges = () => {
    type UserRole = "admin" | "veterinarian" | "vet_tech" | "practice_owner" | "client";
    const updates: { role?: UserRole; testModeEnabled?: boolean } = {};

    if (editedRole !== null && editedRole !== data?.user.role) {
      updates.role = editedRole as UserRole;
    }
    if (
      editedTestMode !== null &&
      editedTestMode !== data?.user.testModeEnabled
    ) {
      updates.testModeEnabled = editedTestMode;
    }

    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }

    updateMutation.mutate({ userId, updates });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedRole(null);
    setEditedTestMode(null);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-semibold text-slate-900">
          Failed to load user
        </h2>
        <p className="mt-2 text-sm text-slate-600">{error.message}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/admin/accounts")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Accounts
        </Button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { user, stats } = data;
  const currentRole = editedRole ?? user.role;
  const currentTestMode = editedTestMode ?? user.testModeEnabled;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/accounts")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {user.firstName
                  ? `${user.firstName} ${user.lastName ?? ""}`
                  : user.email}
              </h1>
              <Badge className={ROLE_COLORS[user.role ?? ""] ?? "bg-slate-100"}>
                {user.role?.replace("_", " ") ?? "Unknown"}
              </Badge>
              {user.testModeEnabled && (
                <Badge variant="outline" className="text-amber-600">
                  <TestTube className="mr-1 h-3 w-3" />
                  Test Mode
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit User
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Cases"
          value={stats.cases}
          icon={Briefcase}
          href={`/admin/cases?userId=${userId}`}
        />
        <StatCard
          title="Patients"
          value={stats.patients}
          icon={PawPrint}
          href={`/admin/patients?userId=${userId}`}
        />
        <StatCard
          title="Calls"
          value={stats.calls}
          icon={Phone}
          href={`/admin/discharges/calls?userId=${userId}`}
        />
        <StatCard
          title="Emails"
          value={stats.emails}
          icon={Mail}
          href={`/admin/discharges/emails?userId=${userId}`}
        />
      </div>

      {/* User Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  First Name
                </p>
                <p className="text-sm text-slate-900">
                  {user.firstName ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Last Name
                </p>
                <p className="text-sm text-slate-900">
                  {user.lastName ?? "—"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Email
              </p>
              <p className="text-sm text-slate-900">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Role
              </p>
              {isEditing ? (
                <Select
                  value={currentRole ?? ""}
                  onValueChange={setEditedRole}
                >
                  <SelectTrigger className="mt-1 w-48">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="veterinarian">Veterinarian</SelectItem>
                    <SelectItem value="vet_tech">Vet Tech</SelectItem>
                    <SelectItem value="practice_owner">
                      Practice Owner
                    </SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm capitalize text-slate-900">
                  {user.role?.replace("_", " ") ?? "—"}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Test Mode
                </p>
                <p className="text-xs text-slate-400">
                  When enabled, calls and emails are simulated
                </p>
              </div>
              {isEditing ? (
                <Switch
                  checked={currentTestMode ?? false}
                  onCheckedChange={setEditedTestMode}
                />
              ) : (
                <Badge
                  variant={user.testModeEnabled ? "default" : "outline"}
                  className={user.testModeEnabled ? "bg-amber-100 text-amber-700" : ""}
                >
                  {user.testModeEnabled ? "Enabled" : "Disabled"}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Onboarding
                </p>
              </div>
              <Badge
                variant={user.onboardingCompleted ? "default" : "secondary"}
                className={user.onboardingCompleted ? "bg-emerald-100 text-emerald-700" : ""}
              >
                {user.onboardingCompleted ? "Completed" : "Pending"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Clinic Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building className="h-4 w-4" />
              Clinic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Clinic Name
              </p>
              <p className="text-sm text-slate-900">
                {user.clinicName ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Clinic Email
              </p>
              <p className="text-sm text-slate-900">
                {user.clinicEmail ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Clinic Phone
              </p>
              <p className="text-sm text-slate-900">
                {user.clinicPhone ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Emergency Phone
              </p>
              <p className="text-sm text-slate-900">
                {user.emergencyPhone ?? "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Discharge Settings Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Discharge Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Email Window
                </p>
                <p className="text-sm text-slate-900">
                  {user.preferredEmailStartTime ?? "09:00"} -{" "}
                  {user.preferredEmailEndTime ?? "17:00"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Call Window
                </p>
                <p className="text-sm text-slate-900">
                  {user.preferredCallStartTime ?? "09:00"} -{" "}
                  {user.preferredCallEndTime ?? "17:00"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Email Delay
                </p>
                <p className="text-sm text-slate-900">
                  {user.emailDelayDays ?? 0} days
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Call Delay
                </p>
                <p className="text-sm text-slate-900">
                  {user.callDelayDays ?? 0} days
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Max Call Retries
                </p>
                <p className="text-sm text-slate-900">
                  {user.maxCallRetries ?? 3}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timestamps Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Account Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Created
                </p>
                <p className="text-sm text-slate-900">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Last Updated
                </p>
                <p className="text-sm text-slate-900">
                  {new Date(user.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
