import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import { Mail, Clock, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/shared/ui/tooltip";
import type { UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { DischargeSettings } from "@odis-ai/shared/types";
import { TIME_OPTIONS } from "../constants";

interface EmailSchedulingSectionProps {
  watch: UseFormWatch<DischargeSettings>;
  setValue: UseFormSetValue<DischargeSettings>;
}

export function EmailSchedulingSection({
  watch,
  setValue,
}: EmailSchedulingSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-blue-500" />
        <h4 className="text-sm font-medium">Email Scheduling</h4>
      </div>

      <div className="grid gap-4 rounded-lg border p-4">
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Label>Preferred Email Window</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Discharge emails will be scheduled within this time window.
                    For batch operations, emails will be sent during this
                    period.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-muted-foreground mb-1 block text-xs">
                Start Time
              </Label>
              <Select
                value={watch("preferredEmailStartTime") ?? "09:00"}
                onValueChange={(value) =>
                  setValue("preferredEmailStartTime", value, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-muted-foreground mt-5">to</span>
            <div className="flex-1">
              <Label className="text-muted-foreground mb-1 block text-xs">
                End Time
              </Label>
              <Select
                value={watch("preferredEmailEndTime") ?? "12:00"}
                onValueChange={(value) =>
                  setValue("preferredEmailEndTime", value, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="emailDelayDays">Days After Appointment</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Number of days to wait after an appointment before sending
                    the discharge email. Default is 1 day (next day).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="emailDelayDays"
              type="number"
              min="0"
              max="30"
              className="w-24"
              value={watch("emailDelayDays") ?? 1}
              onChange={(e) => {
                const value = e.target.value;
                setValue(
                  "emailDelayDays",
                  value === "" ? 1 : Number.parseInt(value, 10),
                  { shouldDirty: true },
                );
              }}
            />
            <span className="text-muted-foreground text-sm">
              day{(watch("emailDelayDays") ?? 1) !== 1 ? "s" : ""} after
              appointment
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
