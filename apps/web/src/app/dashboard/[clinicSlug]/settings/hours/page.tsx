"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowRight, Clock } from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import { api } from "~/trpc/client";

export default function HoursSettingsPage() {
  const params = useParams<{ clinicSlug: string }>();
  const clinicSlug = params?.clinicSlug;

  // Get the clinic ID to link to the new location
  const { data: scheduleConfig } =
    api.settings.schedule.getScheduleConfig.useQuery({
      clinicSlug,
    });

  const clinicId = scheduleConfig?.clinic_id;

  return (
    <div className="mx-auto max-w-2xl px-8 py-12">
      <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-6 w-6 text-amber-600" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-amber-900">
          Settings Moved
        </h2>
        <div className="mb-6 flex items-start justify-center gap-2 text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">
            Business hours and scheduling settings have been moved to the clinic
            configuration page for better organization.
          </p>
        </div>
        {clinicId ? (
          <Button asChild className="bg-amber-600 hover:bg-amber-700">
            <Link
              href={`/dashboard/${clinicSlug}/admin/clinics/${clinicId}?tab=scheduling`}
            >
              Go to Scheduling Settings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href={`/dashboard/${clinicSlug}/admin/clinics`}>
              Go to Clinic Settings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
