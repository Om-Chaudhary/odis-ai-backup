"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Clock, Plus, Loader2, X } from "lucide-react";
import { api } from "~/trpc/client";
import { Button } from "@odis-ai/shared/ui/button";
import { BusinessHoursForm } from "./business-hours-form";
import { BlockedPeriodsList } from "./blocked-periods-list";
import { BlockedPeriodInlineForm } from "./blocked-period-inline-form";

export function HoursPageClient() {
  const params = useParams<{ clinicSlug: string }>();
  const clinicSlug = params?.clinicSlug;
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: scheduleConfig, isLoading: isLoadingSchedule } =
    api.settings.schedule.getScheduleConfig.useQuery({ clinicSlug });

  const { data: blockedPeriods = [], isLoading: isLoadingPeriods } =
    api.settings.schedule.getBlockedPeriods.useQuery({ clinicSlug });

  const clinicId = scheduleConfig?.clinic_id;
  const isLoading = isLoadingSchedule || isLoadingPeriods;

  return (
    <div className="mx-auto max-w-4xl px-8 py-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100/80 text-teal-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Hours of Operation
            </h1>
            <p className="text-sm text-slate-500">
              Configure your clinic's business hours and time segments
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Business Hours Card */}
          <div className="rounded-lg border border-slate-200/60 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                Business Hours
              </h2>
              <p className="text-sm text-slate-500">
                Set your regular operating hours and days
              </p>
            </div>
            <BusinessHoursForm
              initialData={scheduleConfig}
              clinicSlug={clinicSlug}
              clinicId={clinicId}
            />
          </div>

          {/* Time Segments Card */}
          <div className="rounded-lg border border-slate-200/60 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Time Segments
                </h2>
                <p className="text-sm text-slate-500">
                  Manage blocked periods like lunch breaks and staff meetings
                </p>
              </div>
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add Segment
                </Button>
              )}
            </div>

            {/* Inline Add Form */}
            {showAddForm && (
              <div className="mb-6 rounded-lg border border-teal-200 bg-teal-50/30 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">
                    Add Time Segment
                  </h3>
                  <Button
                    onClick={() => setShowAddForm(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <BlockedPeriodInlineForm
                  clinicSlug={clinicSlug}
                  onSuccess={() => setShowAddForm(false)}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            )}

            <BlockedPeriodsList periods={blockedPeriods} clinicSlug={clinicSlug} />
          </div>
        </div>
      )}
    </div>
  );
}
