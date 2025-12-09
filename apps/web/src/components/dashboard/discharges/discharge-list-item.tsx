"use client";

import { useState } from "react";
import { Card, CardContent } from "@odis/ui/card";
import { Button } from "@odis/ui/button";
import { Input } from "@odis/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@odis/ui/alert-dialog";
import { Phone, Mail, Edit2, Save, Loader2, AlertTriangle } from "lucide-react";
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
import { ContactIndicator } from "../shared/contact-indicator";
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
 *
 * Priority order:
 * 1. in_progress - if any call/email is active
 * 2. completed - if case is completed or has successful discharge
 * 3. failed - if any discharge attempt failed
 * 4. ready - default state when case is ready for discharge
 *
 * @param caseData - The case data to evaluate
 * @returns The current workflow status
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

  // Check for completion - only consider discharge communications, not case status
  // A "completed" case can still need discharge communications sent
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
 * Returns the Tailwind CSS border color class for a workflow status
 *
 * @param status - The workflow status
 * @returns Tailwind CSS class for the border color
 */
function getStatusBorderColor(status: WorkflowStatus) {
  switch (status) {
    case "completed":
      return "border-l-emerald-500";
    case "in_progress":
      return "border-l-blue-500";
    case "failed":
      return "border-l-red-500";
    case "ready":
    default:
      return "border-l-amber-500";
  }
}

/**
 * Individual action status type for calls and emails
 */
type ActionStatus = "scheduled" | "queued" | "in_progress" | "sent" | "failed";

/**
 * Get the current status of discharge calls for this case
 */
function getCallStatus(caseData: DashboardCase): ActionStatus {
  if (caseData.scheduled_discharge_calls.length === 0) return "scheduled";

  const latestCall = caseData.scheduled_discharge_calls[0]; // Assuming most recent first
  const status = latestCall?.status;

  if (status === "completed") return "sent";
  if (status === "failed") return "failed";
  if (status === "in_progress" || status === "ringing") return "in_progress";
  if (status === "queued") return "queued";

  return "scheduled";
}

/**
 * Get the current status of discharge emails for this case
 */
function getEmailStatus(caseData: DashboardCase): ActionStatus {
  if (caseData.scheduled_discharge_emails.length === 0) return "scheduled";

  const latestEmail = caseData.scheduled_discharge_emails[0]; // Assuming most recent first
  const status = latestEmail?.status;

  if (status === "sent") return "sent";
  if (status === "failed") return "failed";
  if (status === "queued") return "queued";

  return "scheduled";
}

/**
 * Get display text for action status
 */
function getActionStatusText(status: ActionStatus): string {
  switch (status) {
    case "scheduled":
      return "Scheduled";
    case "queued":
      return "Queued";
    case "in_progress":
      return "In Progress";
    case "sent":
      return "Sent";
    case "failed":
      return "Failed";
  }
}

/**
 * Get color classes for action status
 */
function getActionStatusColors(status: ActionStatus) {
  switch (status) {
    case "scheduled":
      return {
        bg: "bg-slate-50 hover:bg-slate-100",
        border: "border-slate-200",
        text: "text-slate-700",
        statusBg: "bg-slate-100",
        statusText: "text-slate-600",
      };
    case "queued":
      return {
        bg: "bg-amber-50 hover:bg-amber-100",
        border: "border-amber-200",
        text: "text-amber-700",
        statusBg: "bg-amber-100",
        statusText: "text-amber-600",
      };
    case "in_progress":
      return {
        bg: "bg-blue-50 hover:bg-blue-100",
        border: "border-blue-200",
        text: "text-blue-700",
        statusBg: "bg-blue-100",
        statusText: "text-blue-600",
      };
    case "sent":
      return {
        bg: "bg-emerald-50 hover:bg-emerald-100",
        border: "border-emerald-200",
        text: "text-emerald-700",
        statusBg: "bg-emerald-100",
        statusText: "text-emerald-600",
      };
    case "failed":
      return {
        bg: "bg-red-50 hover:bg-red-100",
        border: "border-red-200",
        text: "text-red-700",
        statusBg: "bg-red-100",
        statusText: "text-red-600",
      };
  }
}

