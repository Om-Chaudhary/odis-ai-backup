"use client";

import { Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@odis/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@odis/ui/card";
import { Badge } from "@odis/ui/badge";
import type { DashboardCase, DischargeSettings } from "~/types/dashboard";
import { buildDynamicVariables } from "~/lib/vapi/knowledge-base";
import { normalizeVariablesToSnakeCase } from "~/lib/vapi/utils";

interface DischargeDebugModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: DashboardCase;
  settings: DischargeSettings;
}

/**
 * Simulates building VAPI variables for a discharge call
 * This matches the logic in CasesService.scheduleDischargeCall
 */
function buildVapiVariables(
  caseData: DashboardCase,
  settings: DischargeSettings,
) {
  // Build base variables (matching CasesService.scheduleDischargeCall logic)
  // Agent name: Use first name from vetName, or default to "Sarah"
  const agentName = settings.vetName?.trim()
    ? settings.vetName.split(" ")[0]
    : "Sarah";

  const baseVariables = {
    clinicName: settings.clinicName ?? "Your Clinic",
    agentName,
    petName: caseData.patient.name,
    ownerName: caseData.patient.owner_name,
    appointmentDate: "today", // This would be formatted from case data in real scenario
    callType: "discharge" as const,
    clinicPhone: settings.clinicPhone ?? "",
    emergencyPhone: settings.emergencyPhone ?? settings.clinicPhone ?? "",
    dischargeSummary: caseData.discharge_summary?.content ?? "",
    // Note: In real scenario, medications and nextSteps would come from case entities
    // For debug purposes, we'll show empty/default values
    medications: undefined as string | undefined,
    nextSteps: undefined as string | undefined,
  };

  // Build variables using the same function as the real implementation
  const variablesResult = buildDynamicVariables({
    baseVariables,
    strict: false,
    useDefaults: true,
  });

  // Normalize to snake_case (as done before sending to VAPI)
  const normalizedVariables = normalizeVariablesToSnakeCase(
    variablesResult.variables as unknown as Record<string, unknown>,
  );

  // Determine phone number (with test mode support)
  const phoneNumber = settings.testModeEnabled
    ? (settings.testContactPhone ?? caseData.patient.owner_phone)
    : caseData.patient.owner_phone;

  return {
    variables: normalizedVariables,
    phoneNumber,
    testModeEnabled: settings.testModeEnabled,
    validation: variablesResult.validation,
    knowledgeBase: variablesResult.knowledgeBase,
  };
}

