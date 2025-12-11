"use client";

import { useState, useEffect } from "react";
import { Button } from "@odis-ai/ui/button";
import { Input } from "@odis-ai/ui/input";
import { Label } from "@odis-ai/ui/label";
import { Textarea } from "@odis-ai/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@odis-ai/ui/card";
import { Badge } from "@odis-ai/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/ui/select";
import { Switch } from "@odis-ai/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@odis-ai/ui/accordion";
import {
  Phone,
  Loader2,
  Code,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  initiateSquadTestCall,
  getRecentCasesForPrefill,
  convertToSquadVariables,
} from "~/server/actions/squad-test";
import {
  DEFAULT_SQUAD_TEST_VARIABLES,
  type SquadTestVariables,
  type RecentCaseOption,
} from "~/server/actions/squad-test.types";

export function VapiTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callResult, setCallResult] = useState<{
    success: boolean;
    callId?: string;
    status?: string;
    error?: string;
  } | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [variables, setVariables] = useState<SquadTestVariables>(
    DEFAULT_SQUAD_TEST_VARIABLES,
  );
  const [recentCases, setRecentCases] = useState<RecentCaseOption[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");

  // Load recent cases on mount
  useEffect(() => {
    void loadRecentCases();
  }, []);

  const loadRecentCases = async () => {
    setIsLoadingCases(true);
    try {
      const cases = await getRecentCasesForPrefill(20);
      setRecentCases(cases);
    } catch (error) {
      console.error("Failed to load recent cases:", error);
      toast.error("Failed to load recent cases");
    } finally {
      setIsLoadingCases(false);
    }
  };

  const handleCaseSelect = async (caseId: string) => {
    setSelectedCaseId(caseId);

    if (!caseId) return;

    const selectedCase = recentCases.find((c) => c.id === caseId);
    if (!selectedCase) return;

    try {
      const convertedVars = await convertToSquadVariables(
        selectedCase.dynamicVariables,
      );
      setVariables(convertedVars);
      toast.success(`Loaded variables from ${selectedCase.petName}'s case`);
    } catch (error) {
      console.error("Failed to convert variables:", error);
      toast.error("Failed to load case variables");
    }
  };

  const handleVariableChange = (
    key: keyof SquadTestVariables,
    value: string,
  ) => {
    setVariables((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleStartCall = async () => {
    if (!phoneNumber) {
      toast.error("Please enter a phone number");
      return;
    }

    // Ensure E.164 format
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = `+1${formattedPhone.replace(/\D/g, "")}`;
    }

    setIsLoading(true);
    setCallResult(null);

    try {
      const result = await initiateSquadTestCall(formattedPhone, variables);
      setCallResult(result);

      if (result.success) {
        toast.success(`Call initiated! ID: ${result.callId}`);
      } else {
        toast.error(result.error ?? "Failed to initiate call");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setCallResult({ success: false, error: errorMessage });
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setVariables(DEFAULT_SQUAD_TEST_VARIABLES);
    setCallResult(null);
    setSelectedCaseId("");
    toast.info("Variables reset to defaults");
  };

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Squad Outbound Test
        </h1>
        <p className="mt-2 text-slate-600">
          Test the Follow-Up Squad (greeter → assessor → closer) with custom
          case variables
        </p>
        <Badge variant="outline" className="mt-2">
          Squad ID: d4305e87-1c5a-4d45-8953-2525e2d88244
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Variables Form */}
        <div className="space-y-6">
          {/* Phone Number & Actions */}
          <Card className="border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Call Settings</CardTitle>
              <CardDescription className="text-slate-600">
                Enter your phone number to receive the test call
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="phoneNumber"
                  className="font-medium text-slate-700"
                >
                  Your Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={isLoading}
                  className="border-slate-300 placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500">
                  E.164 format recommended (e.g., +15551234567)
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleStartCall}
                  disabled={isLoading || !phoneNumber}
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Initiating Call...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-5 w-5" />
                      Start Squad Call
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={isLoading}
                  className="w-full"
                >
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Case Prefill Selector */}
          <Card className="border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">
                Load from Recent Case
              </CardTitle>
              <CardDescription className="text-slate-600">
                Prefill variables from a recent case with valid data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium text-slate-700">
                  Recent Cases
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedCaseId}
                    onValueChange={handleCaseSelect}
                    disabled={isLoading || isLoadingCases}
                  >
                    <SelectTrigger className="flex-1 border-slate-300">
                      <SelectValue placeholder="Select a case to prefill from..." />
                    </SelectTrigger>
                    <SelectContent>
                      {recentCases.length === 0 && !isLoadingCases && (
                        <SelectItem value="_empty" disabled>
                          No recent cases found
                        </SelectItem>
                      )}
                      {recentCases.map((caseOption) => (
                        <SelectItem key={caseOption.id} value={caseOption.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {caseOption.petName} ({caseOption.ownerName})
                            </span>
                            <span className="text-xs text-slate-500">
                              {caseOption.diagnosis} •{" "}
                              {new Date(
                                caseOption.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={loadRecentCases}
                    disabled={isLoadingCases}
                    title="Refresh cases"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isLoadingCases ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  {isLoadingCases
                    ? "Loading cases..."
                    : `${recentCases.length} recent cases available`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Variables Accordion */}
          <Card className="border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Case Variables</CardTitle>
              <CardDescription className="text-slate-600">
                Configure the variables passed to the squad prompts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={["basic", "visit"]}>
                {/* Basic Info Section */}
                <AccordionItem value="basic">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900">
                    Basic Information
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">
                          Agent Name
                        </Label>
                        <Input
                          value={variables.agent_name}
                          onChange={(e) =>
                            handleVariableChange("agent_name", e.target.value)
                          }
                          placeholder="Sarah"
                          disabled={isLoading}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">
                          Clinic Name
                        </Label>
                        <Input
                          value={variables.clinic_name}
                          onChange={(e) =>
                            handleVariableChange("clinic_name", e.target.value)
                          }
                          placeholder="Alum Rock Pet Hospital"
                          disabled={isLoading}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">
                          Pet Name
                        </Label>
                        <Input
                          value={variables.pet_name}
                          onChange={(e) =>
                            handleVariableChange("pet_name", e.target.value)
                          }
                          placeholder="Luna"
                          disabled={isLoading}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">
                          Owner Name
                        </Label>
                        <Input
                          value={variables.owner_name}
                          onChange={(e) =>
                            handleVariableChange("owner_name", e.target.value)
                          }
                          placeholder="Taylor"
                          disabled={isLoading}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">
                          Species
                        </Label>
                        <Select
                          value={variables.patient_species}
                          onValueChange={(value) =>
                            handleVariableChange("patient_species", value)
                          }
                          disabled={isLoading}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dog">Dog</SelectItem>
                            <SelectItem value="cat">Cat</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">
                          Breed
                        </Label>
                        <Input
                          value={variables.patient_breed ?? ""}
                          onChange={(e) =>
                            handleVariableChange(
                              "patient_breed",
                              e.target.value,
                            )
                          }
                          placeholder="Golden Retriever"
                          disabled={isLoading}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Visit Details Section */}
                <AccordionItem value="visit">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900">
                    Visit Details
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Visit Reason
                      </Label>
                      <Input
                        value={variables.visit_reason}
                        onChange={(e) =>
                          handleVariableChange("visit_reason", e.target.value)
                        }
                        placeholder="vomiting and diarrhea"
                        disabled={isLoading}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Primary Diagnosis
                      </Label>
                      <Input
                        value={variables.primary_diagnosis}
                        onChange={(e) =>
                          handleVariableChange(
                            "primary_diagnosis",
                            e.target.value,
                          )
                        }
                        placeholder="Acute gastroenteritis"
                        disabled={isLoading}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">
                          Condition Category
                        </Label>
                        <Select
                          value={variables.condition_category}
                          onValueChange={(value) =>
                            handleVariableChange("condition_category", value)
                          }
                          disabled={isLoading}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gastrointestinal">
                              Gastrointestinal
                            </SelectItem>
                            <SelectItem value="post-surgical">
                              Post-Surgical
                            </SelectItem>
                            <SelectItem value="dermatological">
                              Dermatological
                            </SelectItem>
                            <SelectItem value="respiratory">
                              Respiratory
                            </SelectItem>
                            <SelectItem value="orthopedic">
                              Orthopedic
                            </SelectItem>
                            <SelectItem value="dental">Dental</SelectItem>
                            <SelectItem value="urinary">Urinary</SelectItem>
                            <SelectItem value="cardiac">Cardiac</SelectItem>
                            <SelectItem value="neurological">
                              Neurological
                            </SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">
                          Call Type
                        </Label>
                        <Select
                          value={variables.call_type}
                          onValueChange={(value) =>
                            handleVariableChange("call_type", value)
                          }
                          disabled={isLoading}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="follow-up">Follow-Up</SelectItem>
                            <SelectItem value="discharge">Discharge</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Appointment Date (spelled out)
                      </Label>
                      <Input
                        value={variables.appointment_date}
                        onChange={(e) =>
                          handleVariableChange(
                            "appointment_date",
                            e.target.value,
                          )
                        }
                        placeholder="December eighth"
                        disabled={isLoading}
                        className="h-9 text-sm"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Contact Info Section */}
                <AccordionItem value="contact">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900">
                    Contact Information
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Clinic Phone (spelled out)
                      </Label>
                      <Input
                        value={variables.clinic_phone}
                        onChange={(e) =>
                          handleVariableChange("clinic_phone", e.target.value)
                        }
                        placeholder="four zero eight, two five eight, two seven three five"
                        disabled={isLoading}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Emergency Phone (spelled out)
                      </Label>
                      <Input
                        value={variables.emergency_phone}
                        onChange={(e) =>
                          handleVariableChange(
                            "emergency_phone",
                            e.target.value,
                          )
                        }
                        placeholder="four zero eight, eight six five, four three two one"
                        disabled={isLoading}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="clinic_is_open"
                        checked={variables.clinic_is_open === "true"}
                        onCheckedChange={(checked) =>
                          handleVariableChange(
                            "clinic_is_open",
                            checked ? "true" : "false",
                          )
                        }
                        disabled={isLoading}
                      />
                      <Label
                        htmlFor="clinic_is_open"
                        className="text-xs font-medium text-slate-700"
                      >
                        Clinic is Open
                      </Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Patient Details Section */}
                <AccordionItem value="patient">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900">
                    Patient Details
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">
                          Age
                        </Label>
                        <Input
                          value={variables.patient_age ?? ""}
                          onChange={(e) =>
                            handleVariableChange("patient_age", e.target.value)
                          }
                          placeholder="3 years"
                          disabled={isLoading}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">
                          Sex
                        </Label>
                        <Input
                          value={variables.patient_sex ?? ""}
                          onChange={(e) =>
                            handleVariableChange("patient_sex", e.target.value)
                          }
                          placeholder="Female spayed"
                          disabled={isLoading}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">
                          Weight
                        </Label>
                        <Input
                          value={variables.patient_weight ?? ""}
                          onChange={(e) =>
                            handleVariableChange(
                              "patient_weight",
                              e.target.value,
                            )
                          }
                          placeholder="65 pounds"
                          disabled={isLoading}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">
                          Prognosis
                        </Label>
                        <Input
                          value={variables.prognosis ?? ""}
                          onChange={(e) =>
                            handleVariableChange("prognosis", e.target.value)
                          }
                          placeholder="Good with treatment"
                          disabled={isLoading}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Medications Section */}
                <AccordionItem value="medications">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900">
                    Medications
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Medications (Detailed)
                      </Label>
                      <Textarea
                        value={variables.medications_detailed ?? ""}
                        onChange={(e) =>
                          handleVariableChange(
                            "medications_detailed",
                            e.target.value,
                          )
                        }
                        placeholder="Metronidazole 250mg twice daily with food for 7 days..."
                        disabled={isLoading}
                        rows={3}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Medication Names (comma-separated)
                      </Label>
                      <Input
                        value={variables.medication_names ?? ""}
                        onChange={(e) =>
                          handleVariableChange(
                            "medication_names",
                            e.target.value,
                          )
                        }
                        placeholder="Metronidazole, Cerenia"
                        disabled={isLoading}
                        className="h-9 text-sm"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Follow-up Section */}
                <AccordionItem value="followup">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900">
                    Follow-up & Procedures
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Procedures
                      </Label>
                      <Input
                        value={variables.procedures ?? ""}
                        onChange={(e) =>
                          handleVariableChange("procedures", e.target.value)
                        }
                        placeholder="Spay surgery, dental cleaning"
                        disabled={isLoading}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">
                          Recheck Required
                        </Label>
                        <Select
                          value={variables.recheck_required ?? "no"}
                          onValueChange={(value) =>
                            handleVariableChange("recheck_required", value)
                          }
                          disabled={isLoading}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">
                          Recheck Date
                        </Label>
                        <Input
                          value={variables.recheck_date ?? ""}
                          onChange={(e) =>
                            handleVariableChange("recheck_date", e.target.value)
                          }
                          placeholder="December fifteenth"
                          disabled={isLoading}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Clinical Arrays Section */}
                <AccordionItem value="clinical">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900">
                    Clinical Arrays (JSON)
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Warning Signs to Monitor
                      </Label>
                      <Textarea
                        value={variables.warning_signs_to_monitor ?? ""}
                        onChange={(e) =>
                          handleVariableChange(
                            "warning_signs_to_monitor",
                            e.target.value,
                          )
                        }
                        placeholder='["Blood in vomit", "Lethargy"]'
                        disabled={isLoading}
                        rows={2}
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Normal Post-Treatment Expectations
                      </Label>
                      <Textarea
                        value={
                          variables.normal_post_treatment_expectations ?? ""
                        }
                        onChange={(e) =>
                          handleVariableChange(
                            "normal_post_treatment_expectations",
                            e.target.value,
                          )
                        }
                        placeholder='["Mild decrease in appetite", "Soft stools"]'
                        disabled={isLoading}
                        rows={2}
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Emergency Criteria
                      </Label>
                      <Textarea
                        value={variables.emergency_criteria ?? ""}
                        onChange={(e) =>
                          handleVariableChange(
                            "emergency_criteria",
                            e.target.value,
                          )
                        }
                        placeholder='["Bloody diarrhea", "Collapse"]'
                        disabled={isLoading}
                        rows={2}
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Urgent Criteria
                      </Label>
                      <Textarea
                        value={variables.urgent_criteria ?? ""}
                        onChange={(e) =>
                          handleVariableChange(
                            "urgent_criteria",
                            e.target.value,
                          )
                        }
                        placeholder='["Vomiting more than 3 times", "Refusal to eat"]'
                        disabled={isLoading}
                        rows={2}
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Assessment Questions
                      </Label>
                      <Textarea
                        value={variables.assessment_questions ?? ""}
                        onChange={(e) =>
                          handleVariableChange(
                            "assessment_questions",
                            e.target.value,
                          )
                        }
                        placeholder='[{"question": "How has appetite been?", ...}]'
                        disabled={isLoading}
                        rows={4}
                        className="font-mono text-xs"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Billing Verification Section */}
                <AccordionItem value="billing">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900">
                    Billing Verification (Source of Truth)
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs text-amber-800">
                        <strong>Important:</strong> Services Performed is the
                        source of truth for what actually happened. The AI will
                        only discuss medications/treatments that appear here.
                        Items in Services Declined will NOT be mentioned.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Services Performed (Billing Accepted)
                      </Label>
                      <Textarea
                        value={variables.services_performed ?? ""}
                        onChange={(e) =>
                          handleVariableChange(
                            "services_performed",
                            e.target.value,
                          )
                        }
                        placeholder="Office Visit; Metronidazole 250mg #14; Cerenia 60mg #3; Fecal Test"
                        disabled={isLoading}
                        rows={3}
                        className="text-sm"
                      />
                      <p className="text-xs text-slate-500">
                        Semicolon-separated list of services that were actually
                        performed and billed
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Services Declined (Not Performed)
                      </Label>
                      <Textarea
                        value={variables.services_declined ?? ""}
                        onChange={(e) =>
                          handleVariableChange(
                            "services_declined",
                            e.target.value,
                          )
                        }
                        placeholder="X-rays; Blood Panel; Prescription Diet"
                        disabled={isLoading}
                        rows={2}
                        className="text-sm"
                      />
                      <p className="text-xs text-slate-500">
                        For debugging only - these items will NOT be mentioned
                        during the call (silent approach)
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Call Status and Debug */}
        <div className="space-y-6">
          {/* Call Result */}
          {callResult && (
            <Card
              className={`border-2 ${
                callResult.success
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {callResult.success ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-green-800">Call Initiated</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-red-800">Call Failed</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {callResult.success ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700">
                        Call ID:
                      </span>
                      <code className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                        {callResult.callId}
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700">
                        Status:
                      </span>
                      <Badge variant="outline" className="border-green-300">
                        {callResult.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-green-600">
                      Your phone should ring shortly!
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-red-700">{callResult.error}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Squad Info */}
          <Card className="border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Squad Flow</CardTitle>
              <CardDescription className="text-slate-600">
                How the follow-up squad routes the call
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-100 text-blue-800">1</Badge>
                  <div>
                    <p className="font-medium text-slate-900">Greeter</p>
                    <p className="text-xs text-slate-500">
                      Confirms identity, asks how pet is doing
                    </p>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-slate-200 py-2 pl-6">
                  <p className="text-xs text-slate-400">
                    Routes based on response...
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-amber-100 text-amber-800">2</Badge>
                  <div>
                    <p className="font-medium text-slate-900">Assessor</p>
                    <p className="text-xs text-slate-500">
                      Clinical assessment for neutral/concerning responses
                    </p>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-slate-200 py-2 pl-6">
                  <p className="text-xs text-slate-400">
                    Evaluates symptoms...
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-800">3</Badge>
                  <div>
                    <p className="font-medium text-slate-900">Closer</p>
                    <p className="text-xs text-slate-500">
                      Provides warnings, recheck reminder, closes call
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Panel */}
          <Card className="border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900">Debug Info</CardTitle>
                  <CardDescription className="text-slate-600">
                    View the payload being sent to VAPI
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex items-center gap-2"
                >
                  <Code className="h-4 w-4" />
                  {showDebug ? "Hide" : "Show"}
                </Button>
              </div>
            </CardHeader>
            {showDebug && (
              <CardContent>
                <div className="max-h-[400px] overflow-auto rounded-lg bg-slate-900 p-4 text-slate-100">
                  <pre className="text-xs">
                    {JSON.stringify(
                      {
                        squadId: "d4305e87-1c5a-4d45-8953-2525e2d88244",
                        phoneNumber: phoneNumber || "(not set)",
                        // For permanent squads, variables go via top-level assistantOverrides
                        // This applies the variables to ALL squad members
                        assistantOverrides: {
                          variableValues: variables,
                        },
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Permanent squad calls use{" "}
                  <code className="rounded bg-slate-800 px-1">
                    assistantOverrides
                  </code>{" "}
                  to pass variables to ALL squad members
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
