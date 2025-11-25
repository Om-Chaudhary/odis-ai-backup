"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import {
  Phone,
  Mail,
  Dog,
  Cat,
  Edit2,
  Save,
  X,
  Calendar,
  Loader2,
  Bug,
  PlayCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { DischargeStatusBadge } from "./discharge-status-badge";
import { CaseDebugModal } from "./case-debug-modal";
import { DischargeDebugModal } from "./discharge-debug-modal";
import type {
  DashboardCase,
  PatientUpdateInput,
  BackendCase,
  DischargeSettings,
} from "~/types/dashboard";
import { cn } from "~/lib/utils";

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
    return testValue;
  }
  return patientValue;
}

interface CaseCardProps {
  caseData: DashboardCase;
  backendCaseData?: BackendCase;
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
  settings,
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
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isDischargeDebugOpen, setIsDischargeDebugOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    owner_name: caseData.patient.owner_name,
    owner_email: caseData.patient.owner_email,
    owner_phone: caseData.patient.owner_phone,
  });

  const handleStartEdit = () => {
    if (testModeEnabled) {
      // Auto-fill with test contact data
      setEditForm({
        owner_name: testContactName || caseData.patient.owner_name,
        owner_email: testContactEmail || caseData.patient.owner_email,
        owner_phone: testContactPhone || caseData.patient.owner_phone,
      });
    } else {
      // Use existing patient data
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

  // Get effective contact values (test contact when test mode is enabled)
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

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-muted/30 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
              <SpeciesIcon className="h-5 w-5" />
            </div>
            <div>
              <h3
                className={cn(
                  "text-lg leading-none font-semibold",
                  isPlaceholder(caseData.patient.name) &&
                    "text-amber-600 italic dark:text-amber-500",
                )}
              >
                {caseData.patient.name}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                <span
                  className={cn(
                    isPlaceholder(caseData.patient.breed) &&
                      "text-amber-600 italic dark:text-amber-500",
                  )}
                >
                  {caseData.patient.breed}
                </span>{" "}
                •{" "}
                <span
                  className={cn(
                    isPlaceholder(caseData.patient.species) &&
                      "text-amber-600 italic dark:text-amber-500",
                  )}
                >
                  {caseData.patient.species}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              {settings && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setIsDischargeDebugOpen(true)}
                  title="Debug discharge variables"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  <span className="sr-only">Debug Discharge</span>
                </Button>
              )}
              {backendCaseData && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setIsDebugOpen(true)}
                  title="Debug case data"
                >
                  <Bug className="h-3.5 w-3.5" />
                  <span className="sr-only">Debug</span>
                </Button>
              )}
              <div className="text-muted-foreground flex items-center gap-0.5 text-[10px] leading-none whitespace-nowrap">
                <Calendar className="h-2.5 w-2.5" />
                {formatDistanceToNow(new Date(caseData.created_at), {
                  addSuffix: true,
                })}
              </div>
            </div>
            {caseData.status && (
              <div
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  caseData.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : caseData.status === "ongoing"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700",
                )}
              >
                {caseData.status}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-4 p-4">
        {/* Owner Info Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
              Owner Information
            </h4>
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleStartEdit}
                disabled={isLoadingUpdate}
              >
                <Edit2 className="text-muted-foreground h-3.5 w-3.5" />
                <span className="sr-only">Edit owner info</span>
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:text-destructive h-7 w-7 p-0"
                  onClick={handleCancel}
                  disabled={isLoadingUpdate}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:text-primary h-7 w-7 p-0"
                  onClick={handleSave}
                  disabled={isLoadingUpdate}
                >
                  {isLoadingUpdate ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label htmlFor="name" className="sr-only">
                  Name
                </Label>
                <Input
                  id="name"
                  size={1}
                  className="h-8"
                  value={editForm.owner_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, owner_name: e.target.value })
                  }
                  placeholder="Owner Name"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="phone" className="sr-only">
                  Phone
                </Label>
                <Input
                  id="phone"
                  size={1}
                  className="h-8"
                  value={editForm.owner_phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, owner_phone: e.target.value })
                  }
                  placeholder="Phone Number"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="email"
                  size={1}
                  className="h-8"
                  value={editForm.owner_email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, owner_email: e.target.value })
                  }
                  placeholder="Email Address"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <span
                  className={cn(
                    "truncate",
                    isPlaceholder(caseData.patient.owner_name) &&
                      "text-amber-600 italic dark:text-amber-500",
                  )}
                >
                  {caseData.patient.owner_name}
                </span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                <span
                  className={cn(
                    "truncate",
                    isPlaceholder(caseData.patient.owner_phone) &&
                      "font-medium text-amber-600 italic dark:text-amber-500",
                  )}
                >
                  {caseData.patient.owner_phone}
                </span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <span
                  className={cn(
                    "truncate",
                    isPlaceholder(caseData.patient.owner_email) &&
                      "font-medium text-amber-600 italic dark:text-amber-500",
                  )}
                >
                  {caseData.patient.owner_email}
                </span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Status Section */}
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
            Discharge Status
          </h4>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="text-muted-foreground h-4 w-4" />
                <span>Call</span>
              </div>
              {caseData.scheduled_discharge_call ? (
                <DischargeStatusBadge
                  status={caseData.scheduled_discharge_call.status}
                  type="call"
                />
              ) : (
                <span className="text-muted-foreground text-xs italic">
                  Not scheduled
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="text-muted-foreground h-4 w-4" />
                <span>Email</span>
              </div>
              {caseData.scheduled_discharge_email ? (
                <DischargeStatusBadge
                  status={caseData.scheduled_discharge_email.status}
                  type="email"
                />
              ) : (
                <span className="text-muted-foreground text-xs italic">
                  Not scheduled
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/30 p-4">
        <div className="grid w-full grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onTriggerCall(caseData.id)}
            disabled={
              isLoadingCall ||
              !hasValidContact(effectivePhone) ||
              (!!caseData.scheduled_discharge_call &&
                ["queued", "ringing", "in_progress", "completed"].includes(
                  caseData.scheduled_discharge_call.status ?? "",
                ))
            }
            title={
              !hasValidContact(effectivePhone)
                ? testModeEnabled
                  ? "Test phone number is required"
                  : "Phone number is required"
                : undefined
            }
          >
            {isLoadingCall ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Phone className="mr-2 h-4 w-4" />
            )}
            Call Owner
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onTriggerEmail(caseData.id)}
            disabled={
              isLoadingEmail ||
              !hasValidContact(effectiveEmail) ||
              (!!caseData.scheduled_discharge_email &&
                ["queued", "sent"].includes(
                  caseData.scheduled_discharge_email.status ?? "",
                ))
            }
            title={
              !hasValidContact(effectiveEmail)
                ? testModeEnabled
                  ? "Test email address is required"
                  : "Email address is required"
                : undefined
            }
          >
            {isLoadingEmail ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Email Owner
          </Button>
        </div>
      </CardFooter>

      {/* Debug Modal */}
      {backendCaseData && (
        <CaseDebugModal
          open={isDebugOpen}
          onOpenChange={setIsDebugOpen}
          caseData={backendCaseData}
        />
      )}

      {/* Discharge Debug Modal */}
      {settings && (
        <DischargeDebugModal
          open={isDischargeDebugOpen}
          onOpenChange={setIsDischargeDebugOpen}
          caseData={caseData}
          settings={settings}
        />
      )}
    </Card>
  );
}
