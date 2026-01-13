"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOptionalClinic } from "@odis-ai/shared/ui/clinic-context";
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
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@odis-ai/shared/util";

import { Button } from "@odis-ai/shared/ui/button";
import { Checkbox } from "@odis-ai/shared/ui/checkbox";
import { Calendar } from "@odis-ai/shared/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
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

import { api } from "~/trpc/client";

// Types
interface SelectedCase {
  id: string;
  patientName: string;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
}

type WizardStep = "options" | "review" | "processing" | "complete";

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

/**
 * Bulk Schedule Client Component
 *
 * Full-page wizard for scheduling multiple discharges.
 * More reliable than modal approach, better for multi-step workflows.
 */
export function BulkScheduleClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clinicContext = useOptionalClinic();
  const clinicSlug = clinicContext?.clinicSlug ?? null;

  // Build clinic-scoped URL
  const outboundUrl = clinicSlug
    ? `/dashboard/${clinicSlug}/outbound`
    : "/dashboard/outbound";

  // Get case IDs from URL
  const caseIdsParam = searchParams.get("cases");
  const caseIds = useMemo(() => {
    if (!caseIdsParam) return [];
    return caseIdsParam.split(",").filter(Boolean);
  }, [caseIdsParam]);

  // Fetch case details
  const { data: casesData, isLoading: isCasesLoading } =
    api.outbound.getCasesByIds.useQuery(
      { caseIds },
      { enabled: caseIds.length > 0 },
    );

  // Fetch settings for test mode
  const { data: settingsData } = api.cases.getDischargeSettings.useQuery();

  // Batch schedule mutation
  const batchSchedule = api.outbound.batchSchedule.useMutation();

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

  // Processing state
  const [processedCount, setProcessedCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  // Selected cases with contact info
  const selectedCases: SelectedCase[] = useMemo(() => {
    if (!casesData?.cases) return [];
    return casesData.cases.map((c) => ({
      id: c.id,
      patientName: c.patient.name,
      ownerName: c.owner.name,
      ownerPhone: c.owner.phone,
      ownerEmail: c.owner.email,
    }));
  }, [casesData?.cases]);

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

  // Redirect if no cases
  useEffect(() => {
    if (!isCasesLoading && caseIds.length === 0) {
      toast.error("No cases selected");
      router.push(outboundUrl);
    }
  }, [isCasesLoading, caseIds.length, router, outboundUrl]);

  // Handlers
  const handleBack = useCallback(() => {
    if (step === "review") {
      setStep("options");
    } else if (step === "options") {
      router.push(outboundUrl);
    }
  }, [step, router, outboundUrl]);

  const handleNext = useCallback(async () => {
    if (step === "options") {
      if (!phoneEnabled && !emailEnabled) {
        toast.error("Please select at least one delivery method");
        return;
      }
      setStep("review");
    } else if (step === "review") {
      // Start processing
      setStep("processing");
      setProcessedCount(0);
      setSuccessCount(0);
      setFailedCount(0);

      try {
        const scheduleBaseTime = startNow
          ? new Date(Date.now() + 60 * 1000).toISOString()
          : scheduledDateTime?.toISOString();

        const result = await batchSchedule.mutateAsync({
          caseIds,
          phoneEnabled,
          emailEnabled,
          timingMode: startNow ? "immediate" : "scheduled",
          staggerIntervalSeconds: 60,
          scheduleBaseTime,
        });

        // Update counts from results
        const successes = result.results.filter((r) => r.success).length;
        const failures = result.results.filter((r) => !r.success).length;

        setProcessedCount(result.results.length);
        setSuccessCount(successes);
        setFailedCount(failures);
        setStep("complete");

        if (failures === 0) {
          toast.success(`Successfully scheduled ${successes} discharges`);
        } else {
          toast.warning(`Scheduled ${successes}, ${failures} failed`);
        }
      } catch (error) {
        setStep("complete");
        setFailedCount(caseIds.length);
        toast.error("Failed to schedule discharges", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }, [
    step,
    phoneEnabled,
    emailEnabled,
    startNow,
    scheduledDateTime,
    caseIds,
    batchSchedule,
  ]);

  const handleFinish = useCallback(() => {
    router.push(outboundUrl);
  }, [router, outboundUrl]);

  // Loading state
  if (isCasesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm text-slate-500">Loading cases...</p>
        </div>
      </div>
    );
  }

  // No cases state
  if (selectedCases.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto mb-2 h-12 w-12 text-amber-500" />
            <CardTitle>No Cases Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4 text-sm">
              The selected cases could not be found or are no longer available.
            </p>
            <Button onClick={() => router.push(outboundUrl)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Outbound
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canProceed =
    (phoneEnabled || emailEnabled) && (startNow || scheduledDate);

  // Step indicators
  const steps: { key: WizardStep; label: string }[] = [
    { key: "options", label: "Options" },
    { key: "review", label: "Review" },
    { key: "processing", label: "Sending" },
    { key: "complete", label: "Complete" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={step === "processing"}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
            <Send className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Schedule {selectedCases.length} Discharge
              {selectedCases.length === 1 ? "" : "s"}
            </h1>
            {settingsData?.testModeEnabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                <AlertTriangle className="h-3 w-3" />
                Test Mode Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-center gap-4">
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
                "ml-2 hidden text-sm font-medium sm:inline",
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
      <Card>
        <CardContent className="p-6">
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
              testModeEnabled={settingsData?.testModeEnabled ?? false}
            />
          )}

          {step === "review" && (
            <ReviewStep
              selectedStats={selectedStats}
              phoneEnabled={phoneEnabled}
              emailEnabled={emailEnabled}
              startNow={startNow}
              scheduledDateTime={scheduledDateTime}
              testModeEnabled={settingsData?.testModeEnabled ?? false}
              selectedCases={selectedCases}
            />
          )}

          {step === "processing" && (
            <ProcessingStep
              total={selectedStats.total}
              processed={processedCount}
            />
          )}

          {step === "complete" && (
            <CompleteStep
              total={selectedStats.total}
              successCount={successCount}
              failedCount={failedCount}
            />
          )}
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {step === "options" && <span>Configure delivery options</span>}
          {step === "review" && (
            <span>Ready to send {selectedStats.total} cases</span>
          )}
          {step === "processing" && <span>Please wait...</span>}
          {step === "complete" && <span>All done!</span>}
        </div>

        <div className="flex items-center gap-2">
          {step === "review" && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          )}

          {step !== "processing" && step !== "complete" && (
            <Button
              onClick={handleNext}
              disabled={!canProceed || batchSchedule.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {batchSchedule.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : step === "review" ? (
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
          )}

          {step === "complete" && (
            <Button
              onClick={handleFinish}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
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
              "flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors",
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
                <Phone className="h-5 w-5 text-teal-600" />
                <span className="font-medium">Phone Calls</span>
              </div>
            </div>
            <span className="text-sm text-slate-500">
              {selectedStats.withPhone} of {selectedStats.total} have phone
            </span>
          </label>

          <label
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors",
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
                <Mail className="h-5 w-5 text-teal-600" />
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

          {/* Date/Time Picker */}
          {!startNow && (
            <div className="mt-3 ml-8 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
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
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Test Mode Active</p>
              <p className="text-sm text-amber-600">
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
  selectedCases,
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
  selectedCases: SelectedCase[];
}) {
  return (
    <div className="space-y-6">
      {/* Summary */}
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

      {/* Cases List */}
      <div>
        <h3 className="mb-3 font-semibold text-slate-900">
          Cases ({selectedCases.length})
        </h3>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
          {selectedCases.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
            >
              <div>
                <span className="font-medium text-slate-800">
                  {c.patientName}
                </span>
                <span className="ml-2 text-sm text-slate-500">
                  {c.ownerName ?? "Unknown owner"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {c.ownerPhone && phoneEnabled && (
                  <Phone className="h-4 w-4 text-teal-500" />
                )}
                {c.ownerEmail && emailEnabled && (
                  <Mail className="h-4 w-4 text-teal-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
        <div className="flex items-start gap-2">
          <Zap className="mt-0.5 h-5 w-5 text-teal-600" />
          <div>
            <p className="font-medium text-teal-800">Automatic Staggering</p>
            <p className="text-sm text-teal-600">
              Deliveries will be automatically staggered to respect rate limits
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Processing
function ProcessingStep({
  total,
  processed,
}: {
  total: number;
  processed: number;
}) {
  const progressPercent = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center py-8">
      <Loader2 className="mb-4 h-12 w-12 animate-spin text-teal-600" />
      <h3 className="mb-2 text-lg font-semibold text-slate-900">
        Scheduling Discharges...
      </h3>
      <p className="mb-4 text-slate-500">
        {processed} of {total} processed
      </p>
      <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-teal-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="mt-4 text-sm text-slate-400">
        Please don&apos;t close this page
      </p>
    </div>
  );
}

// Step 4: Complete
function CompleteStep({
  total: _total,
  successCount,
  failedCount,
}: {
  total: number;
  successCount: number;
  failedCount: number;
}) {
  const allSuccess = failedCount === 0;

  return (
    <div className="flex flex-col items-center py-8">
      {allSuccess ? (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
      ) : (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
      )}

      <h3 className="mb-2 text-lg font-semibold text-slate-900">
        {allSuccess ? "All Done!" : "Completed with Issues"}
      </h3>

      <div className="mb-4 flex gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {successCount}
          </div>
          <div className="text-sm text-slate-500">Scheduled</div>
        </div>
        {failedCount > 0 && (
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <div className="text-sm text-slate-500">Failed</div>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500">
        {allSuccess
          ? "All discharges have been scheduled successfully."
          : "Some discharges could not be scheduled. Please try again for failed cases."}
      </p>
    </div>
  );
}
