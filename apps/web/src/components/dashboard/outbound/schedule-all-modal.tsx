"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calendar,
  Zap,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Clock,
  Users,
} from "lucide-react";
import { cn } from "@odis-ai/utils";
import { api } from "~/trpc/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@odis-ai/ui/dialog";
import { Button } from "@odis-ai/ui/button";
import { Checkbox } from "@odis-ai/ui/checkbox";
import { Progress } from "@odis-ai/ui/progress";

// Types
interface ScheduleableCase {
  id: string;
  patient: {
    name: string;
    species: string | null;
  };
  owner: {
    name: string | null;
    phone: string | null;
    email: string | null;
  };
  status: string;
  hasSummary: boolean;
}

interface ScheduleAllModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases: ScheduleableCase[];
  testModeEnabled: boolean;
  onComplete: () => void;
}

type TimingMode = "scheduled" | "immediate";
type WizardStep = "select" | "options" | "review" | "progress";

interface ScheduleResult {
  caseId: string;
  success: boolean;
  error?: string;
  callScheduled?: boolean;
  emailScheduled?: boolean;
  callScheduledFor?: string;
  emailScheduledFor?: string;
  summaryGenerated?: boolean;
}

export function ScheduleAllModal({
  open,
  onOpenChange,
  cases,
  testModeEnabled,
  onComplete,
}: ScheduleAllModalProps) {
  // Wizard state
  const [step, setStep] = useState<WizardStep>("select");

  // Selection state
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(
    new Set(),
  );

  // Options state
  const [timingMode, setTimingMode] = useState<TimingMode>("scheduled");
  const [phoneEnabled, setPhoneEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [staggerInterval, setStaggerInterval] = useState(60); // seconds

  // Progress state
  const [isScheduling, setIsScheduling] = useState(false);
  const [results, setResults] = useState<ScheduleResult[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);

  // Mutation
  const batchSchedule = api.outbound.batchSchedule.useMutation();

  // Filter to scheduleable cases (not already completed/scheduled)
  const scheduleableCases = useMemo(() => {
    return cases.filter(
      (c) =>
        c.status === "pending_review" ||
        c.status === "ready" ||
        c.status === "failed",
    );
  }, [cases]);

  // Stats for selected cases
  const selectedStats = useMemo(() => {
    const selected = scheduleableCases.filter((c) => selectedCaseIds.has(c.id));
    return {
      total: selected.length,
      withPhone: selected.filter((c) => c.owner.phone).length,
      withEmail: selected.filter((c) => c.owner.email).length,
      needsGeneration: selected.filter((c) => !c.hasSummary).length,
    };
  }, [scheduleableCases, selectedCaseIds]);

  // Handlers
  const handleSelectAll = useCallback(() => {
    if (selectedCaseIds.size === scheduleableCases.length) {
      setSelectedCaseIds(new Set());
    } else {
      setSelectedCaseIds(new Set(scheduleableCases.map((c) => c.id)));
    }
  }, [scheduleableCases, selectedCaseIds.size]);

  const handleToggleCase = useCallback((caseId: string) => {
    setSelectedCaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) {
        next.delete(caseId);
      } else {
        next.add(caseId);
      }
      return next;
    });
  }, []);

  const handleBack = useCallback(() => {
    switch (step) {
      case "options":
        setStep("select");
        break;
      case "review":
        setStep("options");
        break;
      case "progress":
        // Can't go back from progress
        break;
    }
  }, [step]);

  const handleNext = useCallback(() => {
    switch (step) {
      case "select":
        if (selectedCaseIds.size === 0) {
          toast.error("Please select at least one case");
          return;
        }
        setStep("options");
        break;
      case "options":
        if (!phoneEnabled && !emailEnabled) {
          toast.error("Please enable at least one delivery method");
          return;
        }
        setStep("review");
        break;
      case "review":
        void handleStartScheduling();
        break;
    }
  }, [step, selectedCaseIds.size, phoneEnabled, emailEnabled]);

  const handleStartScheduling = useCallback(async () => {
    setStep("progress");
    setIsScheduling(true);
    setProgressPercent(0);
    setResults([]);

    const caseIds = Array.from(selectedCaseIds);

    try {
      // Simulate progress updates (actual mutation is a single call)
      const progressInterval = setInterval(() => {
        setProgressPercent((prev) => Math.min(prev + 5, 90));
      }, 500);

      const result = await batchSchedule.mutateAsync({
        caseIds,
        phoneEnabled,
        emailEnabled,
        timingMode,
        staggerIntervalSeconds: staggerInterval,
      });

      clearInterval(progressInterval);
      setProgressPercent(100);
      setResults(result.results);
      setIsScheduling(false);

      if (result.totalSuccess === result.totalProcessed) {
        toast.success(`Successfully scheduled ${result.totalSuccess} cases`);
      } else if (result.totalSuccess > 0) {
        toast.warning(
          `Scheduled ${result.totalSuccess} of ${result.totalProcessed} cases`,
        );
      } else {
        toast.error("Failed to schedule any cases");
      }
    } catch (error) {
      setIsScheduling(false);
      setProgressPercent(0);
      toast.error("Scheduling failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [
    selectedCaseIds,
    phoneEnabled,
    emailEnabled,
    timingMode,
    staggerInterval,
    batchSchedule,
  ]);

  const handleClose = useCallback(() => {
    if (isScheduling) {
      toast.error("Please wait for scheduling to complete");
      return;
    }

    // Reset state
    setStep("select");
    setSelectedCaseIds(new Set());
    setTimingMode("scheduled");
    setPhoneEnabled(true);
    setEmailEnabled(true);
    setResults([]);
    setProgressPercent(0);

    onOpenChange(false);

    if (results.length > 0) {
      onComplete();
    }
  }, [isScheduling, results.length, onOpenChange, onComplete]);

  // Step indicators
  const steps: { key: WizardStep; label: string }[] = [
    { key: "select", label: "Select Cases" },
    { key: "options", label: "Options" },
    { key: "review", label: "Review" },
    { key: "progress", label: "Progress" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            Schedule All Discharges
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
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
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
                <ChevronRight className="mx-2 h-4 w-4 text-slate-300" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="max-h-[50vh] min-h-[300px] overflow-y-auto py-4">
          {step === "select" && (
            <CaseSelectionStep
              cases={scheduleableCases}
              selectedCaseIds={selectedCaseIds}
              onToggleCase={handleToggleCase}
              onSelectAll={handleSelectAll}
            />
          )}

          {step === "options" && (
            <OptionsStep
              timingMode={timingMode}
              onTimingModeChange={setTimingMode}
              phoneEnabled={phoneEnabled}
              onPhoneEnabledChange={setPhoneEnabled}
              emailEnabled={emailEnabled}
              onEmailEnabledChange={setEmailEnabled}
              staggerInterval={staggerInterval}
              onStaggerIntervalChange={setStaggerInterval}
              selectedStats={selectedStats}
              testModeEnabled={testModeEnabled}
            />
          )}

          {step === "review" && (
            <ReviewStep
              selectedStats={selectedStats}
              timingMode={timingMode}
              phoneEnabled={phoneEnabled}
              emailEnabled={emailEnabled}
              staggerInterval={staggerInterval}
              testModeEnabled={testModeEnabled}
            />
          )}

          {step === "progress" && (
            <ProgressStep
              isScheduling={isScheduling}
              progressPercent={progressPercent}
              results={results}
              cases={scheduleableCases}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-500">
            {step === "select" && (
              <span>
                {selectedCaseIds.size} of {scheduleableCases.length} cases
                selected
              </span>
            )}
            {step === "options" && <span>Configure scheduling options</span>}
            {step === "review" && (
              <span>Ready to schedule {selectedCaseIds.size} cases</span>
            )}
            {step === "progress" && (
              <span>
                {isScheduling
                  ? "Scheduling in progress..."
                  : `${results.filter((r) => r.success).length} of ${results.length} succeeded`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step !== "select" && step !== "progress" && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}

            {step === "progress" ? (
              <Button
                onClick={handleClose}
                disabled={isScheduling}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isScheduling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  "Done"
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={step === "select" && selectedCaseIds.size === 0}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {step === "review" ? (
                  <>
                    Schedule All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Step 1: Case Selection
function CaseSelectionStep({
  cases,
  selectedCaseIds,
  onToggleCase,
  onSelectAll,
}: {
  cases: ScheduleableCase[];
  selectedCaseIds: Set<string>;
  onToggleCase: (id: string) => void;
  onSelectAll: () => void;
}) {
  const allSelected = selectedCaseIds.size === cases.length && cases.length > 0;

  return (
    <div className="space-y-4">
      {/* Select All Header */}
      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            className="h-5 w-5"
          />
          <span className="font-medium text-slate-700">
            Select All ({cases.length} cases)
          </span>
        </label>
      </div>

      {/* Case List */}
      <div className="space-y-2">
        {cases.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            No cases available for scheduling
          </div>
        ) : (
          cases.map((caseItem) => (
            <div
              key={caseItem.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3 transition-colors",
                selectedCaseIds.has(caseItem.id)
                  ? "border-teal-300 bg-teal-50/50"
                  : "border-slate-200 hover:border-slate-300",
              )}
            >
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <Checkbox
                  checked={selectedCaseIds.has(caseItem.id)}
                  onCheckedChange={() => onToggleCase(caseItem.id)}
                  className="h-5 w-5"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900">
                    {caseItem.patient.name}
                    {caseItem.patient.species && (
                      <span className="ml-2 text-sm font-normal text-slate-500">
                        ({caseItem.patient.species})
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    {caseItem.owner.name ?? "Unknown owner"}
                  </div>
                </div>
              </label>

              {/* Contact indicators */}
              <div className="flex items-center gap-2">
                {caseItem.owner.phone ? (
                  <Phone className="h-4 w-4 text-teal-500" />
                ) : (
                  <Phone className="h-4 w-4 text-slate-300" />
                )}
                {caseItem.owner.email ? (
                  <Mail className="h-4 w-4 text-teal-500" />
                ) : (
                  <Mail className="h-4 w-4 text-slate-300" />
                )}
                {!caseItem.hasSummary && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Needs generation
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Step 2: Options
function OptionsStep({
  timingMode,
  onTimingModeChange,
  phoneEnabled,
  onPhoneEnabledChange,
  emailEnabled,
  onEmailEnabledChange,
  staggerInterval,
  onStaggerIntervalChange,
  selectedStats,
  testModeEnabled,
}: {
  timingMode: TimingMode;
  onTimingModeChange: (mode: TimingMode) => void;
  phoneEnabled: boolean;
  onPhoneEnabledChange: (enabled: boolean) => void;
  emailEnabled: boolean;
  onEmailEnabledChange: (enabled: boolean) => void;
  staggerInterval: number;
  onStaggerIntervalChange: (interval: number) => void;
  selectedStats: {
    total: number;
    withPhone: number;
    withEmail: number;
    needsGeneration: number;
  };
  testModeEnabled: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Timing Mode */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Timing Mode
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onTimingModeChange("scheduled")}
            className={cn(
              "flex flex-col items-start rounded-lg border-2 p-4 text-left transition-all",
              timingMode === "scheduled"
                ? "border-teal-500 bg-teal-50"
                : "border-slate-200 hover:border-slate-300",
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-600" />
              <span className="font-medium">Scheduled</span>
            </div>
            <p className="text-sm text-slate-600">
              Email 1 day after, call 2 days after (uses your settings)
            </p>
          </button>

          <button
            type="button"
            onClick={() => onTimingModeChange("immediate")}
            className={cn(
              "flex flex-col items-start rounded-lg border-2 p-4 text-left transition-all",
              timingMode === "immediate"
                ? "border-teal-500 bg-teal-50"
                : "border-slate-200 hover:border-slate-300",
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <span className="font-medium">Immediate</span>
            </div>
            <p className="text-sm text-slate-600">
              Stagger all emails/calls starting now
            </p>
          </button>
        </div>
      </div>

      {/* Stagger Interval (only for immediate mode) */}
      {timingMode === "immediate" && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Stagger Interval
          </h3>
          <div className="flex items-center gap-3">
            <select
              value={staggerInterval}
              onChange={(e) => onStaggerIntervalChange(Number(e.target.value))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={120}>2 minutes</option>
              <option value={180}>3 minutes</option>
              <option value={300}>5 minutes</option>
            </select>
            <span className="text-sm text-slate-500">between each case</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Total time: ~
            {Math.ceil((selectedStats.total * staggerInterval) / 60)} minutes
            for {selectedStats.total} cases
          </p>
        </div>
      )}

      {/* Delivery Methods */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Delivery Methods
        </h3>
        <div className="space-y-3">
          <label
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-lg border p-3",
              phoneEnabled
                ? "border-teal-300 bg-teal-50/50"
                : "border-slate-200",
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
              "flex cursor-pointer items-center justify-between rounded-lg border p-3",
              emailEnabled
                ? "border-teal-300 bg-teal-50/50"
                : "border-slate-200",
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

      {/* Generation Notice */}
      {selectedStats.needsGeneration > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {selectedStats.needsGeneration} case(s) need discharge summary
                generation
              </p>
              <p className="text-xs text-amber-600">
                Summaries will be generated in parallel before scheduling
              </p>
            </div>
          </div>
        </div>
      )}

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

// Step 3: Review
function ReviewStep({
  selectedStats,
  timingMode,
  phoneEnabled,
  emailEnabled,
  staggerInterval,
  testModeEnabled,
}: {
  selectedStats: {
    total: number;
    withPhone: number;
    withEmail: number;
    needsGeneration: number;
  };
  timingMode: TimingMode;
  phoneEnabled: boolean;
  emailEnabled: boolean;
  staggerInterval: number;
  testModeEnabled: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-4 font-semibold text-slate-900">Summary</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Cases to schedule</span>
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
                <span className="text-slate-600">Emails to schedule</span>
              </div>
              <span className="font-medium">{selectedStats.withEmail}</span>
            </div>
          )}

          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-slate-600">Timing</span>
              </div>
              <span className="font-medium">
                {timingMode === "scheduled"
                  ? "Email: 1 day, Call: 2 days"
                  : `Staggered (${staggerInterval}s apart)`}
              </span>
            </div>
          </div>

          {selectedStats.needsGeneration > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-amber-500" />
                <span className="text-slate-600">Summaries to generate</span>
              </div>
              <span className="font-medium text-amber-600">
                {selectedStats.needsGeneration}
              </span>
            </div>
          )}

          {testModeEnabled && (
            <div className="flex items-center justify-between rounded-lg bg-amber-100 p-2">
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

      <p className="text-center text-sm text-slate-500">
        Click &quot;Schedule All&quot; to begin scheduling these cases.
        <br />
        This action cannot be undone.
      </p>
    </div>
  );
}

// Step 4: Progress
function ProgressStep({
  isScheduling,
  progressPercent,
  results,
  cases,
}: {
  isScheduling: boolean;
  progressPercent: number;
  results: ScheduleResult[];
  cases: ScheduleableCase[];
}) {
  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  const getCaseInfo = (caseId: string) => {
    return cases.find((c) => c.id === caseId);
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">
            {isScheduling ? "Scheduling..." : "Complete"}
          </span>
          <span className="text-slate-500">{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Summary Stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-700">
                {successCount}
              </span>
            </div>
            <p className="text-sm text-green-600">Successful</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-red-700">
                {failedCount}
              </span>
            </div>
            <p className="text-sm text-red-600">Failed</p>
          </div>
        </div>
      )}

      {/* Results List */}
      {results.length > 0 && (
        <div className="max-h-[200px] space-y-2 overflow-y-auto">
          {results.map((result) => {
            const caseInfo = getCaseInfo(result.caseId);
            return (
              <div
                key={result.caseId}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-2",
                  result.success
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50",
                )}
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">
                    {caseInfo?.patient.name ?? "Unknown"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {result.success ? (
                    <>
                      {result.emailScheduled && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Mail className="h-3 w-3" />
                          {result.emailScheduledFor
                            ? format(
                                new Date(result.emailScheduledFor),
                                "MMM d, h:mm a",
                              )
                            : "Scheduled"}
                        </span>
                      )}
                      {result.callScheduled && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Phone className="h-3 w-3" />
                          {result.callScheduledFor
                            ? format(
                                new Date(result.callScheduledFor),
                                "MMM d, h:mm a",
                              )
                            : "Scheduled"}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-red-600">{result.error}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading State */}
      {isScheduling && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-2 text-sm text-slate-500">
            Generating summaries and scheduling...
          </p>
        </div>
      )}
    </div>
  );
}
