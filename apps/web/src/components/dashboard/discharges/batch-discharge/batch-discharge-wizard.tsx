"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Separator } from "@odis-ai/shared/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@odis-ai/shared/ui/tabs";
import {
  ArrowLeft,
  TestTube,
  Users,
  Calendar,
  CheckCheck,
  AlertTriangle,
  Mail,
  Phone,
} from "lucide-react";
import { api } from "~/trpc/client";
import { toast } from "sonner";
import { addDays } from "date-fns";
import { BatchProgressMonitor } from "../batch-progress-monitor";
import { useBatchState, useBatchProcessing, useBatchFilters } from "./hooks";
import {
  SelectCasesStep,
  ScheduleStep,
  ReviewStep,
  ProcessingStep,
  CompleteStep,
} from "./steps";
import { StepProgress } from "./components";
import type { BatchEligibleCase } from "@odis-ai/shared/types";

export function BatchDischargeWizard() {
  const router = useRouter();

  // Queries
  const {
    data: eligibleCasesData,
    isLoading: isLoadingCases,
    refetch: refetchCases,
  } = api.cases.getEligibleCasesForBatch.useQuery();

  const { data: settingsData } = api.cases.getDischargeSettings.useQuery();

  // State management
  const batchState = useBatchState(settingsData);
  const {
    currentStep,
    selectedCases,
    emailScheduleTime,
    callScheduleTime,
    activeBatchId,
    isProcessing,
    emailsEnabled,
    callsEnabled,
    emailScheduleMode,
    callScheduleMode,
    emailMinutesFromNow,
    callMinutesFromNow,
    skippedCases,
    processingResults,
    processingErrors,
    finalResults,
    setCurrentStep,
    setSelectedCases,
    setEmailScheduleTime,
    setCallScheduleTime,
    setActiveBatchId,
    setIsProcessing,
    setEmailsEnabled,
    setCallsEnabled,
    setEmailScheduleMode,
    setCallScheduleMode,
    setEmailMinutesFromNow,
    setCallMinutesFromNow,
    setSkippedCases,
    setProcessingResults,
    setProcessingErrors,
    setFinalResults,
    resetToDefaults,
  } = batchState;

  // Transform eligible cases
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

  // Filters
  const filters = useBatchFilters(eligibleCases);
  const {
    filteredCases,
    dateFilter,
    searchQuery,
    dateCounts,
    dayLabels,
    setDateFilter,
    setSearchQuery,
  } = filters;

  // Get selectable cases (have required contact info)
  const selectableCases = useMemo(() => {
    return filteredCases.filter((c) => {
      if (emailsEnabled && callsEnabled) {
        return c.hasEmail || c.hasPhone;
      } else if (emailsEnabled) {
        return c.hasEmail;
      } else if (callsEnabled) {
        return c.hasPhone;
      }
      return false;
    });
  }, [filteredCases, emailsEnabled, callsEnabled]);

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

  // Mutations
  const triggerDischargeMutation = api.cases.triggerDischarge.useMutation();

  // Processing hook
  const { handleStartProcessing } = useBatchProcessing(
    triggerDischargeMutation,
    {
      onStatusUpdate: (caseId, status) => {
        setProcessingResults((prev) => new Map(prev).set(caseId, status));
      },
      onError: (caseId, error) => {
        setProcessingErrors((prev) => new Map(prev).set(caseId, error));
      },
    },
  );

  // Handlers
  const handleSelectCase = (caseId: string) => {
    const caseData = filteredCases.find((c) => c.id === caseId);
    if (!caseData) return;

    const isSelectable =
      emailsEnabled && callsEnabled
        ? caseData.hasEmail || caseData.hasPhone
        : emailsEnabled
          ? caseData.hasEmail
          : callsEnabled
            ? caseData.hasPhone
            : false;

    if (!isSelectable) return;

    const newSelected = new Set(selectedCases);
    if (newSelected.has(caseId)) {
      newSelected.delete(caseId);
    } else {
      newSelected.add(caseId);
    }
    setSelectedCases(newSelected);
  };

  const handleSelectAll = () => {
    if (
      selectedCases.size === selectableCases.length &&
      selectableCases.length > 0
    ) {
      setSelectedCases(new Set());
    } else {
      setSelectedCases(new Set(selectableCases.map((c) => c.id)));
    }
  };

  const handleToggleSkip = (caseId: string) => {
    const newSkipped = new Set(skippedCases);
    if (newSkipped.has(caseId)) {
      newSkipped.delete(caseId);
    } else {
      newSkipped.add(caseId);
    }
    setSkippedCases(newSkipped);
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

  const startProcessing = () => {
    // Initialize processing state
    const initialResults = new Map<
      string,
      "pending" | "processing" | "success" | "failed" | "skipped"
    >();
    selectedCasesData.forEach((c) => {
      initialResults.set(c.id, skippedCases.has(c.id) ? "skipped" : "pending");
    });
    setProcessingResults(initialResults);
    setProcessingErrors(new Map());
    setFinalResults([]);
    setCurrentStep("processing");
    setIsProcessing(true);

    void handleStartProcessing({
      selectedCases,
      eligibleCases,
      skippedCases,
      emailsEnabled,
      callsEnabled,
      emailScheduleMode,
      callScheduleMode,
      emailScheduleTime,
      callScheduleTime,
      emailMinutesFromNow,
      callMinutesFromNow,
      onBeforeStart: () => {
        // Initialization handled by parent
      },
      onComplete: (results) => {
        setFinalResults(results);
        setCurrentStep("complete");
        setIsProcessing(false);
      },
    });
  };

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
            <StepProgress currentStep={currentStep} />
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
            onValueChange={(v) => setCurrentStep(v as typeof currentStep)}
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
                disabled={selectedCases.size === 0}
                className="gap-2 data-[state=active]:bg-white"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Configure Schedule</span>
                <span className="sm:hidden">Schedule</span>
              </TabsTrigger>
              <TabsTrigger
                value="review"
                disabled={selectedCases.size === 0}
                className="gap-2 data-[state=active]:bg-white"
              >
                <CheckCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Review & Send</span>
                <span className="sm:hidden">Review</span>
              </TabsTrigger>
            </TabsList>

            {/* Step 1: Select Cases */}
            <TabsContent value="select">
              <SelectCasesStep
                filteredCases={filteredCases}
                selectableCases={selectableCases}
                selectedCases={selectedCases}
                dateFilter={dateFilter}
                searchQuery={searchQuery}
                dateCounts={dateCounts}
                dayLabels={dayLabels}
                emailsEnabled={emailsEnabled}
                callsEnabled={callsEnabled}
                isLoading={isLoadingCases}
                onSelectCase={handleSelectCase}
                onSelectAll={handleSelectAll}
                onDateFilterChange={setDateFilter}
                onSearchChange={setSearchQuery}
                onNext={() => setCurrentStep("schedule")}
              />
            </TabsContent>

            {/* Step 2: Configure Schedule */}
            <TabsContent value="schedule">
              <ScheduleStep
                emailsEnabled={emailsEnabled}
                callsEnabled={callsEnabled}
                emailScheduleMode={emailScheduleMode}
                callScheduleMode={callScheduleMode}
                emailScheduleTime={emailScheduleTime}
                callScheduleTime={callScheduleTime}
                emailMinutesFromNow={emailMinutesFromNow}
                callMinutesFromNow={callMinutesFromNow}
                selectedCasesWithEmail={selectedCasesWithEmail}
                selectedCasesWithPhone={selectedCasesWithPhone}
                onEmailsEnabledChange={setEmailsEnabled}
                onCallsEnabledChange={setCallsEnabled}
                onEmailScheduleModeChange={setEmailScheduleMode}
                onCallScheduleModeChange={setCallScheduleMode}
                onEmailDateChange={updateEmailDate}
                onCallDateChange={updateCallDate}
                onEmailTimeChange={updateEmailTime}
                onCallTimeChange={updateCallTime}
                onEmailMinutesChange={setEmailMinutesFromNow}
                onCallMinutesChange={setCallMinutesFromNow}
                onResetToDefaults={resetToDefaults}
                onBack={() => setCurrentStep("select")}
                onNext={() => setCurrentStep("review")}
              />
            </TabsContent>

            {/* Step 3: Review & Send */}
            <TabsContent value="review">
              <ReviewStep
                selectedCases={selectedCases}
                skippedCases={skippedCases}
                selectedCasesData={selectedCasesData}
                emailsEnabled={emailsEnabled}
                callsEnabled={callsEnabled}
                emailScheduleMode={emailScheduleMode}
                callScheduleMode={callScheduleMode}
                emailScheduleTime={emailScheduleTime}
                callScheduleTime={callScheduleTime}
                emailMinutesFromNow={emailMinutesFromNow}
                callMinutesFromNow={callMinutesFromNow}
                selectedCasesWithEmail={selectedCasesWithEmail}
                selectedCasesWithPhone={selectedCasesWithPhone}
                testModeEnabled={testModeEnabled}
                testContactEmail={testContactEmail}
                testContactPhone={testContactPhone}
                isProcessing={isProcessing}
                onToggleSkip={handleToggleSkip}
                onClearSkips={() => setSkippedCases(new Set())}
                onBack={() => setCurrentStep("schedule")}
                onProcess={startProcessing}
              />
            </TabsContent>

            {/* Step 4: Processing */}
            <TabsContent value="processing">
              <ProcessingStep
                processingResults={processingResults}
                processingErrors={processingErrors}
                eligibleCases={eligibleCases}
              />
            </TabsContent>

            {/* Step 5: Complete */}
            <TabsContent value="complete">
              <CompleteStep
                finalResults={finalResults}
                onStartNewBatch={handleBatchComplete}
              />
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
