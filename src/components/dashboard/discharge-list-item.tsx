"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Phone,
  Mail,
  Dog,
  Cat,
  Edit2,
  Save,
  Loader2,
  Eye,
  FileText,
  CheckCircle2,
  MoreHorizontal,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type {
  DashboardCase,
  PatientUpdateInput,
  DischargeSettings,
} from "~/types/dashboard";
import { cn } from "~/lib/utils";
import {
  isPlaceholder,
  hasValidContact,
  getEffectiveContact,
} from "~/lib/utils/dashboard-helpers";
import { ContactIndicator } from "./contact-indicator";
import { DischargeStatusIndicator } from "./discharge-status-indicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Badge } from "~/components/ui/badge";

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

  // Check for completion
  const hasCompletedCall = caseData.scheduled_discharge_calls.some(
    (c) => c.status === "completed",
  );
  const hasSentEmail = caseData.scheduled_discharge_emails.some(
    (e) => e.status === "sent",
  );
  if (caseData.status === "completed" || hasCompletedCall || hasSentEmail)
    return "completed";

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
 * Returns the display text for a workflow status
 *
 * @param status - The workflow status
 * @returns Human-readable status text
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

  const SpeciesIcon =
    caseData.patient.species?.toLowerCase() === "feline" ? Cat : Dog;

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

  // Render primary action button
  const renderPrimaryAction = () => {
    if (workflowStatus === "in_progress") {
      return (
        <Button disabled className="gap-2" variant="secondary" size="sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          In Progress
        </Button>
      );
    }

    if (workflowStatus === "completed") {
      return (
        <Link href={`/dashboard/discharges/${caseData.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="transition-smooth gap-2 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
        </Link>
      );
    }

    if (workflowStatus === "failed") {
      return (
        <Button
          onClick={() => onTriggerCall(caseData.id)}
          disabled={isLoadingCall || !hasValidContact(effectivePhone)}
          variant="destructive"
          size="sm"
          className="transition-smooth gap-2"
          title={
            !hasValidContact(effectivePhone)
              ? "Valid phone number required"
              : "Retry discharge call"
          }
        >
          {isLoadingCall ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Phone className="h-4 w-4" />
          )}
          Retry
        </Button>
      );
    }

    // Default: Ready
    return (
      <Button
        onClick={() => onTriggerCall(caseData.id)}
        disabled={
          isLoadingCall ||
          !hasValidContact(effectivePhone) ||
          !caseData.has_clinical_notes
        }
        size="sm"
        className="transition-smooth gap-2 hover:shadow-md"
        title={
          !caseData.has_clinical_notes
            ? "Clinical notes required to start discharge call"
            : !hasValidContact(effectivePhone)
              ? "Valid phone number required"
              : "Start discharge call"
        }
      >
        {isLoadingCall ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Phone className="h-4 w-4" />
        )}
        Call
      </Button>
    );
  };

  return (
    <Card
      className={cn(
        "group transition-smooth relative overflow-hidden rounded-lg border border-l-4 border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md",
        getStatusBorderColor(workflowStatus),
      )}
    >
      <CardContent className="p-4">
        {/* Header Row: Patient Icon, Name, Owner, Status Badge, Primary Action */}
        <div className="mb-3 flex items-start gap-3">
          {/* Patient Icon */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
              workflowStatus === "completed"
                ? "bg-emerald-100 text-emerald-600"
                : workflowStatus === "failed"
                  ? "bg-red-100 text-red-600"
                  : workflowStatus === "in_progress"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-100 text-slate-500",
            )}
          >
            <SpeciesIcon className="h-5 w-5" />
          </div>

          {/* Patient & Owner Info */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3
                className={cn(
                  "truncate text-base font-semibold text-slate-900",
                  isPlaceholder(caseData.patient.name) &&
                    "text-amber-600 italic",
                )}
              >
                {caseData.patient.name}
              </h3>
              {/* Status Badge */}
              <Badge
                variant="outline"
                className={cn(
                  "h-5 shrink-0 border px-2 text-[10px] font-medium",
                  workflowStatus === "completed"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : workflowStatus === "failed"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : workflowStatus === "in_progress"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-amber-200 bg-amber-50 text-amber-700",
                )}
              >
                {getStatusText(workflowStatus)}
              </Badge>
              {/* Test Mode Badge */}
              {testModeEnabled && (
                <Badge
                  variant="outline"
                  className="h-5 shrink-0 border-slate-200 bg-slate-50 px-1.5 text-[10px] font-medium text-slate-600"
                >
                  Test
                </Badge>
              )}
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

          {/* Primary Action & Overflow Menu */}
          <div className="flex shrink-0 items-center gap-2">
            {renderPrimaryAction()}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="transition-smooth h-8 w-8 text-slate-400 hover:text-slate-600"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {workflowStatus !== "in_progress" && (
                  <DropdownMenuItem
                    onClick={() => onTriggerEmail(caseData.id)}
                    disabled={
                      isLoadingEmail ||
                      !hasValidContact(effectiveEmail) ||
                      !caseData.has_clinical_notes
                    }
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/discharges/${caseData.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Contact Row: Phone, Email, Clinical Notes */}
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
          {/* Clinical Notes Indicator */}
          <div
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-0.5 text-xs",
              caseData.has_clinical_notes
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700",
            )}
            title={
              caseData.has_clinical_notes
                ? "Clinical notes available - ready for discharge"
                : "Clinical notes required - add SOAP notes, transcription, or discharge summary"
            }
          >
            {caseData.has_clinical_notes ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="font-medium">Notes Ready</span>
              </>
            ) : (
              <>
                <FileText className="h-3.5 w-3.5" />
                <span className="font-medium">Notes Required</span>
              </>
            )}
          </div>
        </div>

        {/* Status Row: Discharge Status & Timestamp */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <DischargeStatusIndicator
              type="call"
              calls={caseData.scheduled_discharge_calls}
              testMode={testModeEnabled}
            />
            <DischargeStatusIndicator
              type="email"
              emails={caseData.scheduled_discharge_emails}
              testMode={testModeEnabled}
            />
          </div>
          <div className="text-xs text-slate-500">
            Created{" "}
            {formatDistanceToNow(new Date(caseData.created_at), {
              addSuffix: true,
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
