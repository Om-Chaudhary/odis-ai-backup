"use client";

import { useState, useMemo, useCallback } from "react";
import { format, setHours, setMinutes } from "date-fns";
import {
  Phone,
  Mail,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Clock,
  Zap,
  Calendar as CalendarIcon,
  Send,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@odis-ai/shared/ui/dialog";
import { Button } from "@odis-ai/shared/ui/button";
import { Checkbox } from "@odis-ai/shared/ui/checkbox";
import { Calendar } from "@odis-ai/shared/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@odis-ai/shared/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";

// Types
interface SelectedCase {
  id: string;
  patientName: string;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
}

interface BulkSendWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCases: SelectedCase[];
  testModeEnabled: boolean;
  onConfirm: (options: BulkSendOptions) => void;
}

export interface BulkSendOptions {
  phoneEnabled: boolean;
  emailEnabled: boolean;
  startNow: boolean;
  scheduledTime: Date | null;
}

type WizardStep = "options" | "review";

// Generate time options for the time picker (every 30 minutes)
function generateTimeOptions() {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 30]) {
      const date = new Date();
      date.setHours(hour, minute, 0, 0);
      const value = format(date, "HH:mm");
      const label = format(date, "h:mm a");
      options.push({ value, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

export function BulkSendWizardModal({
  open,
  onOpenChange,
  selectedCases,
  testModeEnabled,
  onConfirm,
}: BulkSendWizardModalProps) {
  // Wizard state
  const [step, setStep] = useState<WizardStep>("options");

  // Options state
  const [phoneEnabled, setPhoneEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [startNow, setStartNow] = useState(true);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    undefined,
  );
  const [scheduledTime, setScheduledTime] = useState<string>("09:00");

  // Stats for selected cases
  const selectedStats = useMemo(() => {
    return {
      total: selectedCases.length,
      withPhone: selectedCases.filter((c) => c.ownerPhone).length,
      withEmail: selectedCases.filter((c) => c.ownerEmail).length,
    };
  }, [selectedCases]);

  // Combined scheduled datetime
  const scheduledDateTime = useMemo(() => {
    if (startNow || !scheduledDate) return null;
    const timeParts = scheduledTime.split(":");
    const hours = parseInt(timeParts[0] ?? "0", 10);
    const minutes = parseInt(timeParts[1] ?? "0", 10);
    return setMinutes(setHours(scheduledDate, hours), minutes);
  }, [startNow, scheduledDate, scheduledTime]);

  // Handlers
  const handleClose = useCallback(
    (open?: boolean) => {
      // If Radix is trying to open, ignore (we control open state via prop)
      if (open === true) return;

      // Reset state
      setStep("options");
      setPhoneEnabled(true);
      setEmailEnabled(true);
      setStartNow(true);
      setScheduledDate(undefined);
      setScheduledTime("09:00");
      onOpenChange(false);
    },
    [onOpenChange],
  );

  const handleBack = useCallback(() => {
    if (step === "review") {
      setStep("options");
    }
  }, [step]);

  const handleNext = useCallback(() => {
    if (step === "options") {
      if (!phoneEnabled && !emailEnabled) {
        return; // Should be disabled, but safety check
      }
      setStep("review");
    } else if (step === "review") {
      onConfirm({
        phoneEnabled,
        emailEnabled,
        startNow,
        scheduledTime: scheduledDateTime,
      });
      handleClose();
    }
  }, [
    step,
    phoneEnabled,
    emailEnabled,
    startNow,
    scheduledDateTime,
    onConfirm,
    handleClose,
  ]);

  // Step indicators
  const steps: { key: WizardStep; label: string }[] = [
    { key: "options", label: "Options" },
    { key: "review", label: "Review" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  const canProceed =
    (phoneEnabled || emailEnabled) && (startNow || scheduledDate);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-teal-600" />
            Send {selectedCases.length} Discharge
            {selectedCases.length === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            {testModeEnabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                <AlertTriangle className="h-3 w-3" />
                Test Mode Active
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 border-b border-slate-200 pb-4">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  i < currentStepIndex
                    ? "bg-teal-500 text-white"
                    : i === currentStepIndex
                      ? "bg-teal-100 text-teal-700 ring-2 ring-teal-500"
                      : "bg-slate-100 text-slate-400",
                )}
              >
                {i < currentStepIndex ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "ml-2 text-sm font-medium",
                  i === currentStepIndex ? "text-slate-900" : "text-slate-400",
                )}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight className="mx-4 h-4 w-4 text-slate-300" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[320px] py-4">
          {step === "options" && (
            <OptionsStep
              phoneEnabled={phoneEnabled}
              onPhoneEnabledChange={setPhoneEnabled}
              emailEnabled={emailEnabled}
              onEmailEnabledChange={setEmailEnabled}
              startNow={startNow}
              onStartNowChange={setStartNow}
              scheduledDate={scheduledDate}
              onScheduledDateChange={setScheduledDate}
              scheduledTime={scheduledTime}
              onScheduledTimeChange={setScheduledTime}
              selectedStats={selectedStats}
              testModeEnabled={testModeEnabled}
            />
          )}

          {step === "review" && (
            <ReviewStep
              selectedStats={selectedStats}
              phoneEnabled={phoneEnabled}
              emailEnabled={emailEnabled}
              startNow={startNow}
              scheduledDateTime={scheduledDateTime}
              testModeEnabled={testModeEnabled}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-500">
            {step === "options" && <span>Configure delivery options</span>}
            {step === "review" && (
              <span>Ready to send {selectedStats.total} cases</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === "review" && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {step === "review" ? (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Now
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Step 1: Options
function OptionsStep({
  phoneEnabled,
  onPhoneEnabledChange,
  emailEnabled,
  onEmailEnabledChange,
  startNow,
  onStartNowChange,
  scheduledDate,
  onScheduledDateChange,
  scheduledTime,
  onScheduledTimeChange,
  selectedStats,
  testModeEnabled,
}: {
  phoneEnabled: boolean;
  onPhoneEnabledChange: (enabled: boolean) => void;
  emailEnabled: boolean;
  onEmailEnabledChange: (enabled: boolean) => void;
  startNow: boolean;
  onStartNowChange: (startNow: boolean) => void;
  scheduledDate: Date | undefined;
  onScheduledDateChange: (date: Date | undefined) => void;
  scheduledTime: string;
  onScheduledTimeChange: (time: string) => void;
  selectedStats: {
    total: number;
    withPhone: number;
    withEmail: number;
  };
  testModeEnabled: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Delivery Methods */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Delivery Methods
        </h3>
        <div className="space-y-3">
          <label
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors",
              phoneEnabled
                ? "border-teal-300 bg-teal-50/50"
                : "border-slate-200 hover:border-slate-300",
            )}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={phoneEnabled}
                onCheckedChange={(checked) =>
                  onPhoneEnabledChange(checked === true)
                }
                className="h-5 w-5"
              />
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-teal-600" />
                <span className="font-medium">Phone Calls</span>
              </div>
            </div>
            <span className="text-sm text-slate-500">
              {selectedStats.withPhone} of {selectedStats.total} have phone
            </span>
          </label>

          <label
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors",
              emailEnabled
                ? "border-teal-300 bg-teal-50/50"
                : "border-slate-200 hover:border-slate-300",
            )}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={emailEnabled}
                onCheckedChange={(checked) =>
                  onEmailEnabledChange(checked === true)
                }
                className="h-5 w-5"
              />
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-teal-600" />
                <span className="font-medium">Emails</span>
              </div>
            </div>
            <span className="text-sm text-slate-500">
              {selectedStats.withEmail} of {selectedStats.total} have email
            </span>
          </label>
        </div>
      </div>

      {/* Timing */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          When to Send
        </h3>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onStartNowChange(true)}
            className={cn(
              "flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left transition-all",
              startNow
                ? "border-teal-500 bg-teal-50"
                : "border-slate-200 hover:border-slate-300",
            )}
          >
            <Zap
              className={cn(
                "mt-0.5 h-5 w-5",
                startNow ? "text-teal-600" : "text-slate-400",
              )}
            />
            <div>
              <span className="font-medium text-slate-900">Start Now</span>
              <p className="mt-0.5 text-sm text-slate-500">
                Begin sending immediately with automatic staggering
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onStartNowChange(false)}
            className={cn(
              "flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left transition-all",
              !startNow
                ? "border-teal-500 bg-teal-50"
                : "border-slate-200 hover:border-slate-300",
            )}
          >
            <CalendarIcon
              className={cn(
                "mt-0.5 h-5 w-5",
                !startNow ? "text-teal-600" : "text-slate-400",
              )}
            />
            <div className="flex-1">
              <span className="font-medium text-slate-900">
                Schedule for Later
              </span>
              <p className="mt-0.5 text-sm text-slate-500">
                Choose a specific date and time to start
              </p>
            </div>
          </button>

          {/* Date/Time Picker - shown when "Schedule for Later" is selected */}
          {!startNow && (
            <div className="mt-3 ml-8 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? (
                      format(scheduledDate, "MMM d, yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={onScheduledDateChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Select
                value={scheduledTime}
                onValueChange={onScheduledTimeChange}
              >
                <SelectTrigger className="w-[140px]">
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Time" />
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
          )}
        </div>
      </div>

      {/* Test Mode Notice */}
      {testModeEnabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Test Mode Active
              </p>
              <p className="text-xs text-amber-600">
                All calls and emails will be sent to your test contact
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 2: Review
function ReviewStep({
  selectedStats,
  phoneEnabled,
  emailEnabled,
  startNow,
  scheduledDateTime,
  testModeEnabled,
}: {
  selectedStats: {
    total: number;
    withPhone: number;
    withEmail: number;
  };
  phoneEnabled: boolean;
  emailEnabled: boolean;
  startNow: boolean;
  scheduledDateTime: Date | null;
  testModeEnabled: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-4 font-semibold text-slate-900">Summary</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Cases to process</span>
            <span className="font-medium">{selectedStats.total}</span>
          </div>

          {phoneEnabled && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-teal-600" />
                <span className="text-slate-600">Calls to schedule</span>
              </div>
              <span className="font-medium">{selectedStats.withPhone}</span>
            </div>
          )}

          {emailEnabled && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-teal-600" />
                <span className="text-slate-600">Emails to send</span>
              </div>
              <span className="font-medium">{selectedStats.withEmail}</span>
            </div>
          )}

          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-slate-600">Start time</span>
              </div>
              <span className="font-medium">
                {startNow
                  ? "Starting immediately"
                  : scheduledDateTime
                    ? format(scheduledDateTime, "MMM d, yyyy 'at' h:mm a")
                    : "Not scheduled"}
              </span>
            </div>
          </div>

          {testModeEnabled && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-100 p-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800">
                  Test Mode - Sending to test contact
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
        <div className="flex items-start gap-2">
          <Zap className="mt-0.5 h-4 w-4 text-teal-600" />
          <div>
            <p className="text-sm font-medium text-teal-800">
              Automatic Staggering
            </p>
            <p className="text-xs text-teal-600">
              Deliveries will be automatically staggered to respect rate limits
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-slate-500">
        Click &quot;Send Now&quot; to begin processing.
        <br />
        You can track progress in the bottom-right corner.
      </p>
    </div>
  );
}
