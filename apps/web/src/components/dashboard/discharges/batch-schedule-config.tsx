"use client";

import { Label } from "@odis-ai/ui/label";
import { Button } from "@odis-ai/ui/button";
import { Input } from "@odis-ai/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/ui/select";
import { Separator } from "@odis-ai/ui/separator";
import {
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Clock,
  RotateCcw,
} from "lucide-react";
import { format, addDays, setHours, setMinutes, setSeconds } from "date-fns";
import type { DischargeSettings } from "~/types/dashboard";

interface BatchScheduleConfigProps {
  emailScheduleTime: Date | null;
  callScheduleTime: Date | null;
  onEmailTimeChange: (date: Date | null) => void;
  onCallTimeChange: (date: Date | null) => void;
  settings?: DischargeSettings;
}

// Generate time options from 6 AM to 9 PM in 30-minute intervals
function generateTimeOptions() {
  const options = [];
  for (let hour = 6; hour <= 21; hour++) {
    for (const minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const label = new Date(`2000-01-01T${time}:00`).toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        },
      );
      options.push({ value: time, label });
    }
  }
  return options;
}

const timeOptions = generateTimeOptions();

export function BatchScheduleConfig({
  emailScheduleTime,
  callScheduleTime,
  onEmailTimeChange,
  onCallTimeChange,
  settings,
}: BatchScheduleConfigProps) {
  // Calculate default schedule times based on settings
  const calculateDefaultScheduleTimes = () => {
    const now = new Date();
    const emailDelayDays = settings?.emailDelayDays ?? 1;
    const callDelayDays = settings?.callDelayDays ?? 2;
    const emailStartTime = settings?.preferredEmailStartTime ?? "09:00";
    const callStartTime = settings?.preferredCallStartTime ?? "14:00";

    // Parse times
    const [emailHour, emailMinute] = emailStartTime.split(":").map(Number);
    const [callHour, callMinute] = callStartTime.split(":").map(Number);

    // Email: emailDelayDays from now at preferred start time
    let emailTime = addDays(now, emailDelayDays);
    emailTime = setHours(emailTime, emailHour ?? 9);
    emailTime = setMinutes(emailTime, emailMinute ?? 0);
    emailTime = setSeconds(emailTime, 0);

    // Call: callDelayDays after email at preferred start time
    let callTime = addDays(emailTime, callDelayDays);
    callTime = setHours(callTime, callHour ?? 14);
    callTime = setMinutes(callTime, callMinute ?? 0);
    callTime = setSeconds(callTime, 0);

    return { emailTime, callTime };
  };

  const handleResetToDefaults = () => {
    const { emailTime, callTime } = calculateDefaultScheduleTimes();
    onEmailTimeChange(emailTime);
    onCallTimeChange(callTime);
  };

  // Update date while preserving time
  const updateEmailDate = (dateString: string) => {
    if (!dateString) return;
    const currentTime = emailScheduleTime ?? new Date();
    const newDate = new Date(dateString);
    newDate.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
    onEmailTimeChange(newDate);
  };

  const updateCallDate = (dateString: string) => {
    if (!dateString) return;
    const currentTime = callScheduleTime ?? new Date();
    const newDate = new Date(dateString);
    newDate.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
    onCallTimeChange(newDate);
  };

  // Update time while preserving date
  const updateEmailTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const currentDate = emailScheduleTime ?? addDays(new Date(), 1);
    const newDate = new Date(currentDate);
    newDate.setHours(hours ?? 9, minutes ?? 0, 0, 0);
    onEmailTimeChange(newDate);
  };

  const updateCallTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const currentDate = callScheduleTime ?? addDays(new Date(), 3);
    const newDate = new Date(currentDate);
    newDate.setHours(hours ?? 14, minutes ?? 0, 0, 0);
    onCallTimeChange(newDate);
  };

  // Get current time strings for select values
  const emailTimeValue = emailScheduleTime
    ? `${emailScheduleTime.getHours().toString().padStart(2, "0")}:${emailScheduleTime.getMinutes().toString().padStart(2, "0")}`
    : "09:00";

  const callTimeValue = callScheduleTime
    ? `${callScheduleTime.getHours().toString().padStart(2, "0")}:${callScheduleTime.getMinutes().toString().padStart(2, "0")}`
    : "14:00";

  // Format date for input
  const emailDateValue = emailScheduleTime
    ? format(emailScheduleTime, "yyyy-MM-dd")
    : "";

  const callDateValue = callScheduleTime
    ? format(callScheduleTime, "yyyy-MM-dd")
    : "";

  // Get minimum date (today)
  const minDate = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-4">
      {/* Email Schedule */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-blue-500" />
          <Label className="text-sm font-medium">Email Schedule</Label>
        </div>
        <div className="grid gap-2">
          <div className="relative">
            <CalendarIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="date"
              className="pl-10"
              value={emailDateValue}
              min={minDate}
              onChange={(e) => updateEmailDate(e.target.value)}
            />
          </div>
          <Select value={emailTimeValue} onValueChange={updateEmailTime}>
            <SelectTrigger>
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {emailScheduleTime && (
            <p className="text-muted-foreground text-xs">
              {format(emailScheduleTime, "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Call Schedule */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-green-500" />
          <Label className="text-sm font-medium">Call Schedule</Label>
        </div>
        <div className="grid gap-2">
          <div className="relative">
            <CalendarIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="date"
              className="pl-10"
              value={callDateValue}
              min={minDate}
              onChange={(e) => updateCallDate(e.target.value)}
            />
          </div>
          <Select value={callTimeValue} onValueChange={updateCallTime}>
            <SelectTrigger>
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {callScheduleTime && (
            <p className="text-muted-foreground text-xs">
              {format(callScheduleTime, "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Reset to Defaults */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleResetToDefaults}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset to Default Schedule
      </Button>

      {/* Schedule Preview */}
      {settings && (
        <p className="text-muted-foreground text-center text-xs">
          Default: Emails {settings.emailDelayDays ?? 1} day
          {(settings.emailDelayDays ?? 1) !== 1 ? "s" : ""} after, Calls{" "}
          {settings.callDelayDays ?? 2} day
          {(settings.callDelayDays ?? 2) !== 1 ? "s" : ""} after email
        </p>
      )}
    </div>
  );
}
