"use client";

import { useState } from "react";
import { Button } from "@odis-ai/shared/ui/button";
import { Card, CardContent, CardFooter } from "@odis-ai/shared/ui/card";
import { Input } from "@odis-ai/shared/ui/input";
import {
  Phone,
  Mail,
  Dog,
  Cat,
  Edit2,
  Save,
  Calendar,
  Loader2,
  AlertCircle,
  PlayCircle,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Database,
  FileCode,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type {
  DashboardCase,
  PatientUpdateInput,
  DischargeSettings,
} from "@odis-ai/shared/types";
import type { PartialBackendCase } from "@odis-ai/shared/util";
import { cn } from "@odis-ai/shared/util";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@odis-ai/shared/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@odis-ai/shared/ui/alert-dialog";
import {
  isPlaceholder,
  hasValidContact,
  getEffectiveContact,
} from "@odis-ai/shared/util/dashboard-helpers";
import { ContactIndicator } from "../shared/contact-indicator";
import { DischargeStatusIndicator } from "../discharges/discharge-status-indicator";
import { Badge } from "@odis-ai/shared/ui/badge";

type WorkflowStatus = "completed" | "in_progress" | "failed" | "ready";

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

function getStatusColor(status: WorkflowStatus) {
  switch (status) {
    case "completed":
      return "bg-emerald-500";
    case "in_progress":
      return "bg-blue-500";
    case "failed":
      return "bg-red-500";
    case "ready":
    default:
      return "bg-amber-500";
  }
}

function formatSource(source: string | null): string {
  if (!source) return "Manual";
  return source
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getSourceIcon(source: string | null) {
  if (!source) return FileCode;
  if (source.includes("idexx")) return Database;
  return FileCode;
}

function getTypeColor(
  type: "checkup" | "emergency" | "surgery" | "follow_up" | null,
): string {
  switch (type) {
    case "checkup":
      return "bg-blue-500/10 text-blue-600 border-blue-200";
    case "emergency":
      return "bg-red-500/10 text-red-600 border-red-200";
    case "surgery":
      return "bg-purple-500/10 text-purple-600 border-purple-200";
    case "follow_up":
      return "bg-green-500/10 text-green-600 border-green-200";
    default:
      return "bg-slate-500/10 text-slate-600 border-slate-200";
  }
}

function formatType(
  type: "checkup" | "emergency" | "surgery" | "follow_up" | null,
): string {
  if (!type) return "Unknown";
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get the current status of discharge calls for this case
 */
function getCallStatus(caseData: DashboardCase): string {
  if (
    !caseData.scheduled_discharge_calls ||
    caseData.scheduled_discharge_calls.length === 0
  )
    return "scheduled";

  const latestCall = caseData.scheduled_discharge_calls[0];
  const status = latestCall?.status;

  if (status === "completed") return "completed";
  if (status === "failed") return "failed";
  if (status === "in_progress" || status === "ringing") return "in progress";
  if (status === "queued") return "queued";

  return "scheduled";
}

/**
 * Get the current status of discharge emails for this case
 */
function getEmailStatus(caseData: DashboardCase): string {
  if (
    !caseData.scheduled_discharge_emails ||
    caseData.scheduled_discharge_emails.length === 0
  )
    return "scheduled";

  const latestEmail = caseData.scheduled_discharge_emails[0];
  const status = latestEmail?.status;

  if (status === "sent") return "sent";
  if (status === "failed") return "failed";
  if (status === "queued") return "queued";

  return "scheduled";
}

interface CaseCardProps {
  caseData: DashboardCase;
  backendCaseData?: PartialBackendCase;
  settings?: DischargeSettings;
  onTriggerCall: (id: string) => void;
  onTriggerEmail: (id: string) => void;
  onUpdatePatient: (patientId: string, data: PatientUpdateInput) => void;
  testModeEnabled?: boolean;
  testContactName?: string;
  testContactEmail?: string;
  testContactPhone?: string;
  isLoadingCall?: boolean;
  isLoadingEmail?: boolean;
  isLoadingUpdate?: boolean;
}

export function CaseCard({
  caseData,
  backendCaseData,
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
}: CaseCardProps) {
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

  const handleCallClick = () => {
    const callStatus = getCallStatus(caseData);

    if (callStatus !== "scheduled") {
      setShowCallConfirmation(true);
    } else {
      onTriggerCall(caseData.id);
    }
  };

  const handleEmailClick = () => {
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

  // --- Latest Activity Logic ---
  const allActivities = [
    ...(caseData.scheduled_discharge_calls?.map((c) => ({
      ...c,
      type: "call",
      date: new Date(c.created_at),
    })) ?? []),
    ...(caseData.scheduled_discharge_emails?.map((e) => ({
      ...e,
      type: "email",
      date: new Date(e.created_at),
    })) ?? []),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const latestActivity = allActivities[0];

  // Check if there are any scheduled calls or emails
  const hasDischargeActivity =
    (caseData.scheduled_discharge_calls &&
      caseData.scheduled_discharge_calls.length > 0) ||
    (caseData.scheduled_discharge_emails &&
      caseData.scheduled_discharge_emails.length > 0);

  // --- Action Button Logic ---
  const renderPrimaryAction = () => {
    if (workflowStatus === "in_progress") {
      return (
        <Button disabled className="w-full gap-2" variant="secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          In Progress...
        </Button>
      );
    }

    if (workflowStatus === "completed") {
      return (
        <Link href={`/dashboard/outbound/${caseData.id}`} className="w-full">
          <Button
            variant="outline"
            className="transition-smooth w-full gap-2 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </Link>
      );
    }

    if (workflowStatus === "failed") {
      return (
        <Button
          onClick={handleCallClick}
          disabled={isLoadingCall || !hasValidContact(effectivePhone)}
          variant="destructive"
          className="transition-smooth w-full gap-2"
        >
          {isLoadingCall ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Retry Call
        </Button>
      );
    }

    // Default: Ready
    return (
      <Button
        onClick={handleCallClick}
        disabled={isLoadingCall || !hasValidContact(effectivePhone)}
        className="transition-smooth w-full gap-2 hover:shadow-md"
      >
        {isLoadingCall ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Phone className="h-4 w-4" />
        )}
        Start Discharge Call
      </Button>
    );
  };

  return (
    <Card className="group transition-smooth relative overflow-hidden rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md hover:scale-[1.02] hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
      <CardContent className="p-5">
        {/* Header Section */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors",
                workflowStatus === "completed"
                  ? "bg-emerald-100 text-emerald-600"
                  : workflowStatus === "failed"
                    ? "bg-red-100 text-red-600"
                    : workflowStatus === "in_progress"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-500",
              )}
            >
              <SpeciesIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-2">
                <h3
                  className={cn(
                    "truncate text-lg font-semibold tracking-tight text-slate-900",
                    isPlaceholder(caseData.patient.name) &&
                      "text-amber-600 italic",
                  )}
                >
                  {caseData.patient.name}
                </h3>
                {/* Status Dot */}
                <div
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    getStatusColor(workflowStatus),
                  )}
                />
              </div>
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                {caseData.source && (
                  <Badge
                    variant="outline"
                    className="h-5 gap-1 border-slate-200 bg-slate-50/50 px-1.5 text-[10px] font-medium text-slate-600"
                  >
                    {(() => {
                      const SourceIcon = getSourceIcon(caseData.source);
                      return (
                        <>
                          <SourceIcon className="h-2.5 w-2.5" />
                          {formatSource(caseData.source)}
                        </>
                      );
                    })()}
                  </Badge>
                )}
                {caseData.type && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 border px-1.5 text-[10px] font-medium",
                      getTypeColor(caseData.type),
                    )}
                  >
                    {formatType(caseData.type)}
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {caseData.scheduled_at ? (
                    <>
                      Scheduled{" "}
                      {formatDistanceToNow(new Date(caseData.scheduled_at), {
                        addSuffix: true,
                      })}
                    </>
                  ) : (
                    "Not scheduled"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Context Menu for extra actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="transition-smooth h-8 w-8 text-slate-400 hover:text-slate-600"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/outbound/${caseData.id}`}>
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </Link>
              </DropdownMenuItem>
              {/* Only show debug if backend data exists */}
              {backendCaseData && (
                <DropdownMenuItem disabled>
                  <PlayCircle className="mr-2 h-4 w-4" /> Debug (Detailed View)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Owner & Contact Section */}
        <div className="-mx-2 mb-3 rounded-lg bg-slate-50 p-3">
          {!isEditing ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                  Owner
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
              <div className="font-medium text-slate-900">
                {caseData.patient.owner_name}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                size={1}
                className="h-7 w-full bg-white text-xs"
                value={editForm.owner_name}
                onChange={(e) =>
                  setEditForm({ ...editForm, owner_name: e.target.value })
                }
                placeholder="Owner Name"
              />
              <Input
                className="h-7 w-full bg-white text-xs"
                value={editForm.owner_phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, owner_phone: e.target.value })
                }
                placeholder="Phone"
              />
              <Input
                className="h-7 w-full bg-white text-xs"
                value={editForm.owner_email}
                onChange={(e) =>
                  setEditForm({ ...editForm, owner_email: e.target.value })
                }
                placeholder="Email"
              />
              <div className="flex justify-end gap-2 pt-1">
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

        {/* Contact Information Section */}
        <div
          className={cn("space-y-2", hasDischargeActivity ? "mb-4" : "mb-3")}
        >
          <h4 className="text-xs font-medium tracking-wider text-slate-500 uppercase">
            Contact Information
          </h4>
          <ContactIndicator
            type="phone"
            value={effectivePhone ?? undefined}
            isValid={hasValidContact(effectivePhone)}
            testMode={testModeEnabled}
          />
          <ContactIndicator
            type="email"
            value={effectiveEmail ?? undefined}
            isValid={hasValidContact(effectiveEmail)}
            testMode={testModeEnabled}
          />
        </div>

        {/* Discharge Status Section - Only show if there are calls or emails */}
        {hasDischargeActivity && (
          <div className="mb-3 space-y-2">
            <h4 className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              Discharge Status
            </h4>
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
        )}

        {/* Last Activity */}
        {latestActivity && (
          <div className="mb-3 text-xs text-slate-500">
            Last activity:{" "}
            {formatDistanceToNow(latestActivity.date, {
              addSuffix: true,
            })}
          </div>
        )}

        {/* Error Display - Show warnings for missing contacts */}
        {(!hasValidContact(effectivePhone) ||
          !hasValidContact(effectiveEmail)) && (
          <div
            className={cn(
              "mb-3 rounded-lg border p-2.5 text-sm",
              !hasValidContact(effectivePhone) &&
                !hasValidContact(effectiveEmail)
                ? "border-red-200 bg-red-50/50 text-red-700"
                : "border-amber-200 bg-amber-50/50 text-amber-700",
            )}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">
                {!hasValidContact(effectivePhone) &&
                  !hasValidContact(effectiveEmail) && (
                    <span>Phone and email required for discharge</span>
                  )}
                {!hasValidContact(effectivePhone) &&
                  hasValidContact(effectiveEmail) && (
                    <span>Phone number required for discharge call</span>
                  )}
                {hasValidContact(effectivePhone) &&
                  !hasValidContact(effectiveEmail) && (
                    <span>Email address required for discharge email</span>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Already Sent Warning - Show info about previous communications */}
        {(getCallStatus(caseData) !== "scheduled" ||
          getEmailStatus(caseData) !== "scheduled") && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50/50 p-2.5 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1 space-y-1">
                {getCallStatus(caseData) !== "scheduled" && (
                  <div>
                    Discharge call already{" "}
                    <strong>{getCallStatus(caseData)}</strong>
                  </div>
                )}
                {getEmailStatus(caseData) !== "scheduled" && (
                  <div>
                    Discharge email already{" "}
                    <strong>{getEmailStatus(caseData)}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-3 pl-5">
        <div className="flex w-full flex-col gap-2">
          <div className="grid w-full grid-cols-[1fr_auto] gap-2">
            {renderPrimaryAction()}

            {/* Secondary Actions (Email) */}
            {workflowStatus !== "in_progress" && (
              <Button
                variant="ghost"
                size="icon"
                className="transition-smooth shrink-0 text-slate-400 hover:bg-[#31aba3]/5 hover:text-[#31aba3]"
                onClick={handleEmailClick}
                disabled={isLoadingEmail || !hasValidContact(effectiveEmail)}
              >
                {isLoadingEmail ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* View Details Button */}
          <Button
            variant="ghost"
            size="sm"
            className="transition-smooth w-full justify-start gap-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            asChild
          >
            <Link href={`/dashboard/outbound/${caseData.id}`}>
              <Eye className="h-4 w-4" />
              View Details
            </Link>
          </Button>
        </div>
      </CardFooter>

      {/* Call Confirmation Dialog */}
      <AlertDialog
        open={showCallConfirmation}
        onOpenChange={setShowCallConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Discharge Call</AlertDialogTitle>
            <AlertDialogDescription>
              This case already has a call that is{" "}
              <strong>{getCallStatus(caseData)}</strong>. Sending another call
              may result in duplicate communications to the pet owner. Are you
              sure you want to send a new call?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCall}>
              Yes, Send Call
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
            <AlertDialogTitle>Confirm Discharge Email</AlertDialogTitle>
            <AlertDialogDescription>
              This case already has an email that is{" "}
              <strong>{getEmailStatus(caseData)}</strong>. Sending another email
              may result in duplicate communications to the pet owner. Are you
              sure you want to send a new email?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEmail}>
              Yes, Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