interface DischargeListItemProps {
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
 * DischargeListItem - Individual case item in the discharge management list
 *
 * Displays a compact card view of a case with:
 * - Patient and owner information (editable inline)
 * - Contact indicators (phone/email) with validation
 * - Discharge status indicators (call/email status)
 * - Action buttons (Call, Email, View) based on workflow status
 * - Warning messages for missing contact information
 *
 * Supports test mode where test contacts override patient contacts for discharge operations.
 * Provides inline editing of owner information with save/cancel functionality.
 *
 * @example
 * ```tsx
 * <DischargeListItem
 *   caseData={case}
 *   onTriggerCall={(id) => handleCall(id)}
 *   onTriggerEmail={(id) => handleEmail(id)}
 *   onUpdatePatient={(patientId, data) => updatePatient(patientId, data)}
 *   testModeEnabled={false}
 * />
 * ```
 */
export function DischargeListItem({
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
}: DischargeListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    owner_name: caseData.patient.owner_name,
    owner_email: caseData.patient.owner_email,
    owner_phone: caseData.patient.owner_phone,
  });
  const [showCallConfirmation, setShowCallConfirmation] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  const workflowStatus = getCaseWorkflowStatus(caseData);

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

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const callStatus = getCallStatus(caseData);

    if (callStatus !== "scheduled") {
      setShowCallConfirmation(true);
    } else {
      onTriggerCall(caseData.id);
    }
  };

  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const emailStatus = getEmailStatus(caseData);

    if (emailStatus !== "scheduled") {
      setShowEmailConfirmation(true);
    } else {
      onTriggerEmail(caseData.id);
    }
  };

  const confirmCall = () => {
    setShowCallConfirmation(false);
    onTriggerCall(caseData.id);
  };

  const confirmEmail = () => {
    setShowEmailConfirmation(false);
    onTriggerEmail(caseData.id);
  };

  // Render combined status/action buttons (stacked vertically)
  const renderActionStatusButtons = () => {
    const canCall = hasValidContact(effectivePhone);
    const canEmail = hasValidContact(effectiveEmail);
    const isReady = caseData.is_ready_for_discharge;

    const callStatus = getCallStatus(caseData);
    const emailStatus = getEmailStatus(caseData);

    const callColors = getActionStatusColors(callStatus);
    const emailColors = getActionStatusColors(emailStatus);

    // Determine tooltip messages
    const callTooltip = !isReady
      ? `Missing: ${caseData.missing_requirements.join(", ")}`
      : !canCall
        ? "Valid phone number required"
        : testModeEnabled
          ? `Test call to ${testContactPhone}`
          : "Start discharge call";

    const emailTooltip = !isReady
      ? `Missing: ${caseData.missing_requirements.join(", ")}`
      : !canEmail
        ? "Valid email address required"
        : testModeEnabled
          ? `Test email to ${testContactEmail}`
          : "Send discharge email";

    return (
      <div className="flex flex-col gap-1.5">
        {/* Call Button */}
        <button
          onClick={handleCallClick}
          disabled={isLoadingCall || !canCall || !isReady}
          className={cn(
            "flex min-w-32 items-center overflow-hidden rounded-lg border transition-all duration-200",
            callColors.border,
            callColors.bg,
            isLoadingCall || !canCall || !isReady
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:shadow-sm",
          )}
          title={callTooltip}
        >
          {/* Status section */}
          <div
            className={cn(
              "border-r px-3 py-2 text-xs font-medium",
              callColors.statusBg,
              callColors.statusText,
              callColors.border,
            )}
          >
            {getActionStatusText(callStatus)}
          </div>

          {/* Action section */}
          <div
            className={cn(
              "flex flex-1 items-center gap-1.5 px-3 py-2",
              callColors.text,
            )}
          >
            {isLoadingCall ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">Call</span>
          </div>
        </button>

        {/* Email Button */}
        <button
          onClick={handleEmailClick}
          disabled={isLoadingEmail || !canEmail || !isReady}
          className={cn(
            "flex min-w-32 items-center overflow-hidden rounded-lg border transition-all duration-200",
            emailColors.border,
            emailColors.bg,
            isLoadingEmail || !canEmail || !isReady
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:shadow-sm",
          )}
          title={emailTooltip}
        >
          {/* Status section */}
          <div
            className={cn(
              "border-r px-3 py-2 text-xs font-medium",
              emailColors.statusBg,
              emailColors.statusText,
              emailColors.border,
            )}
          >
            {getActionStatusText(emailStatus)}
          </div>

          {/* Action section */}
          <div
            className={cn(
              "flex flex-1 items-center gap-1.5 px-3 py-2",
              emailColors.text,
            )}
          >
            {isLoadingEmail ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">Email</span>
          </div>
        </button>
      </div>
    );
  };

  return (
    <>
      <Card
        className={cn(
          "group transition-smooth relative cursor-pointer overflow-hidden rounded-lg border border-l-4 border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md",
          getStatusBorderColor(workflowStatus),
          // Muted styling for non-ready cases
          !caseData.is_ready_for_discharge &&
            "border-slate-100 bg-slate-50/50 opacity-75",
        )}
        onClick={() => {
          window.location.href = `/dashboard/discharges/${caseData.id}`;
        }}
      >
        <CardContent className="p-4">
          {/* Header Row: Patient & Owner Info, Action Buttons */}
          <div className="mb-4 flex items-start justify-between">
            {/* Patient & Owner Info */}
            <div className="min-w-0 flex-1">
              <div className="mb-2">
                <h3
                  className={cn(
                    "text-lg font-bold text-slate-900",
                    isPlaceholder(caseData.patient.name) &&
                      "text-amber-600 italic",
                  )}
                >
                  {caseData.patient.name}
                </h3>
              </div>

              {/* Owner Name - Editable */}
              {!isEditing ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-slate-600">
                    {caseData.patient.owner_name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="transition-smooth h-5 w-5 rounded-full text-slate-400 hover:text-[#31aba3]"
                    onClick={handleStartEdit}
                    disabled={isLoadingUpdate}
                  >
                    <Edit2 className="h-3 w-3" />
                    <span className="sr-only">Edit owner info</span>
                  </Button>
                </div>
              ) : (
                <div className="mt-1 space-y-1.5">
                  <Input
                    className="h-7 w-full bg-white text-xs"
                    value={editForm.owner_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, owner_name: e.target.value })
                    }
                    placeholder="Owner Name"
                  />
                  <div className="flex gap-1.5">
                    <Input
                      className="h-7 flex-1 bg-white text-xs"
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
                      className="h-7 flex-1 bg-white text-xs"
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
                      className="transition-smooth h-6 px-2 text-xs hover:text-red-600"
                      onClick={handleCancel}
                      disabled={isLoadingUpdate}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="transition-smooth h-6 bg-[#31aba3] px-2 text-xs hover:bg-[#2a9a92]"
                      onClick={handleSave}
                      disabled={isLoadingUpdate}
                    >
                      {isLoadingUpdate ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="mr-1 h-3 w-3" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Combined Status/Action Buttons */}
            <div className="flex shrink-0 flex-col items-end gap-3">
              <div onClick={(e) => e.stopPropagation()}>
                {renderActionStatusButtons()}
              </div>

              {/* Test Mode Badge */}
              {testModeEnabled && (
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600"
                >
                  Test
                </Badge>
              )}
            </div>
          </div>

          {/* Contact Row: Phone, Email with Not Ready warning */}
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-slate-100 pb-2">
            <ContactIndicator
              type="phone"
              value={effectivePhone ?? undefined}
              isValid={hasValidContact(effectivePhone)}
              testMode={false}
            />
            <ContactIndicator
              type="email"
              value={effectiveEmail ?? undefined}
              isValid={hasValidContact(effectiveEmail)}
              testMode={false}
            />

            {/* Not Ready Warning - Only show when NOT ready */}
            {!caseData.is_ready_for_discharge && (
              <div
                className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1"
                title={`Missing: ${caseData.missing_requirements.join(", ")}`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">
                  Not Ready
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Call Confirmation Dialog */}
      <AlertDialog
        open={showCallConfirmation}
        onOpenChange={setShowCallConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Call</AlertDialogTitle>
            <AlertDialogDescription>
              This case already has a call that is{" "}
              {getCallStatus(caseData).toLowerCase()}. Are you sure you want to
              send again?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCall}>
              Yes, Send Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Confirmation Dialog */}
      <AlertDialog
        open={showEmailConfirmation}
        onOpenChange={setShowEmailConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Email</AlertDialogTitle>
            <AlertDialogDescription>
              This case already has an email that is{" "}
              {getEmailStatus(caseData).toLowerCase()}. Are you sure you want to
              send again?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEmail}>
              Yes, Send Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
