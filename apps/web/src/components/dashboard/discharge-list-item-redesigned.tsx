"use client";

import { useState } from "react";
import { Card, CardContent } from "@odis/ui/card";
import { Button } from "@odis/ui/button";
import { Input } from "@odis/ui/input";
import { Phone, Mail, Edit2, Save, Loader2, AlertTriangle } from "lucide-react";

/**
 * VAPI end reason to human-readable text mapping
 */
const VAPI_END_REASON_LABELS: Record<string, string> = {
  // Success outcomes
  "assistant-ended-call": "Completed",
  "customer-ended-call": "Customer hung up",
  "assistant-forwarded-call": "Transferred",

  // No contact outcomes
  "customer-did-not-answer": "No answer",
  "dial-no-answer": "No answer",
  voicemail: "Voicemail",
  "customer-busy": "Line busy",
  "dial-busy": "Line busy",
  "silence-timed-out": "No response",

  // Failure outcomes
  "dial-failed": "Dial failed",
  "assistant-error": "System error",
  "exceeded-max-duration": "Timeout",
};

/**
 * Get human-readable label for VAPI end reason
 */
function getEndReasonLabel(endedReason: string | null | undefined): string {
  if (!endedReason) return "";
  const label = VAPI_END_REASON_LABELS[endedReason.toLowerCase()];
  if (label) return label;
  // Fallback: capitalize and replace hyphens
  return endedReason
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
import type {
  DashboardCase,
  PatientUpdateInput,
  DischargeSettings,
} from "~/types/dashboard";
import { cn } from "@odis/utils";
import {
  isPlaceholder,
  hasValidContact,
  getEffectiveContact,
} from "@odis/utils/dashboard-helpers";
import { Badge } from "@odis/ui/badge";

/**
 * Workflow status for a discharge case
 * - ready: Case has valid contact info and no discharge initiated
 * - in_progress: Discharge call/email is currently queued, ringing, or in progress
 * - completed: Discharge call completed or email sent, or case marked as completed
 * - failed: Discharge call or email failed
 */
type WorkflowStatus = "completed" | "in_progress" | "failed" | "ready";

/**
 * Determines the current workflow status of a case based on its discharge state
 */
function getCaseWorkflowStatus(caseData: DashboardCase): WorkflowStatus {
  // Check for in-progress calls/emails
  const hasActiveCall = caseData.scheduled_discharge_calls.some((c) =>
    ["queued", "ringing", "in_progress"].includes(c.status ?? ""),
  );
  const hasActiveEmail = caseData.scheduled_discharge_emails.some((e) =>
    ["queued"].includes(e.status ?? ""),
  );

  if (hasActiveCall || hasActiveEmail) return "in_progress";

  // Check for completion - only consider discharge communications
  const hasCompletedCall = caseData.scheduled_discharge_calls.some(
    (c) => c.status === "completed",
  );
  const hasSentEmail = caseData.scheduled_discharge_emails.some(
    (e) => e.status === "sent",
  );
  if (hasCompletedCall || hasSentEmail) return "completed";

  // Check for failures
  const hasFailedCall = caseData.scheduled_discharge_calls.some(
    (c) => c.status === "failed",
  );
  const hasFailedEmail = caseData.scheduled_discharge_emails.some(
    (e) => e.status === "failed",
  );

  if (hasFailedCall || hasFailedEmail) return "failed";

  return "ready";
}

/**
 * Returns the display text for a workflow status
 */
function getStatusText(status: WorkflowStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In Progress";
    case "failed":
      return "Failed";
    case "ready":
    default:
      return "Ready";
  }
}