export function DischargeDebugModal({
  open,
  onOpenChange,
  caseData,
  settings,
}: DischargeDebugModalProps) {
  const debugData = buildVapiVariables(caseData, settings);

  // Group variables by category for better display
  const coreVariables = [
    "pet_name",
    "owner_name",
    "appointment_date",
    "call_type",
  ];
  const clinicVariables = [
    "clinic_name",
    "clinic_phone",
    "emergency_phone",
    "agent_name",
    "vet_name",
  ];
  const clinicalVariables = [
    "discharge_summary_content",
    "medications",
    "next_steps",
    "sub_type",
  ];
  const knowledgeBaseVariables = [
    "condition_category",
    "assessment_questions",
    "warning_signs_to_monitor",
    "normal_post_treatment_expectations",
    "emergency_criteria",
    "urgent_criteria",
  ];

  const getVariableValue = (key: string) => {
    const value = debugData.variables[key];
    if (value === null || value === undefined) return null;
    if (Array.isArray(value)) return value;
    if (typeof value === "object") return value;
    // At this point, value is a primitive (string, number, boolean, etc.)
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return String(value);
    // Handle remaining primitives (symbol, bigint, etc.) safely
    if (typeof value === "symbol" || typeof value === "bigint") {
      return String(value);
    }
    // This should never happen, but TypeScript needs this for type narrowing
    return String(value as string | number | boolean);
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (Array.isArray(value)) {
      return value.length > 0 ? JSON.stringify(value, null, 2) : "[]";
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    // At this point, value is a primitive (string, number, boolean, etc.)
    if (typeof value === "string") {
      return value.length > 200 ? `${value.substring(0, 200)}...` : value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      const str = String(value);
      return str.length > 200 ? `${str.substring(0, 200)}...` : str;
    }
    // Handle remaining primitives (symbol, bigint, etc.) safely
    if (typeof value === "symbol" || typeof value === "bigint") {
      return String(value);
    }
    // This should never happen, but TypeScript needs this for type narrowing
    return String(value as string | number | boolean);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-[95vw] overflow-y-auto p-4 sm:w-[90vw] sm:max-w-7xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4" />
            Debug: Discharge Variables for {caseData.patient.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            All variables that will be sent to VAPI when scheduling a discharge
            call
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Call Configuration */}
          <Card>
            <CardHeader className="p-2 pb-1">
              <CardTitle className="text-xs font-semibold">
                Call Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phone Number:</span>
                  <Badge
                    variant={debugData.testModeEnabled ? "default" : "outline"}
                    className="font-mono text-[10px]"
                  >
                    {debugData.phoneNumber || "—"}
                  </Badge>
                </div>
                {debugData.testModeEnabled && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Test Mode:</span>
                    <Badge variant="default" className="text-[10px]">
                      Enabled
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Validation:</span>
                  <Badge
                    variant={
                      debugData.validation.valid ? "default" : "destructive"
                    }
                    className="text-[10px]"
                  >
                    {debugData.validation.valid ? "Valid" : "Invalid"}
                  </Badge>
                </div>
                {debugData.validation.warnings.length > 0 && (
                  <div className="mt-2 rounded bg-amber-50 p-2 dark:bg-amber-950">
                    <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-200">
                      Warnings:
                    </p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5 text-[10px] text-amber-700 dark:text-amber-300">
                      {debugData.validation.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {debugData.validation.errors.length > 0 && (
                  <div className="mt-2 rounded bg-red-50 p-2 dark:bg-red-950">
                    <p className="text-[10px] font-semibold text-red-800 dark:text-red-200">
                      Errors:
                    </p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5 text-[10px] text-red-700 dark:text-red-300">
                      {debugData.validation.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Core Variables */}
          <Card>
            <CardHeader className="p-2 pb-1">
              <CardTitle className="text-xs font-semibold">
                Core Variables ({coreVariables.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="space-y-1.5">
                {coreVariables.map((key) => {
                  const value = getVariableValue(key);
                  return (
                    <div key={key} className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="h-4 px-1.5 py-0 font-mono text-[10px]"
                        >
                          {key}
                        </Badge>
                        {value === null && (
                          <Badge
                            variant="secondary"
                            className="h-4 px-1.5 py-0 text-[10px]"
                          >
                            null
                          </Badge>
                        )}
                      </div>
                      {value !== null && (
                        <pre className="bg-muted max-h-24 overflow-auto rounded p-1.5 text-[10px] leading-tight">
                          {formatValue(value)}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Clinic Variables */}
          <Card>
            <CardHeader className="p-2 pb-1">
              <CardTitle className="text-xs font-semibold">
                Clinic Variables ({clinicVariables.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="space-y-1.5">
                {clinicVariables.map((key) => {
                  const value = getVariableValue(key);
                  return (
                    <div key={key} className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="h-4 px-1.5 py-0 font-mono text-[10px]"
                        >
                          {key}
                        </Badge>
                        {value === null && (
                          <Badge
                            variant="secondary"
                            className="h-4 px-1.5 py-0 text-[10px]"
                          >
                            null
                          </Badge>
                        )}
                      </div>
                      {value !== null && (
                        <pre className="bg-muted max-h-24 overflow-auto rounded p-1.5 text-[10px] leading-tight">
                          {formatValue(value)}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Clinical Variables */}
          <Card>
            <CardHeader className="p-2 pb-1">
              <CardTitle className="text-xs font-semibold">
                Clinical Variables ({clinicalVariables.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="space-y-1.5">
                {clinicalVariables.map((key) => {
                  const value = getVariableValue(key);
                  return (
                    <div key={key} className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="h-4 px-1.5 py-0 font-mono text-[10px]"
                        >
                          {key}
                        </Badge>
                        {value === null && (
                          <Badge
                            variant="secondary"
                            className="h-4 px-1.5 py-0 text-[10px]"
                          >
                            null
                          </Badge>
                        )}
                      </div>
                      {value !== null && (
                        <pre className="bg-muted max-h-32 overflow-auto rounded p-1.5 text-[10px] leading-tight">
                          {formatValue(value)}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base Variables */}
          <Card>
            <CardHeader className="p-2 pb-1">
              <CardTitle className="text-xs font-semibold">
                Knowledge Base Variables ({knowledgeBaseVariables.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="space-y-1.5">
                {knowledgeBaseVariables.map((key) => {
                  const value = getVariableValue(key);
                  return (
                    <div key={key} className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="h-4 px-1.5 py-0 font-mono text-[10px]"
                        >
                          {key}
                        </Badge>
                        {value === null && (
                          <Badge
                            variant="secondary"
                            className="h-4 px-1.5 py-0 text-[10px]"
                          >
                            null
                          </Badge>
                        )}
                      </div>
                      {value !== null && (
                        <pre className="bg-muted max-h-32 overflow-auto rounded p-1.5 text-[10px] leading-tight">
                          {formatValue(value)}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base Info */}
          {debugData.knowledgeBase && (
            <Card>
              <CardHeader className="p-2 pb-1">
                <CardTitle className="text-xs font-semibold">
                  Knowledge Base Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="secondary"
                      className="h-4 px-1.5 py-0 text-[10px]"
                    >
                      Category: {debugData.knowledgeBase.conditionCategory}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="h-4 px-1.5 py-0 text-[10px]"
                    >
                      {debugData.knowledgeBase.displayName}
                    </Badge>
                  </div>
                  {debugData.knowledgeBase.description && (
                    <p className="text-muted-foreground text-[10px]">
                      {debugData.knowledgeBase.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Variables (Raw JSON) */}
          <Card>
            <CardHeader className="p-2 pb-1">
              <CardTitle className="text-xs font-semibold">
                All Variables (Raw JSON)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <pre className="bg-muted max-h-64 overflow-auto rounded p-2 text-[10px] leading-tight">
                {JSON.stringify(debugData.variables, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
