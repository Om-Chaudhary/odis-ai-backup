"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@odis-ai/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@odis-ai/ui/card";
import { Badge } from "@odis-ai/ui/badge";
import { Checkbox } from "@odis-ai/ui/checkbox";
import { Alert, AlertDescription } from "@odis-ai/ui/alert";
import { ScrollArea } from "@odis-ai/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@odis-ai/ui/tabs";
import { Progress } from "@odis-ai/ui/progress";
import { Separator } from "@odis-ai/ui/separator";
import { Input } from "@odis-ai/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/ui/select";
import { Switch } from "@odis-ai/ui/switch";
import { Label } from "@odis-ai/ui/label";
import {
  ArrowLeft,
  ArrowRight,
  TestTube,
  Send,
  Mail,
  Phone,
  Users,
  CheckCircle,
  Loader2,
  FileText,
  Stethoscope,
  Calendar,
  Clock,
  Search,
  RotateCcw,
  CheckCheck,
  AlertTriangle,
  Sparkles,
  Timer,
  XCircle,
  SkipForward,
  AlertOctagon,
  CircleDashed,
} from "lucide-react";
import { api } from "~/trpc/client";
import { toast } from "sonner";
import {
  format,
  addDays,
  subDays,
  setHours,
  setMinutes,
  setSeconds,
  startOfDay,
  endOfDay,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { BatchProgressMonitor } from "./batch-progress-monitor";
import type { BatchEligibleCase } from "@odis-ai/types";
import { cn } from "@odis-ai/utils";

type DateFilter = "today" | "yesterday" | "day-2" | "day-3" | "day-4";

// Processing status for each case
type ProcessingStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "skipped";

interface ProcessingResult {
  id: string;
  patientName: string;
  status: ProcessingStatus;
  error?: string;
}

// Concurrency control - process 3 at a time to avoid overwhelming Vercel
const BATCH_CONCURRENCY = 3;

// Generate time options
function generateTimeOptions() {
  const options = [];
  for (let hour = 6; hour <= 21; hour++) {
    for (const minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const label = new Date(`2000-01-01T${time}:00`).toLocaleTimeString(
        "en-US",
        { hour: "numeric", minute: "2-digit", hour12: true },
      );
      options.push({ value: time, label });
    }
  }
  return options;
}

const timeOptions = generateTimeOptions();

type Step = "select" | "schedule" | "review" | "processing" | "complete";

export function BatchDischargePageClient() {
  const router = useRouter();

  // State
  const [currentStep, setCurrentStep] = useState<Step>("select");
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [emailScheduleTime, setEmailScheduleTime] = useState<Date | null>(null);
  const [callScheduleTime, setCallScheduleTime] = useState<Date | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [searchQuery, setSearchQuery] = useState("");

  // Communication type toggles
  const [emailsEnabled, setEmailsEnabled] = useState(true);
  const [callsEnabled, setCallsEnabled] = useState(true);

  // Schedule mode: "datetime" for specific date/time, "minutes" for minutes from now
  type ScheduleMode = "datetime" | "minutes";
  const [emailScheduleMode, setEmailScheduleMode] =
    useState<ScheduleMode>("minutes");
  const [callScheduleMode, setCallScheduleMode] =
    useState<ScheduleMode>("minutes");

  // Minutes from now values
  const [emailMinutesFromNow, setEmailMinutesFromNow] = useState<number>(5);
  const [callMinutesFromNow, setCallMinutesFromNow] = useState<number>(10);

  // Skipped cases (user marked to skip - emergencies, euthanasias, etc.)
  const [skippedCases, setSkippedCases] = useState<Set<string>>(new Set());

  // Processing results for real-time progress
  const [processingResults, setProcessingResults] = useState<
    Map<string, ProcessingStatus>
  >(new Map());
  const [processingErrors, setProcessingErrors] = useState<Map<string, string>>(
    new Map(),
  );
  const [finalResults, setFinalResults] = useState<ProcessingResult[]>([]);

  // Queries
  const {
    data: eligibleCasesData,
    isLoading: isLoadingCases,
    refetch: refetchCases,
  } = api.cases.getEligibleCasesForBatch.useQuery();

  const { data: settingsData } = api.cases.getDischargeSettings.useQuery();

  // Transform eligible cases to the expected type
  const eligibleCases: BatchEligibleCase[] = useMemo(() => {
    return (eligibleCasesData ?? []).map((c) => ({
      id: c.id,
      patientId: c.patientId,
      patientName: c.patientName,
      ownerName: c.ownerName,
      ownerEmail: c.ownerEmail,
      ownerPhone: c.ownerPhone,
      source: c.source,
      hasEmail: c.hasEmail,
      hasPhone: c.hasPhone,
      hasDischargeSummary: c.hasDischargeSummary,
      hasIdexxNotes: c.hasIdexxNotes,
      hasTranscription: c.hasTranscription,
      hasSoapNotes: c.hasSoapNotes,
      createdAt: c.createdAt,
      scheduledAt: c.scheduledAt,
      emailSent: c.emailSent ?? false,
      callSent: c.callSent ?? false,
    }));
  }, [eligibleCasesData]);

  // Filter cases by source, date, communication type, and search
  const filteredCases = useMemo(() => {
    let cases = eligibleCases;

    // Filter by date - use scheduledAt with fallback to createdAt (same as main dashboard)
    const now = new Date();
    const filterDates: Record<DateFilter, { start: Date; end: Date }> = {
      today: { start: startOfDay(now), end: endOfDay(now) },
      yesterday: {
        start: startOfDay(subDays(now, 1)),
        end: endOfDay(subDays(now, 1)),
      },
      "day-2": {
        start: startOfDay(subDays(now, 2)),
        end: endOfDay(subDays(now, 2)),
      },
      "day-3": {
        start: startOfDay(subDays(now, 3)),
        end: endOfDay(subDays(now, 3)),
      },
      "day-4": {
        start: startOfDay(subDays(now, 4)),
        end: endOfDay(subDays(now, 4)),
      },
    };

    const dateRange = filterDates[dateFilter];
    cases = cases.filter((c) => {
      // Use scheduledAt if available, otherwise fall back to createdAt
      const dateStr = c.scheduledAt ?? c.createdAt;
      if (!dateStr) return false;
      const caseDate = parseISO(dateStr);
      return isWithinInterval(caseDate, dateRange);
    });

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cases = cases.filter(
        (c) =>
          c.patientName.toLowerCase().includes(query) ||
          (c.ownerName?.toLowerCase().includes(query) ?? false),
      );
    }

    return cases;
  }, [eligibleCases, dateFilter, searchQuery]);

  // Count cases by date for the filter badges (using scheduledAt with fallback to createdAt)
  const dateCounts: Record<DateFilter, number> = useMemo(() => {
    const now = new Date();
    const days = [0, 1, 2, 3, 4].map((offset) => ({
      start: startOfDay(subDays(now, offset)),
      end: endOfDay(subDays(now, offset)),
    }));

    const counts = [0, 0, 0, 0, 0];

    eligibleCases.forEach((c) => {
      // Use scheduledAt if available, otherwise fall back to createdAt
      const dateStr = c.scheduledAt ?? c.createdAt;
      if (!dateStr) return;
      const caseDate = parseISO(dateStr);

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        if (!day) continue;
        if (isWithinInterval(caseDate, day)) {
          const currentCount = counts[i];
          if (currentCount !== undefined) {
            counts[i] = currentCount + 1;
          }
          break;
        }
      }
    });

    return {
      today: counts[0] ?? 0,
      yesterday: counts[1] ?? 0,
      "day-2": counts[2] ?? 0,
      "day-3": counts[3] ?? 0,
      "day-4": counts[4] ?? 0,
    };
  }, [eligibleCases]);

  // Generate day labels for the filter buttons
  const dayLabels: Record<DateFilter, string> = useMemo(() => {
    const now = new Date();
    return {
      today: "Today",
      yesterday: "Yesterday",
      "day-2": format(subDays(now, 2), "EEE MMM d"),
      "day-3": format(subDays(now, 3), "EEE MMM d"),
      "day-4": format(subDays(now, 4), "EEE MMM d"),
    };
  }, []);

  // Get selected cases data
  const selectedCasesData = useMemo(() => {
    return eligibleCases.filter((c) => selectedCases.has(c.id));
  }, [eligibleCases, selectedCases]);

  // Count selected cases with email/phone
  const selectedCasesWithEmail = useMemo(() => {
    return selectedCasesData.filter((c) => c.hasEmail).length;
  }, [selectedCasesData]);

  const selectedCasesWithPhone = useMemo(() => {
    return selectedCasesData.filter((c) => c.hasPhone).length;
  }, [selectedCasesData]);

  // Test mode settings
  const testModeEnabled = settingsData?.testModeEnabled ?? false;
  const testContactEmail = settingsData?.testContactEmail ?? "";
  const testContactPhone = settingsData?.testContactPhone ?? "";

  // Initialize schedule times when settings load
  useEffect(() => {
    if (settingsData && !emailScheduleTime && !callScheduleTime) {
      const now = new Date();
      const emailDelayDays = settingsData.emailDelayDays ?? 1;
      const callDelayDays = settingsData.callDelayDays ?? 2;
      const emailStartTime = settingsData.preferredEmailStartTime ?? "09:00";
      const callStartTime = settingsData.preferredCallStartTime ?? "14:00";

      const [emailHour, emailMinute] = emailStartTime.split(":").map(Number);
      const [callHour, callMinute] = callStartTime.split(":").map(Number);

      let emailTime = addDays(now, emailDelayDays);
      emailTime = setHours(emailTime, emailHour ?? 9);
      emailTime = setMinutes(emailTime, emailMinute ?? 0);
      emailTime = setSeconds(emailTime, 0);

      let callTime = addDays(emailTime, callDelayDays);
      callTime = setHours(callTime, callHour ?? 14);
      callTime = setMinutes(callTime, callMinute ?? 0);
      callTime = setSeconds(callTime, 0);

      setEmailScheduleTime(emailTime);
      setCallScheduleTime(callTime);
    }
  }, [settingsData, emailScheduleTime, callScheduleTime]);

  // Mutations - use triggerDischarge for each case (same as dashboard)
  const triggerDischargeMutation = api.cases.triggerDischarge.useMutation();

  // Process cases with controlled concurrency
  const processWithConcurrency = async (
    cases: BatchEligibleCase[],
    concurrency: number,
    scheduledAt: string,
    dischargeType: "email" | "call" | "both",
  ): Promise<ProcessingResult[]> => {
    const results: ProcessingResult[] = [];
    const queue = [...cases];

    const processCase = async (caseData: BatchEligibleCase) => {
      // Check if user marked this case to skip
      if (skippedCases.has(caseData.id)) {
        setProcessingResults((prev) =>
          new Map(prev).set(caseData.id, "skipped"),
        );
        results.push({
          id: caseData.id,
          patientName: caseData.patientName,
          status: "skipped",
        });
        return;
      }

      // Mark as processing
      setProcessingResults((prev) =>
        new Map(prev).set(caseData.id, "processing"),
      );

      try {
        await triggerDischargeMutation.mutateAsync({
          caseId: caseData.id,
          patientId: caseData.patientId,
          patientData: {
            name: caseData.patientName,
            ownerName: caseData.ownerName ?? undefined,
            ownerEmail: caseData.ownerEmail ?? undefined,
            ownerPhone: caseData.ownerPhone ?? undefined,
          },
          dischargeType,
          scheduledAt,
        });

        setProcessingResults((prev) =>
          new Map(prev).set(caseData.id, "success"),
        );
        results.push({
          id: caseData.id,
          patientName: caseData.patientName,
          status: "success",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setProcessingResults((prev) =>
          new Map(prev).set(caseData.id, "failed"),
        );
        setProcessingErrors((prev) =>
          new Map(prev).set(caseData.id, errorMessage),
        );
        results.push({
          id: caseData.id,
          patientName: caseData.patientName,
          status: "failed",
          error: errorMessage,
        });
      }
    };

    // Process with concurrency limit using Promise.all for batches
    while (queue.length > 0) {
      const batch = queue.splice(0, concurrency);
      await Promise.all(batch.map((caseData) => processCase(caseData)));
    }

    return results;
  };

  // Get selectable cases (have required contact info)
  // A case is selectable based on contact info and enabled communication types
  const selectableCases = useMemo(() => {
    return filteredCases.filter((c) => {
      // If emails are enabled, case must have email
      // If calls are enabled, case must have phone
      // If both are enabled, case must have at least one (email for emails, phone for calls)
      if (emailsEnabled && callsEnabled) {
        // Need at least one contact method
        return c.hasEmail || c.hasPhone;
      } else if (emailsEnabled) {
        return c.hasEmail;
      } else if (callsEnabled) {
        return c.hasPhone;
      }
      return false;
    });
  }, [filteredCases, emailsEnabled, callsEnabled]);

  // Count of cases excluded due to missing contact info
  const excludedCasesCount = filteredCases.length - selectableCases.length;

  // Check if a case is selectable
  const isCaseSelectable = (c: BatchEligibleCase) => {
    if (emailsEnabled && callsEnabled) {
      return c.hasEmail || c.hasPhone;
    } else if (emailsEnabled) {
      return c.hasEmail;
    } else if (callsEnabled) {
      return c.hasPhone;
    }
    return false;
  };

  // Handlers
  const handleSelectAll = () => {
    // Only select cases that have required contact info
    if (selectedCases.size === selectableCases.length) {
      setSelectedCases(new Set());
    } else {
      setSelectedCases(new Set(selectableCases.map((c) => c.id)));
    }
  };

  const handleSelectCase = (caseId: string) => {
    const caseData = filteredCases.find((c) => c.id === caseId);
    if (!caseData || !isCaseSelectable(caseData)) return;

    const newSelected = new Set(selectedCases);
    if (newSelected.has(caseId)) {
      newSelected.delete(caseId);
    } else {
      newSelected.add(caseId);
    }
    setSelectedCases(newSelected);
  };

  // Toggle skip status for a case
  const handleToggleSkip = (caseId: string) => {
    const newSkipped = new Set(skippedCases);
    if (newSkipped.has(caseId)) {
      newSkipped.delete(caseId);
    } else {
      newSkipped.add(caseId);
    }
    setSkippedCases(newSkipped);
  };

  // Start processing - moves to processing step and begins batch
  const handleStartProcessing = async () => {
    if (selectedCases.size === 0) {
      toast.error("Please select at least one case");
      return;
    }

    if (!emailsEnabled && !callsEnabled) {
      toast.error("Please enable at least one communication type");
      return;
    }

    // Calculate final schedule time based on mode (use email time or call time)
    let finalScheduleTime: Date;
    if (emailsEnabled) {
      if (emailScheduleMode === "minutes") {
        finalScheduleTime = new Date(
          Date.now() + emailMinutesFromNow * 60 * 1000,
        );
      } else if (emailScheduleTime) {
        finalScheduleTime = emailScheduleTime;
      } else {
        toast.error("Please configure email schedule time");
        return;
      }
    } else if (callsEnabled) {
      if (callScheduleMode === "minutes") {
        finalScheduleTime = new Date(
          Date.now() + callMinutesFromNow * 60 * 1000,
        );
      } else if (callScheduleTime) {
        finalScheduleTime = callScheduleTime;
      } else {
        toast.error("Please configure call schedule time");
        return;
      }
    } else {
      return;
    }

    // Determine discharge type
    const dischargeType: "email" | "call" | "both" =
      emailsEnabled && callsEnabled ? "both" : emailsEnabled ? "email" : "call";

    // Get cases to process
    const casesToProcess = eligibleCases.filter((c) => selectedCases.has(c.id));

    // Initialize processing state
    const initialResults = new Map<string, ProcessingStatus>();
    casesToProcess.forEach((c) => {
      initialResults.set(c.id, skippedCases.has(c.id) ? "skipped" : "pending");
    });
    setProcessingResults(initialResults);
    setProcessingErrors(new Map());
    setFinalResults([]);

    // Move to processing step
    setCurrentStep("processing");
    setIsProcessing(true);

    try {
      const results = await processWithConcurrency(
        casesToProcess,
        BATCH_CONCURRENCY,
        finalScheduleTime.toISOString(),
        dischargeType,
      );

      setFinalResults(results);
      setCurrentStep("complete");

      const successCount = results.filter((r) => r.status === "success").length;
      const failedCount = results.filter((r) => r.status === "failed").length;
      const skippedCount = results.filter((r) => r.status === "skipped").length;

      if (failedCount === 0) {
        toast.success(
          `Batch complete: ${successCount} scheduled${skippedCount > 0 ? `, ${skippedCount} skipped` : ""}`,
        );
      } else {
        toast.warning(
          `Batch complete: ${successCount} scheduled, ${failedCount} failed${skippedCount > 0 ? `, ${skippedCount} skipped` : ""}`,
        );
      }
    } catch (error) {
      toast.error("Batch processing failed");
      console.error("Batch processing error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchComplete = () => {
    setActiveBatchId(null);
    setIsProcessing(false);
    setSelectedCases(new Set());
    setSkippedCases(new Set());
    setProcessingResults(new Map());
    setProcessingErrors(new Map());
    setFinalResults([]);
    setCurrentStep("select");
    void refetchCases();
  };

  const handleBatchCancel = () => {
    setActiveBatchId(null);
    setIsProcessing(false);
    toast.warning("Batch processing cancelled");
  };

  // Date/time update handlers
  const updateEmailDate = (dateString: string) => {
    if (!dateString) return;
    const currentTime = emailScheduleTime ?? new Date();
    const newDate = new Date(dateString);
    newDate.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
    setEmailScheduleTime(newDate);
  };

  const updateCallDate = (dateString: string) => {
    if (!dateString) return;
    const currentTime = callScheduleTime ?? new Date();
    const newDate = new Date(dateString);
    newDate.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
    setCallScheduleTime(newDate);
  };

  const updateEmailTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const currentDate = emailScheduleTime ?? addDays(new Date(), 1);
    const newDate = new Date(currentDate);
    newDate.setHours(hours ?? 9, minutes ?? 0, 0, 0);
    setEmailScheduleTime(newDate);
  };

  const updateCallTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const currentDate = callScheduleTime ?? addDays(new Date(), 3);
    const newDate = new Date(currentDate);
    newDate.setHours(hours ?? 14, minutes ?? 0, 0, 0);
    setCallScheduleTime(newDate);
  };

  const resetToDefaults = () => {
    if (!settingsData) return;
    const now = new Date();
    const emailDelayDays = settingsData.emailDelayDays ?? 1;
    const callDelayDays = settingsData.callDelayDays ?? 2;
    const emailStartTime = settingsData.preferredEmailStartTime ?? "09:00";
    const callStartTime = settingsData.preferredCallStartTime ?? "14:00";

    const [emailHour, emailMinute] = emailStartTime.split(":").map(Number);
    const [callHour, callMinute] = callStartTime.split(":").map(Number);

    let emailTime = addDays(now, emailDelayDays);
    emailTime = setHours(emailTime, emailHour ?? 9);
    emailTime = setMinutes(emailTime, emailMinute ?? 0);
    emailTime = setSeconds(emailTime, 0);

    let callTime = addDays(emailTime, callDelayDays);
    callTime = setHours(callTime, callHour ?? 14);
    callTime = setMinutes(callTime, callMinute ?? 0);
    callTime = setSeconds(callTime, 0);

    setEmailScheduleTime(emailTime);
    setCallScheduleTime(callTime);
  };

  // Format values
  const emailDateValue = emailScheduleTime
    ? format(emailScheduleTime, "yyyy-MM-dd")
    : "";
  const callDateValue = callScheduleTime
    ? format(callScheduleTime, "yyyy-MM-dd")
    : "";
  const emailTimeValue = emailScheduleTime
    ? `${emailScheduleTime.getHours().toString().padStart(2, "0")}:${emailScheduleTime.getMinutes().toString().padStart(2, "0")}`
    : "09:00";
  const callTimeValue = callScheduleTime
    ? `${callScheduleTime.getHours().toString().padStart(2, "0")}:${callScheduleTime.getMinutes().toString().padStart(2, "0")}`
    : "14:00";
  const minDate = format(new Date(), "yyyy-MM-dd");

  // Step progress (5 steps now)
  const stepProgress =
    currentStep === "select"
      ? 20
      : currentStep === "schedule"
        ? 40
        : currentStep === "review"
          ? 60
          : currentStep === "processing"
            ? 80
            : 100;

  // Can proceed to next step
  const canProceedToSchedule = selectedCases.size > 0;
  // At least one communication type must be enabled with valid schedule
  // For "minutes" mode, always valid if minutes > 0
  // For "datetime" mode, need a valid datetime set
  const emailScheduleValid =
    !emailsEnabled ||
    emailScheduleMode === "minutes" ||
    (emailScheduleMode === "datetime" && emailScheduleTime !== null);
  const callScheduleValid =
    !callsEnabled ||
    callScheduleMode === "minutes" ||
    (callScheduleMode === "datetime" && callScheduleTime !== null);
  const canProceedToReview =
    (emailsEnabled || callsEnabled) && emailScheduleValid && callScheduleValid;

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-50/50 to-white">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold tracking-tight">
                    Batch Discharge
                  </h1>
                  {testModeEnabled && (
                    <Badge
                      variant="outline"
                      className="gap-1.5 border-amber-300 bg-amber-50 text-amber-700"
                    >
                      <TestTube className="h-3 w-3" />
                      Test Mode
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  Schedule communications for multiple cases
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground text-sm">
                Step{" "}
                {currentStep === "select"
                  ? 1
                  : currentStep === "schedule"
                    ? 2
                    : currentStep === "review"
                      ? 3
                      : currentStep === "processing"
                        ? 4
                        : 5}{" "}
                of 5
              </div>
              <div className="w-32">
                <Progress value={stepProgress} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Mode Warning */}
      {testModeEnabled && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto max-w-6xl px-6 py-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-amber-800">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                <span>Test Mode Active</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {testContactEmail && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Emails → <strong>{testContactEmail}</strong>
                  </span>
                )}
                {testContactPhone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Calls → <strong>{testContactPhone}</strong>
                  </span>
                )}
                {!testContactEmail && !testContactPhone && (
                  <span className="text-amber-600">
                    No test contacts configured
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Tabs
            value={currentStep}
            onValueChange={(v) => setCurrentStep(v as Step)}
            className="space-y-8"
          >
            {/* Step Tabs */}
            <TabsList className="grid w-full grid-cols-3 bg-slate-100/80">
              <TabsTrigger
                value="select"
                className="gap-2 data-[state=active]:bg-white"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Select Cases</span>
                <span className="sm:hidden">Cases</span>
                {selectedCases.size > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedCases.size}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="schedule"
                disabled={!canProceedToSchedule}
                className="gap-2 data-[state=active]:bg-white"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Configure Schedule</span>
                <span className="sm:hidden">Schedule</span>
              </TabsTrigger>
              <TabsTrigger
                value="review"
                disabled={!canProceedToSchedule || !canProceedToReview}
                className="gap-2 data-[state=active]:bg-white"
              >
                <CheckCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Review & Send</span>
                <span className="sm:hidden">Review</span>
              </TabsTrigger>
            </TabsList>

            {/* Step 1: Select Cases */}
            <TabsContent value="select" className="space-y-6">
              {/* Filters and Selection */}
              <Card>
                <CardHeader className="space-y-4 pb-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Select Cases</CardTitle>
                      <CardDescription>
                        Choose which cases to include in this batch
                      </CardDescription>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                      <Input
                        placeholder="Search patients or owners..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Filter Row */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Date Filters - Individual Days */}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="text-muted-foreground h-4 w-4" />
                      <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-slate-50/50 p-1">
                        {(
                          [
                            "today",
                            "yesterday",
                            "day-2",
                            "day-3",
                            "day-4",
                          ] as DateFilter[]
                        ).map((day) => (
                          <Button
                            key={day}
                            variant={dateFilter === day ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setDateFilter(day)}
                            className="h-7 gap-1.5 px-2.5"
                          >
                            {dayLabels[day]}
                            {dateCounts[day] > 0 && (
                              <Badge
                                variant={
                                  dateFilter === day ? "default" : "secondary"
                                }
                                className="h-5 min-w-5 px-1.5"
                              >
                                {dateCounts[day]}
                              </Badge>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingCases ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                    </div>
                  ) : filteredCases.length === 0 ? (
                    <div className="py-16 text-center">
                      <Users className="text-muted-foreground/30 mx-auto h-12 w-12" />
                      <p className="text-muted-foreground mt-4">
                        No eligible cases found
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Cases need clinical notes and valid contact information
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Select All Header */}
                      <div className="flex items-center justify-between border-y bg-gradient-to-r from-slate-50/50 to-transparent px-4 py-3">
                        <label className="flex cursor-pointer items-center gap-3">
                          <Checkbox
                            checked={
                              selectedCases.size === filteredCases.length &&
                              filteredCases.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                          />
                          <span className="text-sm font-medium">
                            {selectedCases.size === filteredCases.length
                              ? "Deselect all"
                              : "Select all"}
                          </span>
                        </label>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground text-sm font-medium">
                            {filteredCases.length} case
                            {filteredCases.length !== 1 ? "s" : ""}
                          </span>
                          {selectedCasesWithEmail > 0 && (
                            <span className="flex items-center gap-1 text-xs font-medium text-blue-600">
                              <Mail className="h-3 w-3" />
                              {selectedCasesWithEmail} Email
                            </span>
                          )}
                          {selectedCasesWithPhone > 0 && (
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                              <Phone className="h-3 w-3" />
                              {selectedCasesWithPhone} Call
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Excluded Cases Warning */}
                      {excludedCasesCount > 0 && (
                        <Alert className="mx-4 mb-2 border-amber-200 bg-amber-50">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-sm text-amber-800">
                            <strong>{excludedCasesCount}</strong> case
                            {excludedCasesCount !== 1 ? "s" : ""} hidden due to
                            missing{" "}
                            {emailsEnabled && callsEnabled
                              ? "contact info"
                              : emailsEnabled
                                ? "email address"
                                : "phone number"}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Case List */}
                      <ScrollArea className="h-[400px]">
                        <div className="divide-y">
                          {filteredCases.map((caseData) => {
                            const isSelectable = isCaseSelectable(caseData);
                            return (
                              <div
                                key={caseData.id}
                                className={cn(
                                  "flex items-center gap-4 px-4 py-3 transition-colors",
                                  isSelectable && "hover:bg-slate-50/50",
                                  selectedCases.has(caseData.id) &&
                                    "bg-emerald-50/30",
                                  !isSelectable && "opacity-50",
                                )}
                              >
                                <Checkbox
                                  checked={selectedCases.has(caseData.id)}
                                  onCheckedChange={() =>
                                    handleSelectCase(caseData.id)
                                  }
                                  disabled={!isSelectable}
                                />
                                {/* Date Column */}
                                <div className="w-20 shrink-0 text-center">
                                  <div className="text-xs font-medium text-slate-700">
                                    {caseData.scheduledAt
                                      ? format(
                                          parseISO(caseData.scheduledAt),
                                          "MMM d",
                                        )
                                      : caseData.createdAt
                                        ? format(
                                            parseISO(caseData.createdAt),
                                            "MMM d",
                                          )
                                        : "N/A"}
                                  </div>
                                  <div className="text-muted-foreground text-xs">
                                    {caseData.scheduledAt
                                      ? format(
                                          parseISO(caseData.scheduledAt),
                                          "EEE",
                                        )
                                      : caseData.createdAt
                                        ? format(
                                            parseISO(caseData.createdAt),
                                            "EEE",
                                          )
                                        : ""}
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate font-medium">
                                      {caseData.patientName}
                                    </span>
                                    {(caseData.source === "idexx_neo" ||
                                      caseData.source ===
                                        "idexx_extension") && (
                                      <Badge
                                        variant="outline"
                                        className="border-blue-200 bg-blue-50 text-xs text-blue-700"
                                      >
                                        IDEXX
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground truncate text-sm">
                                    {caseData.ownerName ?? "Unknown owner"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {caseData.hasIdexxNotes && (
                                    <Badge
                                      variant="secondary"
                                      className="gap-1 text-xs"
                                    >
                                      <Stethoscope className="h-3 w-3" />
                                      Notes
                                    </Badge>
                                  )}
                                  {caseData.hasDischargeSummary && (
                                    <Badge
                                      variant="secondary"
                                      className="gap-1 text-xs"
                                    >
                                      <FileText className="h-3 w-3" />
                                      Summary
                                    </Badge>
                                  )}
                                </div>
                                {/* Email/Call Status */}
                                <div className="flex items-center gap-1.5">
                                  {caseData.hasEmail && (
                                    <div
                                      className={cn(
                                        "rounded-full p-1.5",
                                        caseData.emailSent
                                          ? "bg-blue-500"
                                          : "bg-blue-100",
                                      )}
                                      title={
                                        caseData.emailSent
                                          ? "Email sent"
                                          : "Email pending"
                                      }
                                    >
                                      {caseData.emailSent ? (
                                        <CheckCircle className="h-3 w-3 text-white" />
                                      ) : (
                                        <Mail className="h-3 w-3 text-blue-600" />
                                      )}
                                    </div>
                                  )}
                                  {caseData.hasPhone && (
                                    <div
                                      className={cn(
                                        "rounded-full p-1.5",
                                        caseData.callSent
                                          ? "bg-green-500"
                                          : "bg-green-100",
                                      )}
                                      title={
                                        caseData.callSent
                                          ? "Call made"
                                          : "Call pending"
                                      }
                                    >
                                      {caseData.callSent ? (
                                        <CheckCircle className="h-3 w-3 text-white" />
                                      ) : (
                                        <Phone className="h-3 w-3 text-green-600" />
                                      )}
                                    </div>
                                  )}
                                  {/* Missing contact warning */}
                                  {!isSelectable && (
                                    <Badge
                                      variant="outline"
                                      className="ml-auto border-amber-200 bg-amber-50 text-amber-700"
                                    >
                                      {!caseData.hasEmail && emailsEnabled
                                        ? "No email"
                                        : "No phone"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </>
                  )}
                </CardContent>
                <CardFooter className="justify-between border-t bg-gradient-to-r from-slate-50/30 to-transparent p-4">
                  <div className="flex items-center gap-4">
                    <p className="text-muted-foreground text-sm font-medium">
                      {selectedCases.size} case
                      {selectedCases.size !== 1 ? "s" : ""} selected
                    </p>
                    {selectedCases.size > 0 && (
                      <div className="flex gap-3 text-xs">
                        {selectedCasesWithEmail > 0 && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Mail className="h-3 w-3" />
                            {selectedCasesWithEmail} Email
                          </span>
                        )}
                        {selectedCasesWithPhone > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Phone className="h-3 w-3" />
                            {selectedCasesWithPhone} Call
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => setCurrentStep("schedule")}
                    disabled={!canProceedToSchedule}
                    className="gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Step 2: Configure Schedule */}
            <TabsContent value="schedule" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Email Schedule */}
                <Card className={cn(!emailsEnabled && "opacity-60")}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "rounded-lg p-2.5",
                            emailsEnabled ? "bg-blue-100" : "bg-slate-100",
                          )}
                        >
                          <Mail
                            className={cn(
                              "h-5 w-5",
                              emailsEnabled
                                ? "text-blue-600"
                                : "text-slate-400",
                            )}
                          />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Email Schedule
                          </CardTitle>
                          <CardDescription>
                            When to send discharge emails
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="emails-enabled"
                          checked={emailsEnabled}
                          onCheckedChange={setEmailsEnabled}
                        />
                        <Label
                          htmlFor="emails-enabled"
                          className="text-sm font-medium"
                        >
                          {emailsEnabled ? "Enabled" : "Disabled"}
                        </Label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {emailsEnabled ? (
                      <>
                        {/* Schedule Mode Toggle */}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={
                              emailScheduleMode === "minutes"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setEmailScheduleMode("minutes")}
                            className="flex-1 gap-2"
                          >
                            <Timer className="h-4 w-4" />
                            Quick Send
                          </Button>
                          <Button
                            type="button"
                            variant={
                              emailScheduleMode === "datetime"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setEmailScheduleMode("datetime")}
                            className="flex-1 gap-2"
                          >
                            <Calendar className="h-4 w-4" />
                            Schedule
                          </Button>
                        </div>

                        {emailScheduleMode === "minutes" ? (
                          <>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Send in
                              </label>
                              <div className="flex gap-2">
                                {[1, 5, 10, 30, 60].map((mins) => (
                                  <Button
                                    key={mins}
                                    type="button"
                                    variant={
                                      emailMinutesFromNow === mins
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setEmailMinutesFromNow(mins)}
                                    className="flex-1"
                                  >
                                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            <Alert className="border-blue-100 bg-blue-50/50">
                              <Timer className="h-4 w-4 text-blue-600" />
                              <AlertDescription className="text-blue-700">
                                <strong>{selectedCasesWithEmail}</strong> emails
                                will be sent in{" "}
                                <strong>
                                  {emailMinutesFromNow < 60
                                    ? `${emailMinutesFromNow} minutes`
                                    : `${emailMinutesFromNow / 60} hour`}
                                </strong>
                              </AlertDescription>
                            </Alert>
                          </>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Date
                              </label>
                              <div className="relative">
                                <Calendar className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <Input
                                  type="date"
                                  className="pl-10"
                                  value={emailDateValue}
                                  min={minDate}
                                  onChange={(e) =>
                                    updateEmailDate(e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Time
                              </label>
                              <Select
                                value={emailTimeValue}
                                onValueChange={updateEmailTime}
                              >
                                <SelectTrigger>
                                  <Clock className="mr-2 h-4 w-4" />
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {emailScheduleTime && (
                              <Alert className="border-blue-100 bg-blue-50/50">
                                <Mail className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-700">
                                  <strong>{selectedCasesWithEmail}</strong>{" "}
                                  emails scheduled for{" "}
                                  <strong>
                                    {format(
                                      emailScheduleTime,
                                      "EEEE, MMM d 'at' h:mm a",
                                    )}
                                  </strong>
                                </AlertDescription>
                              </Alert>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="text-muted-foreground py-4 text-center text-sm">
                        Emails will not be sent for this batch
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Call Schedule */}
                <Card className={cn(!callsEnabled && "opacity-60")}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "rounded-lg p-2.5",
                            callsEnabled ? "bg-green-100" : "bg-slate-100",
                          )}
                        >
                          <Phone
                            className={cn(
                              "h-5 w-5",
                              callsEnabled
                                ? "text-green-600"
                                : "text-slate-400",
                            )}
                          />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Call Schedule
                          </CardTitle>
                          <CardDescription>
                            When to make follow-up calls
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="calls-enabled"
                          checked={callsEnabled}
                          onCheckedChange={setCallsEnabled}
                        />
                        <Label
                          htmlFor="calls-enabled"
                          className="text-sm font-medium"
                        >
                          {callsEnabled ? "Enabled" : "Disabled"}
                        </Label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {callsEnabled ? (
                      <>
                        {/* Schedule Mode Toggle */}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={
                              callScheduleMode === "minutes"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setCallScheduleMode("minutes")}
                            className="flex-1 gap-2"
                          >
                            <Timer className="h-4 w-4" />
                            Quick Send
                          </Button>
                          <Button
                            type="button"
                            variant={
                              callScheduleMode === "datetime"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setCallScheduleMode("datetime")}
                            className="flex-1 gap-2"
                          >
                            <Calendar className="h-4 w-4" />
                            Schedule
                          </Button>
                        </div>

                        {callScheduleMode === "minutes" ? (
                          <>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Call in
                              </label>
                              <div className="flex gap-2">
                                {[1, 5, 10, 30, 60].map((mins) => (
                                  <Button
                                    key={mins}
                                    type="button"
                                    variant={
                                      callMinutesFromNow === mins
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setCallMinutesFromNow(mins)}
                                    className="flex-1"
                                  >
                                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            <Alert className="border-green-100 bg-green-50/50">
                              <Timer className="h-4 w-4 text-green-600" />
                              <AlertDescription className="text-green-700">
                                <strong>{selectedCasesWithPhone}</strong> calls
                                will be made in{" "}
                                <strong>
                                  {callMinutesFromNow < 60
                                    ? `${callMinutesFromNow} minutes`
                                    : `${callMinutesFromNow / 60} hour`}
                                </strong>
                              </AlertDescription>
                            </Alert>
                          </>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Date
                              </label>
                              <div className="relative">
                                <Calendar className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <Input
                                  type="date"
                                  className="pl-10"
                                  value={callDateValue}
                                  min={minDate}
                                  onChange={(e) =>
                                    updateCallDate(e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Time
                              </label>
                              <Select
                                value={callTimeValue}
                                onValueChange={updateCallTime}
                              >
                                <SelectTrigger>
                                  <Clock className="mr-2 h-4 w-4" />
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {callScheduleTime && (
                              <Alert className="border-green-100 bg-green-50/50">
                                <Phone className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-700">
                                  <strong>{selectedCasesWithPhone}</strong>{" "}
                                  calls scheduled for{" "}
                                  <strong>
                                    {format(
                                      callScheduleTime,
                                      "EEEE, MMM d 'at' h:mm a",
                                    )}
                                  </strong>
                                </AlertDescription>
                              </Alert>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="text-muted-foreground py-4 text-center text-sm">
                        Calls will not be made for this batch
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Warning if neither enabled */}
              {!emailsEnabled && !callsEnabled && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Warning:</strong> You have disabled both emails and
                    calls. Please enable at least one communication type to
                    proceed.
                  </AlertDescription>
                </Alert>
              )}

              {/* Reset & Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={resetToDefaults}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset to Defaults
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep("select")}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep("review")}
                    disabled={!canProceedToReview}
                    className="gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Step 3: Review & Send */}
            <TabsContent value="review" className="space-y-6">
              {/* Test Mode Alert */}
              {testModeEnabled && (
                <Alert className="border-amber-300 bg-amber-50">
                  <TestTube className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong className="font-semibold">Test Mode Active:</strong>{" "}
                    All communications will be redirected to your test contacts.
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      {testContactEmail && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          <strong>{testContactEmail}</strong>
                        </span>
                      )}
                      {testContactPhone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          <strong>{testContactPhone}</strong>
                        </span>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 p-2.5">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle>Ready to Send</CardTitle>
                      <CardDescription>
                        Review your batch discharge settings
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-slate-100 p-2">
                          <Users className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold">
                            {selectedCases.size}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            Cases Selected
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4",
                        !emailsEnabled && "opacity-50",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "rounded-lg p-2",
                            emailsEnabled ? "bg-blue-100" : "bg-slate-100",
                          )}
                        >
                          <Mail
                            className={cn(
                              "h-5 w-5",
                              emailsEnabled
                                ? "text-blue-600"
                                : "text-slate-400",
                            )}
                          />
                        </div>
                        <div>
                          <p className="text-3xl font-bold">
                            {emailsEnabled ? selectedCasesWithEmail : 0}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {emailsEnabled
                              ? "Emails to Send"
                              : "Emails Disabled"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "rounded-xl border bg-gradient-to-br from-green-50 to-white p-4",
                        !callsEnabled && "opacity-50",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "rounded-lg p-2",
                            callsEnabled ? "bg-green-100" : "bg-slate-100",
                          )}
                        >
                          <Phone
                            className={cn(
                              "h-5 w-5",
                              callsEnabled
                                ? "text-green-600"
                                : "text-slate-400",
                            )}
                          />
                        </div>
                        <div>
                          <p className="text-3xl font-bold">
                            {callsEnabled ? selectedCasesWithPhone : 0}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {callsEnabled ? "Calls to Make" : "Calls Disabled"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Schedule Summary */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Schedule Summary</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div
                        className={cn(
                          "flex items-start gap-3 rounded-lg border p-4",
                          !emailsEnabled && "opacity-50",
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-full p-2",
                            emailsEnabled ? "bg-blue-100" : "bg-slate-100",
                          )}
                        >
                          <Mail
                            className={cn(
                              "h-4 w-4",
                              emailsEnabled
                                ? "text-blue-600"
                                : "text-slate-400",
                            )}
                          />
                        </div>
                        <div>
                          <p className="font-medium">Emails</p>
                          {emailsEnabled ? (
                            emailScheduleMode === "minutes" ? (
                              <p className="text-muted-foreground text-sm">
                                In{" "}
                                {emailMinutesFromNow < 60
                                  ? `${emailMinutesFromNow} minutes`
                                  : `${emailMinutesFromNow / 60} hour`}
                              </p>
                            ) : (
                              <>
                                <p className="text-muted-foreground text-sm">
                                  {emailScheduleTime
                                    ? format(
                                        emailScheduleTime,
                                        "EEEE, MMMM d, yyyy",
                                      )
                                    : "Not scheduled"}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                  {emailScheduleTime
                                    ? format(emailScheduleTime, "h:mm a")
                                    : ""}
                                </p>
                              </>
                            )
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              Disabled
                            </p>
                          )}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "flex items-start gap-3 rounded-lg border p-4",
                          !callsEnabled && "opacity-50",
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-full p-2",
                            callsEnabled ? "bg-green-100" : "bg-slate-100",
                          )}
                        >
                          <Phone
                            className={cn(
                              "h-4 w-4",
                              callsEnabled
                                ? "text-green-600"
                                : "text-slate-400",
                            )}
                          />
                        </div>
                        <div>
                          <p className="font-medium">Follow-up Calls</p>
                          {callsEnabled ? (
                            callScheduleMode === "minutes" ? (
                              <p className="text-muted-foreground text-sm">
                                In{" "}
                                {callMinutesFromNow < 60
                                  ? `${callMinutesFromNow} minutes`
                                  : `${callMinutesFromNow / 60} hour`}
                              </p>
                            ) : (
                              <>
                                <p className="text-muted-foreground text-sm">
                                  {callScheduleTime
                                    ? format(
                                        callScheduleTime,
                                        "EEEE, MMMM d, yyyy",
                                      )
                                    : "Not scheduled"}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                  {callScheduleTime
                                    ? format(callScheduleTime, "h:mm a")
                                    : ""}
                                </p>
                              </>
                            )
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              Disabled
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Cases Preview - With Skip Option */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        Selected Cases ({selectedCases.size - skippedCases.size}{" "}
                        to process, {skippedCases.size} to skip)
                      </h4>
                      {skippedCases.size > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSkippedCases(new Set())}
                          className="text-muted-foreground text-xs"
                        >
                          Clear all skips
                        </Button>
                      )}
                    </div>
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertOctagon className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-sm text-amber-800">
                        <strong>Review carefully:</strong> Mark any emergencies,
                        euthanasias, or sensitive cases to skip them before
                        processing.
                      </AlertDescription>
                    </Alert>
                    <ScrollArea className="h-64 rounded-lg border">
                      <div className="divide-y p-2">
                        {selectedCasesData.map((caseData) => {
                          const isSkipped = skippedCases.has(caseData.id);
                          return (
                            <div
                              key={caseData.id}
                              className={cn(
                                "flex items-center justify-between px-2 py-3 transition-colors",
                                isSkipped && "bg-slate-50 opacity-60",
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={!isSkipped}
                                  onCheckedChange={() =>
                                    handleToggleSkip(caseData.id)
                                  }
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "font-medium",
                                        isSkipped && "line-through",
                                      )}
                                    >
                                      {caseData.patientName}
                                    </span>
                                    <span className="text-muted-foreground text-sm">
                                      — {caseData.ownerName}
                                    </span>
                                  </div>
                                  {isSkipped && (
                                    <Badge
                                      variant="outline"
                                      className="mt-1 border-amber-300 bg-amber-50 text-amber-700"
                                    >
                                      <SkipForward className="mr-1 h-3 w-3" />
                                      Will be skipped
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                  {caseData.hasEmail && (
                                    <Mail className="h-3.5 w-3.5 text-blue-500" />
                                  )}
                                  {caseData.hasPhone && (
                                    <Phone className="h-3.5 w-3.5 text-green-500" />
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleSkip(caseData.id)}
                                  className={cn(
                                    "h-8 px-2 text-xs",
                                    isSkipped
                                      ? "text-emerald-600 hover:text-emerald-700"
                                      : "text-amber-600 hover:text-amber-700",
                                  )}
                                >
                                  {isSkipped ? (
                                    <>
                                      <RotateCcw className="mr-1 h-3 w-3" />
                                      Include
                                    </>
                                  ) : (
                                    <>
                                      <SkipForward className="mr-1 h-3 w-3" />
                                      Skip
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-slate-50/30 p-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep("schedule")}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleStartProcessing}
                    disabled={
                      isProcessing ||
                      selectedCases.size - skippedCases.size === 0
                    }
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Send className="h-4 w-4" />
                    Process {selectedCases.size - skippedCases.size} Cases
                    {skippedCases.size > 0 && ` (${skippedCases.size} skipped)`}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Step 4: Processing */}
            <TabsContent value="processing" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2.5">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Processing Discharges</CardTitle>
                      <CardDescription>
                        Scheduling communications for each case...
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {
                          Array.from(processingResults.values()).filter(
                            (s) =>
                              s === "success" ||
                              s === "failed" ||
                              s === "skipped",
                          ).length
                        }{" "}
                        / {processingResults.size}
                      </span>
                    </div>
                    <Progress
                      value={
                        (Array.from(processingResults.values()).filter(
                          (s) =>
                            s === "success" ||
                            s === "failed" ||
                            s === "skipped",
                        ).length /
                          processingResults.size) *
                        100
                      }
                      className="h-3"
                    />
                  </div>

                  {/* Status Legend */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <CircleDashed className="h-4 w-4 text-slate-400" />
                      <span>
                        Pending (
                        {
                          Array.from(processingResults.values()).filter(
                            (s) => s === "pending",
                          ).length
                        }
                        )
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <span>
                        Processing (
                        {
                          Array.from(processingResults.values()).filter(
                            (s) => s === "processing",
                          ).length
                        }
                        )
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>
                        Success (
                        {
                          Array.from(processingResults.values()).filter(
                            (s) => s === "success",
                          ).length
                        }
                        )
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>
                        Failed (
                        {
                          Array.from(processingResults.values()).filter(
                            (s) => s === "failed",
                          ).length
                        }
                        )
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <SkipForward className="h-4 w-4 text-amber-500" />
                      <span>
                        Skipped (
                        {
                          Array.from(processingResults.values()).filter(
                            (s) => s === "skipped",
                          ).length
                        }
                        )
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Processing List */}
                  <ScrollArea className="h-80 rounded-lg border">
                    <div className="divide-y p-2">
                      {Array.from(processingResults.entries()).map(
                        ([caseId, status]) => {
                          const caseData = eligibleCases.find(
                            (c) => c.id === caseId,
                          );
                          const errorMsg = processingErrors.get(caseId);
                          return (
                            <div
                              key={caseId}
                              className={cn(
                                "flex items-center justify-between px-3 py-2.5",
                                status === "skipped" && "opacity-60",
                              )}
                            >
                              <div className="flex items-center gap-3">
                                {status === "pending" && (
                                  <CircleDashed className="h-4 w-4 text-slate-400" />
                                )}
                                {status === "processing" && (
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                )}
                                {status === "success" && (
                                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                                )}
                                {status === "failed" && (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                {status === "skipped" && (
                                  <SkipForward className="h-4 w-4 text-amber-500" />
                                )}
                                <div>
                                  <span className="font-medium">
                                    {caseData?.patientName ?? "Unknown"}
                                  </span>
                                  <span className="text-muted-foreground ml-2 text-sm">
                                    — {caseData?.ownerName ?? ""}
                                  </span>
                                  {errorMsg && (
                                    <p className="mt-0.5 text-xs text-red-600">
                                      {errorMsg}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  status === "pending" &&
                                    "border-slate-200 text-slate-500",
                                  status === "processing" &&
                                    "border-blue-200 bg-blue-50 text-blue-700",
                                  status === "success" &&
                                    "border-emerald-200 bg-emerald-50 text-emerald-700",
                                  status === "failed" &&
                                    "border-red-200 bg-red-50 text-red-700",
                                  status === "skipped" &&
                                    "border-amber-200 bg-amber-50 text-amber-700",
                                )}
                              >
                                {status}
                              </Badge>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 5: Complete */}
            <TabsContent value="complete" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 p-2.5">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle>Batch Complete</CardTitle>
                      <CardDescription>
                        Processing finished - review the results below
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Results Summary */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-100 p-2">
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-emerald-700">
                            {
                              finalResults.filter((r) => r.status === "success")
                                .length
                            }
                          </p>
                          <p className="text-sm text-emerald-600">
                            Successfully Scheduled
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "rounded-xl border p-4",
                        finalResults.filter((r) => r.status === "failed")
                          .length > 0
                          ? "border-red-200 bg-gradient-to-br from-red-50 to-white"
                          : "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "rounded-lg p-2",
                            finalResults.filter((r) => r.status === "failed")
                              .length > 0
                              ? "bg-red-100"
                              : "bg-slate-100",
                          )}
                        >
                          <XCircle
                            className={cn(
                              "h-5 w-5",
                              finalResults.filter((r) => r.status === "failed")
                                .length > 0
                                ? "text-red-600"
                                : "text-slate-400",
                            )}
                          />
                        </div>
                        <div>
                          <p
                            className={cn(
                              "text-3xl font-bold",
                              finalResults.filter((r) => r.status === "failed")
                                .length > 0
                                ? "text-red-700"
                                : "text-slate-500",
                            )}
                          >
                            {
                              finalResults.filter((r) => r.status === "failed")
                                .length
                            }
                          </p>
                          <p
                            className={cn(
                              "text-sm",
                              finalResults.filter((r) => r.status === "failed")
                                .length > 0
                                ? "text-red-600"
                                : "text-slate-500",
                            )}
                          >
                            Failed
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-amber-100 p-2">
                          <SkipForward className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-amber-700">
                            {
                              finalResults.filter((r) => r.status === "skipped")
                                .length
                            }
                          </p>
                          <p className="text-sm text-amber-600">
                            Skipped by User
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Failed Cases Details */}
                  {finalResults.filter((r) => r.status === "failed").length >
                    0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="font-medium text-red-700">
                          Failed Cases
                        </h4>
                        <Alert className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-sm text-red-800">
                            The following cases failed to schedule. You can
                            retry them individually from the Cases page.
                          </AlertDescription>
                        </Alert>
                        <ScrollArea className="h-40 rounded-lg border border-red-200">
                          <div className="divide-y p-2">
                            {finalResults
                              .filter((r) => r.status === "failed")
                              .map((result) => (
                                <div
                                  key={result.id}
                                  className="flex items-center justify-between px-3 py-2"
                                >
                                  <div>
                                    <span className="font-medium">
                                      {result.patientName}
                                    </span>
                                    {result.error && (
                                      <p className="text-muted-foreground text-xs">
                                        {result.error}
                                      </p>
                                    )}
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="border-red-200 bg-red-50 text-red-700"
                                  >
                                    Failed
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-slate-50/30 p-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/discharges")}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Go to Cases
                  </Button>
                  <Button
                    onClick={handleBatchComplete}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Start New Batch
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Batch Progress Monitor (Legacy - keeping for backwards compatibility) */}
      {activeBatchId && (
        <BatchProgressMonitor
          batchId={activeBatchId}
          onComplete={handleBatchComplete}
          onCancel={handleBatchCancel}
        />
      )}
    </div>
  );
}
