"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import {
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Calendar,
  Clock,
  Zap,
  Loader2,
} from "lucide-react";
import { getFailureReason } from "../../shared/utils";

interface ScheduledCallData {
  id: string;
  status: string;
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  endedReason: string | null;
  transcript: string | null;
  summary: string | null;
  customerPhone: string | null;
  structuredData?: { urgent_case?: boolean; [key: string]: unknown } | null;
  urgentReasonSummary?: string | null;
  recordingUrl?: string | null;
  stereoRecordingUrl?: string | null;
}

interface CaseData {
  emailSent: "sent" | "pending" | "failed" | "not_applicable" | null;
  phoneSent: "sent" | "pending" | "failed" | "not_applicable" | null;
  owner: {
    email: string | null;
    phone: string | null;
  };
}

interface DeliveryCompleteCardProps {
  status: "completed" | "failed";
  scheduledCall: ScheduledCallData | null;
  caseData: CaseData;
  onScheduleRemaining?: (options: {
    scheduleCall: boolean;
    scheduleEmail: boolean;
    immediateDelivery: boolean;
  }) => void;
  isScheduling?: boolean;
}

// Generate delivery summary
function getDeliverySummary(
  status: "completed" | "failed",
  call: ScheduledCallData | null,
  emailStatus: "sent" | "pending" | "failed" | "not_applicable" | null,
): string {
  if (status === "failed") {
    const failureInfo = getFailureReason(
      call?.endedReason,
      emailStatus === "failed",
    );
    return failureInfo.detail;
  }

  if (call?.summary) {
    return call.summary;
  }

  if (call?.transcript) {
    const transcript = call.transcript;
    if (transcript.length > 200) {
      const sentences = transcript
        .split(".")
        .filter((s) => s.trim().length > 0);
      const firstSentence = sentences[0]?.trim() + ".";
      return `${firstSentence} Call completed successfully.`;
    }
    return "Call completed successfully with owner. Discharge instructions provided.";
  }

  return "Communications were delivered successfully.";
}

/**
 * Delivery Complete Card for sent cases
 * Shows delivery status and allows scheduling remaining outreach for partial cases
 */