interface DischargeListItemRedesignedProps {
  /** The case data to display */
  caseData: DashboardCase;
  /** Discharge settings (optional, currently unused but kept for compatibility) */
  settings?: DischargeSettings;
  /** Callback to trigger a discharge call for this case */
  onTriggerCall: (id: string) => void;
  /** Callback to trigger a discharge email for this case */
  onTriggerEmail: (id: string) => void;
  /** Callback to update patient information */
  onUpdatePatient: (patientId: string, data: PatientUpdateInput) => void;
  /** Whether test mode is enabled (uses test contacts instead of patient contacts) */
  testModeEnabled?: boolean;
  /** Test contact name (used when test mode is enabled) */
  testContactName?: string;
  /** Test contact email (used when test mode is enabled) */
  testContactEmail?: string;
  /** Test contact phone (used when test mode is enabled) */
  testContactPhone?: string;
  /** Whether a call is currently being triggered for this case */
  isLoadingCall?: boolean;
  /** Whether an email is currently being sent for this case */
  isLoadingEmail?: boolean;
  /** Whether patient information is currently being updated */
  isLoadingUpdate?: boolean;
}

/**
 * DischargeListItemRedesigned - Production-ready case item with professional layout
 *
 * Features a clean, medical dashboard-appropriate design with:
 * - Left Column: Pet name (large, bold), Owner name, Phone & Email
 * - Right Column: Call/Email buttons with status badges underneath
 * - Clickable card surface for viewing details
 * - Conditional "Not Ready" badge only when actually not ready
 * - Enhanced typography and spacing for veterinary professionals
 */
