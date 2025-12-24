import { Label } from "@odis-ai/shared/ui/label";
import { Switch } from "@odis-ai/shared/ui/switch";
import { Calendar, FileText, Layers, Mail, Phone } from "lucide-react";
import type { UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { DischargeSettings } from "@odis-ai/shared/types";

interface BatchPreferencesSectionProps {
  watch: UseFormWatch<DischargeSettings>;
  setValue: UseFormSetValue<DischargeSettings>;
}

export function BatchPreferencesSection({
  watch,
  setValue,
}: BatchPreferencesSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-100/80 text-purple-600">
          <Layers className="h-3.5 w-3.5" />
        </div>
        <h4 className="text-sm font-medium text-slate-700">
          Batch Discharge Preferences
        </h4>
      </div>

      <div className="space-y-4">
        {/* IDEXX Cases Toggle */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100/80 text-indigo-600">
              <FileText className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <Label
                htmlFor="batch-idexx"
                className="text-sm font-medium text-slate-700"
              >
                Include IDEXX Neo Cases
              </Label>
              <p className="text-xs text-slate-500">
                Auto-include IDEXX Neo cases with consultation notes
              </p>
            </div>
          </div>
          <Switch
            id="batch-idexx"
            checked={watch("batchIncludeIdexxNotes") ?? true}
            onCheckedChange={(checked) =>
              setValue("batchIncludeIdexxNotes", checked, {
                shouldDirty: true,
              })
            }
            className="data-[state=checked]:bg-teal-500"
          />
        </div>

        {/* Manual Cases Toggle */}
        <div className="flex items-center justify-between border-t border-slate-100 py-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100/80 text-amber-600">
              <FileText className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <Label
                htmlFor="batch-manual"
                className="text-sm font-medium text-slate-700"
              >
                Include Manual Cases
              </Label>
              <p className="text-xs text-slate-500">
                Auto-include manual cases with transcriptions or SOAP notes
              </p>
            </div>
          </div>
          <Switch
            id="batch-manual"
            checked={watch("batchIncludeManualTranscriptions") ?? true}
            onCheckedChange={(checked) =>
              setValue("batchIncludeManualTranscriptions", checked, {
                shouldDirty: true,
              })
            }
            className="data-[state=checked]:bg-teal-500"
          />
        </div>
      </div>

      {/* Schedule Preview */}
      <div className="rounded-lg border border-slate-200/60 bg-slate-50/50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal-100/80 text-teal-600">
            <Calendar className="h-3.5 w-3.5" />
          </div>
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-slate-700">
              Schedule Preview
            </h5>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-blue-500" />
                <span>
                  Emails:{" "}
                  <span className="font-medium">
                    {watch("emailDelayDays") ?? 1} day
                    {(watch("emailDelayDays") ?? 1) !== 1 ? "s" : ""}
                  </span>{" "}
                  after appointment,{" "}
                  <span className="font-medium">
                    {watch("preferredEmailStartTime") ?? "9:00 AM"}
                  </span>
                  {" - "}
                  <span className="font-medium">
                    {watch("preferredEmailEndTime") ?? "12:00 PM"}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-green-500" />
                <span>
                  Calls:{" "}
                  <span className="font-medium">
                    {watch("callDelayDays") ?? 2} day
                    {(watch("callDelayDays") ?? 2) !== 1 ? "s" : ""}
                  </span>{" "}
                  after email,{" "}
                  <span className="font-medium">
                    {watch("preferredCallStartTime") ?? "2:00 PM"}
                  </span>
                  {" - "}
                  <span className="font-medium">
                    {watch("preferredCallEndTime") ?? "5:00 PM"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
