"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  Dog,
  Cat,
  FileText,
  User,
  Stethoscope,
  Clock,
  DollarSign,
  Activity,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Play,
} from "lucide-react";
import { format } from "date-fns";
import { api } from "~/trpc/client";
import { toast } from "sonner";
import { DischargeStatusBadge } from "./discharge-status-badge";
import { SOAPNoteDisplay } from "./soap-note-display";
import { CallAudioPlayer } from "./call-audio-player";
import { SyncedTranscript } from "./synced-transcript";
import type { DischargeSettings, TranscriptMessage } from "~/types/dashboard";
import { cn, formatDuration } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

interface CaseDetailClientProps {
  caseId: string;
}

/**
 * Check if a value is a placeholder
 */
function isPlaceholder(value: string | undefined | null): boolean {
  if (!value) return false;
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
 * Get effective contact value
 */
function getEffectiveContact(
  patientValue: string | undefined | null,
  testValue: string | undefined | null,
  testModeEnabled: boolean,
): string | undefined | null {
  if (testModeEnabled && testValue && testValue.trim().length > 0) {
    return testValue;
  }
  return patientValue;
}

export function CaseDetailClient({ caseId }: CaseDetailClientProps) {
  const router = useRouter();
  const isProcessingRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSecondaryOpen, setIsSecondaryOpen] = useState(false);

  // Fetch case detail
  const {
    data: caseData,
    isLoading,
    error,
    refetch,
  } = api.cases.getCaseDetail.useQuery(
    { id: caseId },
    { enabled: !!caseId, refetchInterval: 5000 }, // Poll for status updates
  );

  // Fetch discharge settings
  const { data: settingsData } = api.cases.getDischargeSettings.useQuery();

  const triggerDischargeMutation = api.cases.triggerDischarge.useMutation({
    onSuccess: (result) => {
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning) => toast.warning(warning));
      }
      toast.success("Call initiated successfully");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initiate call");
    },
    onSettled: () => {
      isProcessingRef.current = false;
    },
  });

  const settings: DischargeSettings = settingsData ?? {
    clinicName: "",
    clinicPhone: "",
    clinicEmail: "",
    emergencyPhone: "",
    vetName: "",
    testModeEnabled: false,
    testContactName: "",
    testContactEmail: "",
    testContactPhone: "",
    voicemailDetectionEnabled: false,
  };

  // Extract patient data
  const patient = caseData?.patients?.[0] as
    | {
        id: string;
        name: string;
        species: string;
        breed: string;
        owner_name: string;
        owner_email: string | null;
        owner_phone: string;
      }
    | undefined;

  const handleTriggerCall = async () => {
    if (!caseData || !patient || isProcessingRef.current) return;

    const phone = getEffectiveContact(
      patient.owner_phone,
      settings.testContactPhone,
      settings.testModeEnabled ?? false,
    );

    if (!phone || isPlaceholder(phone)) {
      toast.error(
        settings.testModeEnabled
          ? "Test phone number is required"
          : "Phone number is required",
      );
      return;
    }

    isProcessingRef.current = true;
    toast.info("Initiating discharge call...");
    triggerDischargeMutation.mutate({
      caseId: caseData.id,
      patientId: patient.id,
      patientData: {
        ownerName: patient.owner_name,
        ownerEmail: patient.owner_email ?? undefined,
        ownerPhone: phone,
      },
      dischargeType: "call",
    });
  };

  // Determine latest call
  const latestCall = caseData?.scheduled_discharge_calls?.[0]; // Backend should sort by created_at desc
  const SpeciesIcon = patient?.species?.toLowerCase() === "feline" ? Cat : Dog;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading case...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="space-y-4 p-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="py-16 text-center">
          <h2 className="text-2xl font-bold">Case not found</h2>
          <p className="text-muted-foreground mt-2">{error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground -ml-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex items-start gap-4">
            <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm">
              {patient ? (
                <SpeciesIcon className="h-8 w-8" />
              ) : (
                <FileText className="h-8 w-8" />
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {patient?.name && !isPlaceholder(patient.name)
                  ? patient.name
                  : "Unknown Patient"}
              </h1>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Badge variant="outline" className="capitalize">
                  {caseData.status}
                </Badge>
                <span>•</span>
                <span>
                  Created {format(new Date(caseData.created_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex gap-2">
          {(!latestCall ||
            latestCall.status === "completed" ||
            latestCall.status === "failed" ||
            latestCall.status === "cancelled") && (
            <Button
              size="lg"
              className="shadow-primary/20 shadow-lg transition-all hover:scale-105"
              onClick={handleTriggerCall}
              disabled={
                triggerDischargeMutation.isPending || isProcessingRef.current
              }
            >
              {triggerDischargeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Phone className="mr-2 h-4 w-4" />
              )}
              Start Discharge Call
            </Button>
          )}
        </div>
      </div>

      {/* Call Status / Player Section - The Hero */}
      {latestCall ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content (2 cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Status Banner */}
            <Card
              className={cn(
                "overflow-hidden border-l-4",
                latestCall.status === "completed"
                  ? "border-l-green-500"
                  : latestCall.status === "failed"
                    ? "border-l-red-500"
                    : latestCall.status === "in_progress"
                      ? "border-l-blue-500"
                      : "border-l-slate-300",
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {latestCall.status === "completed"
                          ? "Call Completed"
                          : latestCall.status === "failed"
                            ? "Call Failed"
                            : latestCall.status === "in_progress"
                              ? "Call in Progress"
                              : latestCall.status === "ringing"
                                ? "Ringing..."
                                : "Call Queued"}
                      </h3>
                      <DischargeStatusBadge
                        status={latestCall.status}
                        type="call"
                      />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {latestCall.started_at && (
                        <>
                          Started{" "}
                          {format(new Date(latestCall.started_at), "h:mm a")}
                        </>
                      )}
                      {latestCall.ended_reason && (
                        <> • Reason: {latestCall.ended_reason}</>
                      )}
                    </p>
                  </div>

                  {latestCall.status === "in_progress" && (
                    <div className="flex h-3 w-3">
                      <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
                    </div>
                  )}
                </div>

                {/* Metrics Row */}
                {latestCall.status === "completed" && (
                  <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-50 p-2 text-blue-600">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-medium">
                          Duration
                        </p>
                        <p className="font-semibold">
                          {formatDuration(latestCall.duration_seconds ?? 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-green-50 p-2 text-green-600">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-medium">
                          Cost
                        </p>
                        <p className="font-semibold">
                          $
                          {typeof latestCall.cost === "number"
                            ? latestCall.cost.toFixed(4)
                            : "0.00"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "rounded-full p-2",
                          latestCall.user_sentiment === "positive"
                            ? "bg-green-50 text-green-600"
                            : latestCall.user_sentiment === "negative"
                              ? "bg-red-50 text-red-600"
                              : "bg-slate-50 text-slate-600",
                        )}
                      >
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-medium">
                          Sentiment
                        </p>
                        <p className="font-semibold capitalize">
                          {latestCall.user_sentiment ?? "Neutral"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            {latestCall.summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="text-primary h-5 w-5" />
                    Call Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-slate-700">
                    {latestCall.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Audio Player & Transcript */}
            {latestCall.recording_url && (
              <div className="space-y-6">
                <CallAudioPlayer
                  url={
                    latestCall.stereo_recording_url ?? latestCall.recording_url
                  }
                  duration={latestCall.duration_seconds ?? undefined}
                  onTimeUpdate={setCurrentTime}
                />

                <Card className="border-slate-100 shadow-sm">
                  <CardHeader className="border-b bg-slate-50/50 pb-3">
                    <CardTitle className="text-base font-medium">
                      Live Transcript
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <SyncedTranscript
                      messages={
                        (latestCall.transcript_messages as TranscriptMessage[]) ??
                        []
                      }
                      currentTime={currentTime}
                      onMessageClick={(_time) => {
                        // This will be handled by passing a seek function to the audio player ideally,
                        // For now, just visual sync
                      }}
                      className="h-[500px] p-4"
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Patient Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Name</p>
                    <p className="font-medium">{patient?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Species</p>
                    <p className="font-medium">{patient?.species ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Breed</p>
                    <p className="font-medium">{patient?.breed ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Owner</p>
                    <p className="font-medium">{patient?.owner_name}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">Contact</p>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Phone className="text-muted-foreground h-3 w-3" />
                      <span>{patient?.owner_phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="text-muted-foreground h-3 w-3" />
                      <span>{patient?.owner_email}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Evaluation */}
            {latestCall.success_evaluation && (
              <Card
                className={cn(
                  "border-l-4",
                  typeof latestCall.success_evaluation === "string" &&
                    latestCall.success_evaluation
                      .toLowerCase()
                      .includes("success")
                    ? "border-l-green-500"
                    : "border-l-amber-500",
                )}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {typeof latestCall.success_evaluation === "string" &&
                    latestCall.success_evaluation
                      .toLowerCase()
                      .includes("success") ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    Success Evaluation
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">
                  {latestCall.success_evaluation}
                </CardContent>
              </Card>
            )}

            {/* Clinical Context (Collapsible) */}
            <Collapsible
              open={isSecondaryOpen}
              onOpenChange={setIsSecondaryOpen}
            >
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Clinical Context
                  </span>
                  {isSecondaryOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                {caseData.discharge_summaries?.[0] && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">
                        Discharge Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground max-h-40 overflow-y-auto py-3 text-xs">
                      {caseData.discharge_summaries[0].content}
                    </CardContent>
                  </Card>
                )}
                {caseData.soap_notes?.[0] && (
                  <SOAPNoteDisplay notes={[caseData.soap_notes[0]]} />
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center">
          <div className="bg-muted rounded-full p-4">
            <Phone className="text-muted-foreground h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No Calls Yet</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Start a discharge call to see live transcripts, audio recording, and
            AI analysis here.
          </p>
          <Button className="mt-6" onClick={handleTriggerCall}>
            <Play className="mr-2 h-4 w-4" />
            Start First Call
          </Button>
        </div>
      )}
    </div>
  );
}
