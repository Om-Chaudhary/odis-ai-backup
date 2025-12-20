"use client";

import { useState, useEffect } from "react";
import { addDays, setHours, setMinutes, setSeconds } from "date-fns";
import type { Step, ScheduleMode } from "../types";

interface DischargeSettings {
  emailDelayDays?: number;
  callDelayDays?: number;
  preferredEmailStartTime?: string;
  preferredCallStartTime?: string;
}

export function useBatchState(settings?: DischargeSettings) {
  const [currentStep, setCurrentStep] = useState<Step>("select");
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [emailScheduleTime, setEmailScheduleTime] = useState<Date | null>(null);
  const [callScheduleTime, setCallScheduleTime] = useState<Date | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Communication type toggles
  const [emailsEnabled, setEmailsEnabled] = useState(true);
  const [callsEnabled, setCallsEnabled] = useState(true);

  // Schedule mode: "datetime" for specific date/time, "minutes" for minutes from now
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
    Map<string, "pending" | "processing" | "success" | "failed" | "skipped">
  >(new Map());
  const [processingErrors, setProcessingErrors] = useState<Map<string, string>>(
    new Map(),
  );
  const [finalResults, setFinalResults] = useState<
    Array<{
      id: string;
      patientName: string;
      status: "pending" | "processing" | "success" | "failed" | "skipped";
      error?: string;
    }>
  >([]);

  // Initialize schedule times when settings load
  useEffect(() => {
    if (settings && !emailScheduleTime && !callScheduleTime) {
      const now = new Date();
      const emailDelayDays = settings.emailDelayDays ?? 1;
      const callDelayDays = settings.callDelayDays ?? 2;
      const emailStartTime = settings.preferredEmailStartTime ?? "09:00";
      const callStartTime = settings.preferredCallStartTime ?? "14:00";

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
  }, [settings, emailScheduleTime, callScheduleTime]);

  const resetToDefaults = () => {
    if (!settings) return;
    const now = new Date();
    const emailDelayDays = settings.emailDelayDays ?? 1;
    const callDelayDays = settings.callDelayDays ?? 2;
    const emailStartTime = settings.preferredEmailStartTime ?? "09:00";
    const callStartTime = settings.preferredCallStartTime ?? "14:00";

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

  return {
    // State
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

    // Setters
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

    // Actions
    resetToDefaults,
  };
}
