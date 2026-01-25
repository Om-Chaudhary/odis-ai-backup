"use client";

import { useParams, useRouter } from "next/navigation";
import type { Database } from "@odis-ai/shared/types";
import { api } from "~/trpc/client";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import { ArrowLeft, Building2 } from "lucide-react";
import { ClinicSyncTab } from "~/components/admin/clinics/clinic-sync-tab";

type Clinic = Database["public"]["Tables"]["clinics"]["Row"];

export default function ClinicDetailPage() {
  const params = useParams<{ clinicId: string; clinicSlug: string }>();
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

  // Type assertion to break deep type inference chain from tRPC/Supabase
  const clinicData = clinic as unknown as Clinic;

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
                {clinicData.name}
              </h1>
              <Badge
                variant={clinicData.is_active ? "default" : "secondary"}
                className={
                  clinicData.is_active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }
              >
                {clinicData.is_active ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline" className="font-mono uppercase">
                {clinicData.pims_type}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              {clinicData.slug} • Created{" "}
              {new Date(clinicData.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

      </div>

      {/* PIMS Sync Configuration */}
      <ClinicSyncTab clinic={clinicData} clinicId={clinicId} />
    </div>
  );
}