export function DeliveryCompleteCard({
  status,
  scheduledCall,
  caseData,
  onScheduleRemaining,
  isScheduling,
}: DeliveryCompleteCardProps) {
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);
  const [immediateDelivery, setImmediateDelivery] = useState(false);
  const call = scheduledCall;
  const isCompleted = status === "completed";

  // Determine actual delivery status from case data
  const emailStatus = caseData.emailSent;
  const phoneStatus = caseData.phoneSent;
  const hasOwnerEmail = Boolean(caseData.owner.email);
  const hasOwnerPhone = Boolean(caseData.owner.phone);

  // Detect partial outreach - one method sent, other can still be scheduled
  const emailSent = emailStatus === "sent";
  const phoneSent = phoneStatus === "sent";
  const canScheduleCall =
    !phoneSent && hasOwnerPhone && phoneStatus !== "pending";
  const canScheduleEmail =
    !emailSent && hasOwnerEmail && emailStatus !== "pending";
  const hasPartialOutreach =
    (emailSent || phoneSent) && (canScheduleCall || canScheduleEmail);

  return (
    <Card
      className={
        status === "failed"
          ? "border-red-500/20 bg-red-500/5"
          : "border-emerald-500/20 bg-emerald-500/5"
      }
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          {isCompleted ? "Delivery Complete" : "Delivery Failed"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === "failed" ? (
          <>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {
                getFailureReason(call?.endedReason, emailStatus === "failed")
                  .short
              }
            </p>
            <p className="text-sm text-red-600/80 dark:text-red-400/80">
              {getDeliverySummary(status, call, emailStatus)}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              {getDeliverySummary(status, call, emailStatus)}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Phone Call status */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    phoneStatus === "sent"
                      ? "bg-emerald-100"
                      : phoneStatus === "failed"
                        ? "bg-red-100"
                        : !hasOwnerPhone
                          ? "bg-slate-100"
                          : "bg-slate-100"
                  }`}
                >
                  <Phone
                    className={`h-4 w-4 ${
                      phoneStatus === "sent"
                        ? "text-emerald-600"
                        : phoneStatus === "failed"
                          ? "text-red-600"
                          : "text-slate-500"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Phone Call</p>
                  <p
                    className={`text-xs ${
                      phoneStatus === "sent"
                        ? "text-emerald-600"
                        : phoneStatus === "failed"
                          ? "text-red-600"
                          : "text-slate-500"
                    }`}
                  >
                    {phoneStatus === "sent" && call?.durationSeconds
                      ? `${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s`
                      : phoneStatus === "sent"
                        ? "Completed"
                        : phoneStatus === "failed"
                          ? "Failed"
                          : !hasOwnerPhone
                            ? "No phone available"
                            : phoneStatus === "not_applicable"
                              ? "Not applicable"
                              : "Not sent"}
                  </p>
                </div>
              </div>

              {/* Email status */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    emailStatus === "sent"
                      ? "bg-emerald-100"
                      : emailStatus === "failed"
                        ? "bg-red-100"
                        : !hasOwnerEmail
                          ? "bg-slate-100"
                          : "bg-slate-100"
                  }`}
                >
                  <Mail
                    className={`h-4 w-4 ${
                      emailStatus === "sent"
                        ? "text-emerald-600"
                        : emailStatus === "failed"
                          ? "text-red-600"
                          : "text-slate-500"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p
                    className={`text-xs ${
                      emailStatus === "sent"
                        ? "text-emerald-600"
                        : emailStatus === "failed"
                          ? "text-red-600"
                          : !hasOwnerEmail
                            ? "text-slate-500"
                            : "text-slate-500"
                    }`}
                  >
                    {emailStatus === "sent"
                      ? "Sent"
                      : emailStatus === "failed"
                        ? "Failed"
                        : !hasOwnerEmail
                          ? "No email available"
                          : emailStatus === "not_applicable"
                            ? "Not applicable"
                            : "Not sent"}
                  </p>
                </div>
              </div>
            </div>

            {/* Schedule Remaining Outreach Section */}
            {hasPartialOutreach && onScheduleRemaining && (
              <div className="mt-4 border-t border-emerald-200/50 pt-4">
                {!showScheduleOptions ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => setShowScheduleOptions(true)}
                  >
                    {canScheduleCall && canScheduleEmail ? (
                      <>
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Remaining Outreach
                      </>
                    ) : canScheduleCall ? (
                      <>
                        <Phone className="mr-2 h-4 w-4" />
                        Schedule Phone Call
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Schedule Email
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      Schedule{" "}
                      {canScheduleCall && canScheduleEmail
                        ? "Remaining"
                        : canScheduleCall
                          ? "Call"
                          : "Email"}
                    </p>

                    {/* Delivery Method Selection */}
                    {canScheduleCall && canScheduleEmail && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2">
                          <Phone className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm">Call</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2">
                          <Mail className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm">Email</span>
                        </div>
                      </div>
                    )}

                    {/* Timing Selection */}
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        htmlFor="schedule-remaining-scheduled"
                        className={`relative flex cursor-pointer items-center gap-2 rounded-lg border-2 p-2.5 transition-all ${
                          !immediateDelivery
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          id="schedule-remaining-scheduled"
                          name="schedule-remaining-timing"
                          checked={!immediateDelivery}
                          onChange={() => setImmediateDelivery(false)}
                          className="sr-only"
                        />
                        <Clock
                          className={`h-4 w-4 ${!immediateDelivery ? "text-emerald-600" : "text-slate-400"}`}
                        />
                        <div>
                          <span className="text-sm font-medium">Scheduled</span>
                          <p className="text-muted-foreground text-xs">
                            Use delay settings
                          </p>
                        </div>
                      </label>

                      <label
                        htmlFor="schedule-remaining-immediate"
                        className={`relative flex cursor-pointer items-center gap-2 rounded-lg border-2 p-2.5 transition-all ${
                          immediateDelivery
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          id="schedule-remaining-immediate"
                          name="schedule-remaining-timing"
                          checked={immediateDelivery}
                          onChange={() => setImmediateDelivery(true)}
                          className="sr-only"
                        />
                        <Zap
                          className={`h-4 w-4 ${immediateDelivery ? "text-emerald-600" : "text-slate-400"}`}
                        />
                        <div>
                          <span className="text-sm font-medium">Immediate</span>
                          <p className="text-muted-foreground text-xs">
                            Send right away
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setShowScheduleOptions(false);
                          setImmediateDelivery(false);
                        }}
                        disabled={isScheduling}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          onScheduleRemaining?.({
                            scheduleCall: canScheduleCall,
                            scheduleEmail: canScheduleEmail,
                            immediateDelivery,
                          });
                        }}
                        disabled={isScheduling}
                      >
                        {isScheduling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Scheduling...
                          </>
                        ) : (
                          "Schedule"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
