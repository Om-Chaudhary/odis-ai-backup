import { Input } from "@odis-ai/ui/input";
import { Label } from "@odis-ai/ui/label";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/ui/tooltip";

interface DelayInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: "days" | "minutes" | "hours";
  min?: number;
  max?: number;
  tooltipText?: string;
  suffixText?: string;
}

/**
 * Reusable delay input for email/call scheduling
 */
export function DelayInput({
  label,
  value,
  onChange,
  unit = "days",
  min = 0,
  max = 30,
  tooltipText,
  suffixText,
}: DelayInputProps) {
  const unitLabel = value !== 1 ? unit : unit.slice(0, -1);

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={`delay-${label.toLowerCase().replace(/\s+/g, "-")}`}>
          {label}
        </Label>
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
      <div className="flex items-center gap-2">
        <Input
          id={`delay-${label.toLowerCase().replace(/\s+/g, "-")}`}
          type="number"
          min={min}
          max={max}
          className="w-24"
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange(newValue === "" ? 0 : Number.parseInt(newValue, 10));
          }}
        />
        <span className="text-muted-foreground text-sm">
          {unitLabel} {suffixText}
        </span>
      </div>
    </div>
  );
}
