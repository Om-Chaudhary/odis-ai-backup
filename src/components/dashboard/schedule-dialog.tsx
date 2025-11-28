"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Calendar, Clock } from "lucide-react";

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (scheduledAt: Date | null) => void;
  type: "call" | "email";
  defaultScheduledAt?: Date;
}

export function ScheduleDialog({
  open,
  onOpenChange,
  onConfirm,
  type,
  defaultScheduledAt,
}: ScheduleDialogProps) {
  // Default to 2 minutes from now for calls, immediate for emails
  const defaultDate = defaultScheduledAt ?? new Date();
  if (type === "call") {
    defaultDate.setMinutes(defaultDate.getMinutes() + 2);
  }

  // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [scheduledDateTime, setScheduledDateTime] = useState(
    formatForInput(defaultDate),
  );
  const [useCustomTime, setUseCustomTime] = useState(false);

  const handleConfirm = () => {
    if (useCustomTime) {
      const selectedDate = new Date(scheduledDateTime);
      // Validate that the date is in the future
      if (selectedDate <= new Date()) {
        // If in the past, use default (2 minutes from now)
        onConfirm(null);
      } else {
        onConfirm(selectedDate);
      }
    } else {
      // Use default scheduling (null means use service defaults)
      onConfirm(null);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    setUseCustomTime(false);
    setScheduledDateTime(formatForInput(defaultDate));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Schedule {type === "call" ? "Call" : "Email"}
          </DialogTitle>
          <DialogDescription>
            {type === "call"
              ? "Choose when to schedule the discharge call. Leave as default to schedule 2 minutes from now. Times are validated on the server to ensure accuracy."
              : "Choose when to send the discharge email. Leave as default to send immediately. Times are validated on the server to ensure accuracy."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="use-custom-time"
              checked={useCustomTime}
              onChange={(e) => setUseCustomTime(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label
              htmlFor="use-custom-time"
              className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Use custom schedule time
            </Label>
          </div>

          {useCustomTime && (
            <div className="grid gap-2">
              <Label htmlFor="scheduled-datetime" className="text-sm">
                Scheduled Date & Time
              </Label>
              <div className="relative">
                <Calendar className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="scheduled-datetime"
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="pl-10"
                  min={formatForInput(new Date())}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {new Date(scheduledDateTime) <= new Date()
                  ? "⚠️ Selected time is in the past. Default scheduling will be used. Server will validate the final time."
                  : `Will be scheduled for ${new Date(scheduledDateTime).toLocaleString()} (server time will be used for validation)`}
              </p>
            </div>
          )}

          {!useCustomTime && (
            <div className="bg-muted/50 flex items-center gap-2 rounded-md p-3 text-sm">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground">
                {type === "call"
                  ? "Default: 2 minutes from now"
                  : "Default: Send immediately"}
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Schedule {type === "call" ? "Call" : "Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
