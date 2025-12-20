import { Label } from "@odis-ai/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/ui/select";
import { Clock, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/ui/tooltip";

interface TimeOption {
  value: string;
  label: string;
}

interface TimeWindowPickerProps {
  startTime: string;
  endTime: string;
  timeOptions: TimeOption[];
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  label?: string;
  tooltipText?: string;
}

/**
 * Reusable time window picker for email/call scheduling
 */
export function TimeWindowPicker({
  startTime,
  endTime,
  timeOptions,
  onStartTimeChange,
  onEndTimeChange,
  label = "Time Window",
  tooltipText,
}: TimeWindowPickerProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {tooltipText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="text-muted-foreground h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Label className="text-muted-foreground mb-1 block text-xs">
            Start Time
          </Label>
          <Select value={startTime} onValueChange={onStartTimeChange}>
            <SelectTrigger>
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((option) => (
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
          <Select value={endTime} onValueChange={onEndTimeChange}>
            <SelectTrigger>
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
