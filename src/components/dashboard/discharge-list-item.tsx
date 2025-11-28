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
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type {
  DashboardCase,
  PatientUpdateInput,
  DischargeSettings,
} from "~/types/dashboard";
import { cn } from "~/lib/utils";
import { ContactIndicator } from "./contact-indicator";
import { DischargeStatusIndicator } from "./discharge-status-indicator";

// --- Helper Functions ---

/**
 * Check if a value is a placeholder (missing data indicator)
 */
function isPlaceholder(value: string): boolean {
  const placeholders = [
    "Unknown Patient",
    "Unknown Species",
    "Unknown Breed",
    "Unknown Owner",
    "No email address",
    "No phone number",
  ];
  return placeholders.includes(value);
}

/**
 * Check if a contact value is valid (not a placeholder and not empty)
 */
function hasValidContact(value: string | undefined | null): boolean {
  if (!value) return false;
  return !isPlaceholder(value) && value.trim().length > 0;
}

/**
 * Get the effective contact value - use test contact if test mode is enabled, otherwise use patient contact
 */
function getEffectiveContact(
  patientValue: string | undefined | null,
  testValue: string | undefined | null,
  testModeEnabled: boolean,
): string | undefined | null {
  if (testModeEnabled && hasValidContact(testValue)) {
    return testValue ?? null;
  }
  return patientValue ?? null;
}

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

interface DischargeListItemProps {
  caseData: DashboardCase;
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

  return (
    <Card className="group transition-smooth rounded-lg border border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Left: Patient Icon with Status */}
          <div className="flex shrink-0 items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-lg transition-colors",
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
            {/* Status Dot */}
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                getStatusColor(workflowStatus),
              )}
              title={`Status: ${workflowStatus.replace("_", " ")}`}
            />
          </div>

          {/* Center: Patient & Owner Info */}
          <div className="min-w-0 flex-1">
            <div className="mb-2">
              <h3
                className={cn(
                  "truncate text-base font-semibold text-slate-900",
                  isPlaceholder(caseData.patient.name) &&
                    "text-amber-600 italic",
                )}
              >
                {caseData.patient.name}
              </h3>
              {!isEditing ? (
                <div className="flex items-center gap-2">
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
                <div className="mt-1 space-y-1">
                  <Input
                    className="h-7 w-full bg-white text-xs"
                    value={editForm.owner_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, owner_name: e.target.value })
                    }
                    placeholder="Owner Name"
                  />
                  <div className="flex gap-1">
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

            {/* Contact Information - Compact */}
            <div className="mb-2 flex flex-wrap items-center gap-3 text-xs">
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

            {/* Discharge Status - Compact */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
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

            {/* Created Date */}
            <div className="mt-1 text-xs text-slate-500">
              Created{" "}
              {formatDistanceToNow(new Date(caseData.created_at), {
                addSuffix: true,
              })}
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex shrink-0 items-center gap-2">
            {workflowStatus === "in_progress" ? (
              <Button disabled className="gap-2" variant="secondary" size="sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                In Progress
              </Button>
            ) : workflowStatus === "completed" ? (
              <Link href={`/dashboard/cases/${caseData.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="transition-smooth gap-2 hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" />
                  View
                </Button>
              </Link>
            ) : workflowStatus === "failed" ? (
              <Button
                onClick={() => onTriggerCall(caseData.id)}
                disabled={isLoadingCall || !hasValidContact(effectivePhone)}
                variant="destructive"
                size="sm"
                className="transition-smooth gap-2"
              >
                {isLoadingCall ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Phone className="h-4 w-4" />
                )}
                Retry
              </Button>
            ) : (
              <Button
                onClick={() => onTriggerCall(caseData.id)}
                disabled={isLoadingCall || !hasValidContact(effectivePhone)}
                size="sm"
                className="transition-smooth gap-2 hover:shadow-md"
              >
                {isLoadingCall ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Phone className="h-4 w-4" />
                )}
                Call
              </Button>
            )}

            {/* Email Button */}
            {workflowStatus !== "in_progress" && (
              <Button
                variant="ghost"
                size="icon"
                className="transition-smooth text-slate-400 hover:bg-[#31aba3]/5 hover:text-[#31aba3]"
                onClick={() => onTriggerEmail(caseData.id)}
                disabled={isLoadingEmail || !hasValidContact(effectiveEmail)}
                title="Send Discharge Email"
              >
                {isLoadingEmail ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* View Details Button */}
            <Link href={`/dashboard/cases/${caseData.id}`}>
              <Button
                variant="ghost"
                size="icon"
                className="transition-smooth text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Display - Show warnings for missing contacts */}
        {(!hasValidContact(effectivePhone) ||
          !hasValidContact(effectiveEmail)) && (
          <div
            className={cn(
              "mt-3 rounded-lg border p-2 text-xs",
              !hasValidContact(effectivePhone) &&
                !hasValidContact(effectiveEmail)
                ? "border-red-200 bg-red-50/50 text-red-700"
                : "border-amber-200 bg-amber-50/50 text-amber-700",
            )}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
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
      </CardContent>
    </Card>
  );
}
