import { Label } from "@odis-ai/ui/label";
import { Switch } from "@odis-ai/ui/switch";
import { Separator } from "@odis-ai/ui/separator";
import { Alert, AlertDescription } from "@odis-ai/ui/alert";
import { Calendar } from "lucide-react";
import type { UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { DischargeSettings } from "@odis-ai/types";

interface BatchPreferencesSectionProps {
  watch: UseFormWatch<DischargeSettings>;
  setValue: UseFormSetValue<DischargeSettings>;
}

export function BatchPreferencesSection({
  watch,
  setValue,
}: BatchPreferencesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-purple-500" />
        <h4 className="text-sm font-medium">Batch Discharge Preferences</h4>
      </div>

      <div className="grid gap-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="batch-idexx" className="text-sm">
              Include IDEXX Neo Cases
            </Label>
            <p className="text-muted-foreground text-xs">
              Auto-include IDEXX Neo cases with consultation notes in batch
              discharge
            </p>
          </div>
          <Switch
            id="batch-idexx"
            checked={watch("batchIncludeIdexxNotes") ?? true}
            onCheckedChange={(checked) =>
              setValue("batchIncludeIdexxNotes", checked, {
                shouldDirty: true,
              })
            }
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="batch-manual" className="text-sm">
              Include Manual Cases
            </Label>
            <p className="text-muted-foreground text-xs">
              Auto-include manual cases with transcriptions or SOAP notes
            </p>
          </div>
          <Switch
            id="batch-manual"
            checked={watch("batchIncludeManualTranscriptions") ?? true}
            onCheckedChange={(checked) =>
              setValue("batchIncludeManualTranscriptions", checked, {
                shouldDirty: true,
              })
            }
          />
        </div>
      </div>

      {/* Schedule Preview */}
      <Alert>
        <Calendar className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Default Schedule Preview:</strong> Based on your settings,
          batch discharges will:
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              Send emails{" "}
              <strong>
                {watch("emailDelayDays") ?? 1} day
                {(watch("emailDelayDays") ?? 1) !== 1 ? "s" : ""}
              </strong>{" "}
              after appointment between{" "}
              <strong>{watch("preferredEmailStartTime") ?? "9:00 AM"}</strong>{" "}
              and{" "}
              <strong>{watch("preferredEmailEndTime") ?? "12:00 PM"}</strong>
            </li>
            <li>
              Make follow-up calls{" "}
              <strong>
                {watch("callDelayDays") ?? 2} day
                {(watch("callDelayDays") ?? 2) !== 1 ? "s" : ""}
              </strong>{" "}
              after email between{" "}
              <strong>{watch("preferredCallStartTime") ?? "2:00 PM"}</strong>{" "}
              and <strong>{watch("preferredCallEndTime") ?? "5:00 PM"}</strong>
            </li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
