"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "~/trpc/client";
import { Button } from "@odis-ai/shared/ui/button";
import { Input } from "@odis-ai/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import { ClinicsDataTable } from "~/components/admin/clinics/clinics-data-table";
import { Plus, Search } from "lucide-react";
import { Card } from "@odis-ai/shared/ui/card";
import type { Database } from "@odis-ai/shared/types";

type Clinic = Database["public"]["Tables"]["clinics"]["Row"];

export default function AdminClinicsPage() {
  const router = useRouter();
  const params = useParams<{ clinicSlug: string }>();
  const clinicSlug = params.clinicSlug;
  const [search, setSearch] = useState("");
  const [pimsType, setPimsType] = useState<"all" | "idexx" | "neo">("all");
  const [isActive, setIsActive] = useState<boolean | undefined>(true);

  const { data, isLoading } = api.admin.clinics.list.useQuery({
    search: search || undefined,
    pimsType: pimsType,
    isActive: isActive,
    limit: 50,
    offset: 0,
  });

  // Use any to bypass deep type instantiation, then cast to Clinic[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clinics = (data?.clinics ?? []) as any as Clinic[];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Clinic Management
          </h1>
          <p className="text-sm text-slate-500">
            Manage clinic settings, users, and configuration
          </p>
        </div>
        <Button
          onClick={() =>
            router.push(`/dashboard/${clinicSlug}/admin/clinics/create`)
          }
          className="gap-2 bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Create Clinic
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative min-w-[300px] flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={pimsType}
            onValueChange={(value: "all" | "idexx" | "neo") =>
              setPimsType(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="PIMS Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All PIMS</SelectItem>
              <SelectItem value="idexx">IDEXX</SelectItem>
              <SelectItem value="neo">Neo</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={
              isActive === undefined ? "all" : isActive ? "active" : "inactive"
            }
            onValueChange={(value) => {
              if (value === "all") {
                setIsActive(undefined);
              } else {
                setIsActive(value === "active");
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Clinics Table */}
      <ClinicsDataTable
        data={clinics}
        isLoading={isLoading}
        clinicSlug={clinicSlug}
      />

      {/* Results count */}
      {data && (
        <div className="text-center text-sm text-slate-500">
          Showing {clinics.length} of {data.total} clinics
        </div>
      )}
    </div>
  );
}
