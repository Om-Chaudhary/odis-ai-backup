"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/client";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@odis-ai/shared/ui/tabs";
import { ArrowLeft, Building2 } from "lucide-react";
import { ClinicOverviewTab } from "~/components/admin/clinics/clinic-overview-tab";
import { ClinicSettingsTab } from "~/components/admin/clinics/clinic-settings-tab";
import { ClinicUsersTab } from "~/components/admin/clinics/clinic-users-tab";
import { ClinicSyncTab } from "~/components/admin/clinics/clinic-sync-tab";

export default function ClinicDetailPage() {
  const params = useParams<{ clinicId: string }>();
  const router = useRouter();
  const clinicId = params.clinicId;

  const { data: clinic, isLoading } = api.admin.clinics.getById.useQuery({
    clinicId,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-amber-600" />
          <p className="text-sm text-slate-500">Loading clinic details...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h3 className="mb-2 text-lg font-semibold text-slate-900">
            Clinic Not Found
          </h3>
          <p className="mb-4 text-sm text-slate-500">
            The clinic you're looking for doesn't exist
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/clinics")}
          >
            Back to Clinics
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/clinics")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {clinic.name}
              </h1>
              <Badge
                variant={clinic.is_active ? "default" : "secondary"}
                className={
                  clinic.is_active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }
              >
                {clinic.is_active ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline" className="font-mono uppercase">
                {clinic.pims_type}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              {clinic.slug} • Created{" "}
              {new Date(clinic.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push(`/admin/clinics/${clinicId}/edit`)}
        >
          Edit Settings
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:inline-grid lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="sync">PIMS Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <ClinicOverviewTab clinic={clinic} clinicId={clinicId} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <ClinicSettingsTab clinic={clinic} clinicId={clinicId} />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <ClinicUsersTab clinicId={clinicId} />
        </TabsContent>

        <TabsContent value="sync" className="mt-6">
          <ClinicSyncTab clinic={clinic} clinicId={clinicId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
