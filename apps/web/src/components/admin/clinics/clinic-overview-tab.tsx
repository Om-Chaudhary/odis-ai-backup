"use client";

import type { Database } from "@odis-ai/shared/types";
import { Card } from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import {
  Building2,
  Globe,
  Clock,
  Database as DatabaseIcon,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";

type Clinic = Database["public"]["Tables"]["clinics"]["Row"];

interface ClinicOverviewTabProps {
  clinic: Clinic;
}

export function ClinicOverviewTab({ clinic }: ClinicOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Basic Info Card */}
      <Card className="border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Clinic Information
        </h3>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Name & Slug */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <Building2 className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                  Clinic Name
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {clinic.name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <Globe className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                  URL Slug
                </p>
                <p className="font-mono text-sm text-slate-700">
                  {clinic.slug}
                </p>
              </div>
            </div>
          </div>

          {/* Timezone & PIMS */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <Clock className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                  Timezone
                </p>
                <p className="text-sm text-slate-700">
                  {clinic.timezone ?? "America/Los_Angeles"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <DatabaseIcon className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                  PIMS Type
                </p>
                <Badge variant="outline" className="mt-0.5 font-mono uppercase">
                  {clinic.pims_type ?? "none"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Status Card */}
      <Card className="border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Status</h3>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              Status
            </p>
            <Badge
              variant={clinic.is_active ? "default" : "secondary"}
              className={
                clinic.is_active
                  ? "mt-2 bg-emerald-100 text-emerald-700"
                  : "mt-2 bg-slate-100 text-slate-500"
              }
            >
              {clinic.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              Created
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-700">
                {new Date(clinic.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              Last Updated
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-700">
                {new Date(clinic.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Info Card */}
      <Card className="border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Contact Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
            <Phone className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                Primary Phone
              </p>
              <p className="text-sm text-slate-700">
                {clinic.phone ?? "Not configured"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
            <Mail className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                Email
              </p>
              <p className="text-sm text-slate-700">
                {clinic.email ?? "Not configured"}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
