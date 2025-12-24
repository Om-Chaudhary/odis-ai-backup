import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import { Phone, Clock, Info, Calendar, RotateCcw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/shared/ui/tooltip";
import type { UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { DischargeSettings } from "@odis-ai/shared/types";
import { TIME_OPTIONS } from "../constants";

interface CallSchedulingSectionProps {
  watch: UseFormWatch<DischargeSettings>;
  setValue: UseFormSetValue<DischargeSettings>;
}

export function CallSchedulingSection({
  watch,
  setValue,
}: CallSchedulingSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100/80 text-green-600">
          <Phone className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-slate-700">
            Call Scheduling
          </h4>
          <p className="text-xs text-slate-500">
            Configure when follow-up calls are made
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-teal-100/60 bg-white/50 p-4 backdrop-blur-sm">
        {/* Time Window */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <Label className="text-sm font-medium text-slate-700">
              Preferred Call Window
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 cursor-help text-slate-400 transition-colors hover:text-slate-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Follow-up calls will be scheduled within this time window.
                    Calls are typically made in the afternoon when pet owners
                    are more available.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-slate-500">Start Time</Label>
              <Select
                value={watch("preferredCallStartTime") ?? "14:00"}
                onValueChange={(value) =>
                  setValue("preferredCallStartTime", value, {
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
                value={watch("preferredCallEndTime") ?? "17:00"}
                onValueChange={(value) =>
                  setValue("preferredCallEndTime", value, {
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

        {/* Call Delay Days */}
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <Label
              htmlFor="callDelayDays"
              className="text-sm font-medium text-slate-700"
            >
              Days After Email
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 cursor-help text-slate-400 transition-colors hover:text-slate-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Number of days to wait after sending the discharge email
                    before making a follow-up call. Default is 2 days.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-3">
            <Input
              id="callDelayDays"
              type="number"
              min="0"
              max="30"
              className="w-20 border-slate-200 bg-white/80 text-center focus:border-teal-400 focus:ring-teal-400/20"
              value={watch("callDelayDays") ?? 2}
              onChange={(e) => {
                const value = e.target.value;
                setValue(
                  "callDelayDays",
                  value === "" ? 2 : Number.parseInt(value, 10),
                  { shouldDirty: true },
                );
              }}
            />
            <span className="text-sm text-slate-500">
              day{(watch("callDelayDays") ?? 2) !== 1 ? "s" : ""} after email
            </span>
          </div>
        </div>

        {/* Max Retries */}
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-slate-400" />
            <Label
              htmlFor="maxCallRetries"
              className="text-sm font-medium text-slate-700"
            >
              Max Retry Attempts
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 cursor-help text-slate-400 transition-colors hover:text-slate-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Maximum number of times to retry a failed call (busy, no
                    answer, etc.). Default is 3 attempts.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-3">
            <Input
              id="maxCallRetries"
              type="number"
              min="0"
              max="10"
              className="w-20 border-slate-200 bg-white/80 text-center focus:border-teal-400 focus:ring-teal-400/20"
              value={watch("maxCallRetries") ?? 3}
              onChange={(e) => {
                const value = e.target.value;
                setValue(
                  "maxCallRetries",
                  value === "" ? 3 : Number.parseInt(value, 10),
                  { shouldDirty: true },
                );
              }}
            />
            <span className="text-sm text-slate-500">retry attempts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