export function DischargeListItemRedesigned({
  caseData,
  settings: _settings,
  onTriggerCall,
  onTriggerEmail,
  onUpdatePatient,
  testModeEnabled = false,
  testContactName = "",
  testContactEmail = "",
  testContactPhone = "",
  isLoadingCall = false,
  isLoadingEmail = false,
  isLoadingUpdate = false,
}: DischargeListItemRedesignedProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    owner_name: caseData.patient.owner_name,
    owner_email: caseData.patient.owner_email,
    owner_phone: caseData.patient.owner_phone,
  });

  const workflowStatus = getCaseWorkflowStatus(caseData);

  // Get latest call end reason for display
  const latestCompletedCall = caseData.scheduled_discharge_calls
    ?.filter((call) => call.status === "completed")
    ?.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];

  const callEndReason = latestCompletedCall?.ended_reason;
  const endReasonLabel = getEndReasonLabel(callEndReason);

  // Get effective contact values
  const effectivePhone = getEffectiveContact(
    caseData.patient.owner_phone,
    testContactPhone,
    testModeEnabled,
  );
  const effectiveEmail = getEffectiveContact(
    caseData.patient.owner_email,
    testContactEmail,
    testModeEnabled,
  );

  // --- Handlers ---

  const handleStartEdit = () => {
    if (testModeEnabled) {
      setEditForm({
        owner_name: testContactName || caseData.patient.owner_name,
        owner_email: testContactEmail || caseData.patient.owner_email,
        owner_phone: testContactPhone || caseData.patient.owner_phone,
      });
    } else {
      setEditForm({
        owner_name: caseData.patient.owner_name,
        owner_email: caseData.patient.owner_email,
        owner_phone: caseData.patient.owner_phone,
      });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdatePatient(caseData.patient.id, {
      id: caseData.patient.id,
      owner_name: editForm.owner_name,
      owner_email: editForm.owner_email,
      owner_phone: editForm.owner_phone,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      owner_name: caseData.patient.owner_name,
      owner_email: caseData.patient.owner_email,
      owner_phone: caseData.patient.owner_phone,
    });
    setIsEditing(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when clicking on buttons or inputs
    if (
      e.target instanceof HTMLButtonElement ||
      e.target instanceof HTMLInputElement ||
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("input")
    ) {
      return;
    }

    // Navigate to details page
    window.location.href = `/dashboard/discharges/${caseData.id}`;
  };

  // Render action buttons
  const renderActionButtons = () => {
    const canCall = hasValidContact(effectivePhone);
    const canEmail = hasValidContact(effectiveEmail);
    const isReady = caseData.is_ready_for_discharge;

    return (
      <div className="flex flex-col gap-3">
        {/* Call and Email Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onTriggerCall(caseData.id);
            }}
            disabled={isLoadingCall || !canCall || !isReady}
            size="sm"
            className="flex-1 gap-1.5 bg-teal-600 transition-colors hover:bg-teal-700"
          >
            {isLoadingCall ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
            Call
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onTriggerEmail(caseData.id);
            }}
            disabled={isLoadingEmail || !canEmail || !isReady}
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 border-teal-200 text-teal-700 transition-colors hover:bg-teal-50"
          >
            {isLoadingEmail ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Email
          </Button>
        </div>

        {/* Status Badges underneath buttons */}
        <div className="flex flex-col items-end gap-1.5">
          {/* Workflow Status Badge - More Prominent */}
          <Badge
            variant="outline"
            className={cn(
              "border-2 px-3 py-1.5 text-sm font-semibold",
              workflowStatus === "completed"
                ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                : workflowStatus === "failed"
                  ? "border-red-300 bg-red-100 text-red-800"
                  : workflowStatus === "in_progress"
                    ? "border-blue-300 bg-blue-100 text-blue-800"
                    : "border-amber-300 bg-amber-100 text-amber-800",
            )}
          >
            {getStatusText(workflowStatus)}
          </Badge>

          {/* Test Mode Badge */}
          {testModeEnabled && (
            <Badge
              variant="outline"
              className="border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600"
            >
              Test
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md",
        "relative overflow-hidden rounded-xl",
        // Subtle left border for status indication
        workflowStatus === "completed"
          ? "border-l-4 border-l-emerald-500"
          : workflowStatus === "failed"
            ? "border-l-4 border-l-red-500"
            : workflowStatus === "in_progress"
              ? "border-l-4 border-l-blue-500"
              : "border-l-4 border-l-amber-500",
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          {/* Left Column: Patient Information */}
          <div className="min-w-0 flex-1">
            {!isEditing ? (
              <>
                {/* Pet Name - Large and Bold */}
                <div className="mb-2 flex items-center gap-2">
                  <h3
                    className={cn(
                      "truncate text-xl font-bold text-slate-900",
                      isPlaceholder(caseData.patient.name) &&
                        "text-amber-600 italic",
                    )}
                  >
                    {caseData.patient.name}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full text-slate-400 transition-colors hover:text-teal-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit();
                    }}
                    disabled={isLoadingUpdate}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Edit patient info</span>
                  </Button>
                </div>

                {/* Owner Name */}
                <div className="mb-3 text-base font-medium text-slate-700">
                  {caseData.patient.owner_name}
                </div>

                {/* Phone Number and Email Row */}
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span
                      className={cn(
                        hasValidContact(effectivePhone)
                          ? "text-slate-600"
                          : "text-slate-400",
                      )}
                    >
                      {effectivePhone ?? "No phone"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span
                      className={cn(
                        hasValidContact(effectiveEmail)
                          ? "text-slate-600"
                          : "text-slate-400",
                      )}
                    >
                      {effectiveEmail ?? "No email"}
                    </span>
                  </div>

                  {/* Not Ready Badge - ONLY show when actually not ready */}
                  {!caseData.is_ready_for_discharge && (
                    <div className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">
                        Not Ready
                      </span>
                    </div>
                  )}
                </div>

                {/* Call End Reason */}
                {endReasonLabel && (
                  <div className="mt-3 text-xs font-medium text-slate-600">
                    Last call: {endReasonLabel}
                  </div>
                )}
              </>
            ) : (
              /* Editing Mode */
              <div className="space-y-3">
                <Input
                  className="border-teal-200 bg-white text-lg font-bold focus:border-teal-500"
                  value={editForm.owner_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, owner_name: e.target.value })
                  }
                  placeholder="Owner Name"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    className="border-teal-200 bg-white focus:border-teal-500"
                    value={editForm.owner_phone}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        owner_phone: e.target.value,
                      })
                    }
                    placeholder="Phone"
                  />
                  <Input
                    className="border-teal-200 bg-white focus:border-teal-500"
                    value={editForm.owner_email}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        owner_email: e.target.value,
                      })
                    }
                    placeholder="Email"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel();
                    }}
                    disabled={isLoadingUpdate}
                    className="text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave();
                    }}
                    disabled={isLoadingUpdate}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {isLoadingUpdate ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-3 w-3" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Actions and Status */}
          <div className="shrink-0">{renderActionButtons()}</div>
        </div>
      </CardContent>
    </Card>
  );
}
