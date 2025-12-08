"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
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
  startOfWeek,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { BatchProgressMonitor } from "./batch-progress-monitor";
import type { BatchEligibleCase } from "~/types/dashboard";
import { cn } from "~/lib/utils";

type DateFilter = "today" | "yesterday" | "day-2" | "day-3" | "day-4";

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

type Step = "select" | "schedule" | "review";

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

  // Mutations
  const createBatchMutation = api.cases.createDischargeBatch.useMutation({
    onSuccess: async (result) => {
      setActiveBatchId(result.batchId);
      setIsProcessing(true);

      try {
        const response = await fetch("/api/discharge/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batchId: result.batchId,
            emailScheduleTime: emailScheduleTime?.toISOString(),
            callScheduleTime: callScheduleTime?.toISOString(),
          }),
        });

        if (!response.ok) throw new Error("Failed to process batch");

        const data = await response.json();
        toast.success(
          `Batch complete: ${data.successCount} successful, ${data.failedCount} failed`,
        );
      } catch {
        toast.error("Failed to process batch");
      } finally {
        setIsProcessing(false);
        void refetchCases();
      }
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to create batch");
      setIsProcessing(false);
    },
  });

  // Handlers
  const handleSelectAll = () => {
    if (selectedCases.size === filteredCases.length) {
      setSelectedCases(new Set());
    } else {
      setSelectedCases(new Set(filteredCases.map((c) => c.id)));
    }
  };

  const handleSelectCase = (caseId: string) => {
    const newSelected = new Set(selectedCases);
    if (newSelected.has(caseId)) {
      newSelected.delete(caseId);
    } else {
      newSelected.add(caseId);
    }
    setSelectedCases(newSelected);
  };

  const handleScheduleDischarges = () => {
    if (selectedCases.size === 0) {
      toast.error("Please select at least one case");
      return;
    }

    if (!emailsEnabled && !callsEnabled) {
      toast.error("Please enable at least one communication type");
      return;
    }

    if (emailsEnabled && !emailScheduleTime) {
      toast.error("Please configure email schedule time");
      return;
    }

    if (callsEnabled && !callScheduleTime) {
      toast.error("Please configure call schedule time");
      return;
    }

    const caseIds = Array.from(selectedCases);
    createBatchMutation.mutate({
      caseIds,
      emailScheduleTime:
        emailsEnabled && emailScheduleTime
          ? emailScheduleTime.toISOString()
          : null,
      callScheduleTime:
        callsEnabled && callScheduleTime
          ? callScheduleTime.toISOString()
          : null,
      emailsEnabled,
      callsEnabled,
    });
  };

  const handleBatchComplete = () => {
    setActiveBatchId(null);
    setIsProcessing(false);
    setSelectedCases(new Set());
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

  // Step progress
  const stepProgress =
    currentStep === "select" ? 33 : currentStep === "schedule" ? 66 : 100;

  // Can proceed to next step
  const canProceedToSchedule = selectedCases.size > 0;
  // At least one communication type must be enabled with valid schedule
  const canProceedToReview =
    (emailsEnabled || callsEnabled) &&
    (!emailsEnabled || emailScheduleTime) &&
    (!callsEnabled || callScheduleTime);

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
                    : 3}{" "}
                of 3
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

                      {/* Case List */}
                      <ScrollArea className="h-[400px]">
                        <div className="divide-y">
                          {filteredCases.map((caseData) => (
                            <div
                              key={caseData.id}
                              className={cn(
                                "flex items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50/50",
                                selectedCases.has(caseData.id) &&
                                  "bg-emerald-50/30",
                              )}
                            >
                              <Checkbox
                                checked={selectedCases.has(caseData.id)}
                                onCheckedChange={() =>
                                  handleSelectCase(caseData.id)
                                }
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
                                    caseData.source === "idexx_extension") && (
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
                              </div>
                            </div>
                          ))}
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
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Date</label>
                          <div className="relative">
                            <Calendar className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                              type="date"
                              className="pl-10"
                              value={emailDateValue}
                              min={minDate}
                              onChange={(e) => updateEmailDate(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Time</label>
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
                              <strong>{selectedCasesWithEmail}</strong> emails
                              scheduled for{" "}
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
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Date</label>
                          <div className="relative">
                            <Calendar className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                              type="date"
                              className="pl-10"
                              value={callDateValue}
                              min={minDate}
                              onChange={(e) => updateCallDate(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Time</label>
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
                              <strong>{selectedCasesWithPhone}</strong> calls
                              scheduled for{" "}
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
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              Disabled
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Cases Preview */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Selected Cases</h4>
                    <ScrollArea className="h-48 rounded-lg border">
                      <div className="divide-y p-2">
                        {selectedCasesData.slice(0, 10).map((caseData) => (
                          <div
                            key={caseData.id}
                            className="flex items-center justify-between px-2 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {caseData.patientName}
                              </span>
                              <span className="text-muted-foreground text-sm">
                                — {caseData.ownerName}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              {caseData.hasEmail && (
                                <Mail className="h-3.5 w-3.5 text-blue-500" />
                              )}
                              {caseData.hasPhone && (
                                <Phone className="h-3.5 w-3.5 text-green-500" />
                              )}
                            </div>
                          </div>
                        ))}
                        {selectedCasesData.length > 10 && (
                          <div className="text-muted-foreground px-2 py-2 text-center text-sm">
                            +{selectedCasesData.length - 10} more cases
                          </div>
                        )}
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
                    onClick={handleScheduleDischarges}
                    disabled={isProcessing || createBatchMutation.isPending}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isProcessing || createBatchMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Schedule {selectedCases.size} Discharges
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Batch Progress Monitor */}
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
