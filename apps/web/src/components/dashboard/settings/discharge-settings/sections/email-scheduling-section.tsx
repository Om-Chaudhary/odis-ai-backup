import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import { Mail, Clock, Info, Calendar } from "lucide-react";
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
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100/80 text-blue-600">
          <Mail className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-slate-700">
            Email Scheduling
          </h4>
          <p className="text-xs text-slate-500">
            Configure when discharge emails are sent
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-teal-100/60 bg-white/50 p-4 backdrop-blur-sm">
        {/* Time Window */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <Label className="text-sm font-medium text-slate-700">
              Preferred Email Window
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 cursor-help text-slate-400 transition-colors hover:text-slate-600" />
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

          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-slate-500">Start Time</Label>
              <Select
                value={watch("preferredEmailStartTime") ?? "09:00"}
                onValueChange={(value) =>
                  setValue("preferredEmailStartTime", value, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger className="border-slate-200 bg-white/80 focus:border-teal-400 focus:ring-teal-400/20">
                  <Clock className="mr-2 h-4 w-4 text-slate-400" />
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

            <div className="flex h-10 items-center px-2">
              <span className="text-sm text-slate-400">to</span>
            </div>

            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-slate-500">End Time</Label>
              <Select
                value={watch("preferredEmailEndTime") ?? "12:00"}
                onValueChange={(value) =>
                  setValue("preferredEmailEndTime", value, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger className="border-slate-200 bg-white/80 focus:border-teal-400 focus:ring-teal-400/20">
                  <Clock className="mr-2 h-4 w-4 text-slate-400" />
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

        {/* Delay Days */}
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <Label
              htmlFor="emailDelayDays"
              className="text-sm font-medium text-slate-700"
            >
              Days After Appointment
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 cursor-help text-slate-400 transition-colors hover:text-slate-600" />
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

          <div className="flex items-center gap-3">
            <Input
              id="emailDelayDays"
              type="number"
              min="0"
              max="30"
              className="w-20 border-slate-200 bg-white/80 text-center focus:border-teal-400 focus:ring-teal-400/20"
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
            <span className="text-sm text-slate-500">
              day{(watch("emailDelayDays") ?? 1) !== 1 ? "s" : ""} after
              appointment
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
