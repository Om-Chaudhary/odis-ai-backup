import { Input } from "@odis-ai/ui/input";
import { Label } from "@odis-ai/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/ui/select";
import { Phone, Clock, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/ui/tooltip";
import type { UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { DischargeSettings } from "@odis-ai/types";
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
        <Phone className="h-4 w-4 text-green-500" />
        <h4 className="text-sm font-medium">Call Scheduling</h4>
      </div>

      <div className="grid gap-4 rounded-lg border p-4">
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Label>Preferred Call Window</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="text-muted-foreground h-4 w-4 cursor-help" />
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
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-muted-foreground mb-1 block text-xs">
                Start Time
              </Label>
              <Select
                value={watch("preferredCallStartTime") ?? "14:00"}
                onValueChange={(value) =>
                  setValue("preferredCallStartTime", value, {
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
                value={watch("preferredCallEndTime") ?? "17:00"}
                onValueChange={(value) =>
                  setValue("preferredCallEndTime", value, {
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
            <Label htmlFor="callDelayDays">Days After Email</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="text-muted-foreground h-4 w-4 cursor-help" />
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
          <div className="flex items-center gap-2">
            <Input
              id="callDelayDays"
              type="number"
              min="0"
              max="30"
              className="w-24"
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
            <span className="text-muted-foreground text-sm">
              day{(watch("callDelayDays") ?? 2) !== 1 ? "s" : ""} after email
            </span>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="maxCallRetries">Max Retry Attempts</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="text-muted-foreground h-4 w-4 cursor-help" />
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
          <div className="flex items-center gap-2">
            <Input
              id="maxCallRetries"
              type="number"
              min="0"
              max="10"
              className="w-24"
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
            <span className="text-muted-foreground text-sm">attempts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
