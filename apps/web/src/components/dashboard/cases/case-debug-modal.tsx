"use client";

import { Bug } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@odis-ai/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Badge } from "@odis-ai/ui/badge";
import { Separator } from "@odis-ai/ui/separator";
import type { BackendCase } from "@odis-ai/types";
import { format } from "date-fns";

// Helper for concise date formatting
function formatDateShort(date: string | null): string {
  if (!date) return "—";
  return format(new Date(date), "MMM d, HH:mm");
}

interface CaseDebugModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: BackendCase | null;
}

export function CaseDebugModal({
  open,
  onOpenChange,
  caseData,
}: CaseDebugModalProps) {
  if (!caseData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-[95vw] overflow-y-auto p-4 sm:w-[90vw] sm:max-w-7xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bug className="h-4 w-4" />
            Debug: Case {caseData.id}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Complete case data including all joined relations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Case Details Section */}
          <div className="space-y-2">
            <div className="border-b pb-1">
              <h2 className="text-muted-foreground text-sm font-bold tracking-wide uppercase">
                Case Details
              </h2>
            </div>

            {/* Case Basic Info */}
            <Card>
              <CardHeader className="p-2 pb-1">
                <CardTitle className="text-xs font-semibold">
                  Case Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="h-5 px-1.5 py-0.5 font-mono text-[10px]"
                  >
                    {caseData.id.slice(0, 8)}...
                  </Badge>
                  <Badge
                    variant="outline"
                    className="h-5 px-1.5 py-0.5 text-[10px]"
                  >
                    {caseData.status}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="h-5 px-1.5 py-0.5 text-[10px]"
                  >
                    {formatDateShort(caseData.created_at)}
                  </Badge>
                  {caseData.scheduled_at && (
                    <Badge
                      variant="secondary"
                      className="h-5 px-1.5 py-0.5 text-[10px]"
                    >
                      {formatDateShort(caseData.scheduled_at)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Patients */}
            <Card>
              <CardHeader className="p-2 pb-1">
                <CardTitle className="text-xs font-semibold">
                  Patients ({caseData.patients.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                <div className="space-y-1.5">
                  {caseData.patients.map((patient, index) => (
                    <div key={patient.id}>
                      {index > 0 && <Separator className="my-1.5" />}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="h-5 px-1.5 py-0.5 font-mono text-[10px]"
                        >
                          {patient.id.slice(0, 8)}...
                        </Badge>
                        <Badge
                          variant="default"
                          className="h-5 px-1.5 py-0.5 text-[10px]"
                        >
                          {patient.name}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="h-5 px-1.5 py-0.5 text-[10px]"
                        >
                          {patient.species}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="h-5 px-1.5 py-0.5 text-[10px]"
                        >
                          {patient.breed}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="h-5 px-1.5 py-0.5 text-[10px]"
                        >
                          {patient.owner_name}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="h-5 px-1.5 py-0.5 text-[10px]"
                        >
                          {patient.owner_phone}
                        </Badge>
                        {patient.owner_email && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 py-0.5 text-[10px]"
                          >
                            {patient.owner_email}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Discharge Summaries */}
            <Card>
              <CardHeader className="p-2 pb-1">
                <CardTitle className="text-xs font-semibold">
                  Discharge Summaries (
                  {caseData.discharge_summaries?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                {!caseData.discharge_summaries ||
                caseData.discharge_summaries.length === 0 ? (
                  <p className="text-muted-foreground text-[10px] italic">
                    No discharge summaries
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {caseData.discharge_summaries.map((summary, index) => (
                      <div key={summary.id}>
                        {index > 0 && <Separator className="my-1.5" />}
                        <div className="space-y-1 text-xs">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="h-5 px-1.5 py-0.5 font-mono text-[10px]"
                            >
                              {summary.id.slice(0, 8)}...
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 py-0.5 text-[10px]"
                            >
                              {formatDateShort(summary.created_at)}
                            </Badge>
                          </div>
                          <div>
                            <pre className="bg-muted max-h-32 overflow-auto rounded p-2 text-[10px] leading-tight">
                              {summary.content}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transcriptions (if available) */}
            {(
              caseData as unknown as {
                transcriptions?: Array<{ id: string; transcript: string }>;
              }
            ).transcriptions && (
              <Card>
                <CardHeader className="p-2 pb-1">
                  <CardTitle className="text-xs font-semibold">
                    Transcriptions (
                    {(
                      caseData as unknown as {
                        transcriptions?: Array<{
                          id: string;
                          transcript: string;
                        }>;
                      }
                    ).transcriptions?.length ?? 0}
                    )
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  {(
                    caseData as unknown as {
                      transcriptions?: Array<{
                        id: string;
                        transcript: string;
                      }>;
                    }
                  ).transcriptions?.length === 0 ? (
                    <p className="text-muted-foreground text-[10px] italic">
                      No transcriptions
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {(
                        caseData as unknown as {
                          transcriptions?: Array<{
                            id: string;
                            transcript: string;
                          }>;
                        }
                      ).transcriptions?.map((transcription, index) => (
                        <div key={transcription.id}>
                          {index > 0 && <Separator className="my-1.5" />}
                          <div className="space-y-1 text-xs">
                            <div className="mb-1 flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="h-5 px-1.5 py-0.5 font-mono text-[10px]"
                              >
                                {transcription.id.slice(0, 8)}...
                              </Badge>
                            </div>
                            <div>
                              <pre className="bg-muted max-h-32 overflow-auto rounded p-2 text-[10px] leading-tight">
                                {transcription.transcript}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* SOAP Notes (if available) */}
            {(
              caseData as unknown as {
                soap_notes?: Array<{
                  id: string;
                  subjective: string | null;
                  objective: string | null;
                  assessment: string | null;
                  plan: string | null;
                }>;
              }
            ).soap_notes && (
              <Card>
                <CardHeader className="p-2 pb-1">
                  <CardTitle className="text-xs font-semibold">
                    SOAP Notes (
                    {(
                      caseData as unknown as {
                        soap_notes?: Array<{
                          id: string;
                          subjective: string | null;
                          objective: string | null;
                          assessment: string | null;
                          plan: string | null;
                        }>;
                      }
                    ).soap_notes?.length ?? 0}
                    )
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  {(
                    caseData as unknown as {
                      soap_notes?: Array<{
                        id: string;
                        subjective: string | null;
                        objective: string | null;
                        assessment: string | null;
                        plan: string | null;
                      }>;
                    }
                  ).soap_notes?.length === 0 ? (
                    <p className="text-muted-foreground text-[10px] italic">
                      No SOAP notes
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {(
                        caseData as unknown as {
                          soap_notes?: Array<{
                            id: string;
                            subjective: string | null;
                            objective: string | null;
                            assessment: string | null;
                            plan: string | null;
                          }>;
                        }
                      ).soap_notes?.map((note, index) => (
                        <div key={note.id}>
                          {index > 0 && <Separator className="my-1.5" />}
                          <div className="space-y-1 text-xs">
                            <div className="mb-1 flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="h-5 px-1.5 py-0.5 font-mono text-[10px]"
                              >
                                {note.id.slice(0, 8)}...
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Badge
                                  variant="secondary"
                                  className="mb-1 h-4 px-1 py-0 text-[10px]"
                                >
                                  S
                                </Badge>
                                <pre className="bg-muted max-h-24 overflow-auto rounded p-1.5 text-[10px] leading-tight">
                                  {note.subjective ?? "—"}
                                </pre>
                              </div>
                              <div>
                                <Badge
                                  variant="secondary"
                                  className="mb-1 h-4 px-1 py-0 text-[10px]"
                                >
                                  O
                                </Badge>
                                <pre className="bg-muted max-h-24 overflow-auto rounded p-1.5 text-[10px] leading-tight">
                                  {note.objective ?? "—"}
                                </pre>
                              </div>
                              <div>
                                <Badge
                                  variant="secondary"
                                  className="mb-1 h-4 px-1 py-0 text-[10px]"
                                >
                                  A
                                </Badge>
                                <pre className="bg-muted max-h-24 overflow-auto rounded p-1.5 text-[10px] leading-tight">
                                  {note.assessment ?? "—"}
                                </pre>
                              </div>
                              <div>
                                <Badge
                                  variant="secondary"
                                  className="mb-1 h-4 px-1 py-0 text-[10px]"
                                >
                                  P
                                </Badge>
                                <pre className="bg-muted max-h-24 overflow-auto rounded p-1.5 text-[10px] leading-tight">
                                  {note.plan ?? "—"}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Scheduled Stuff Section */}
          <div className="space-y-2">
            <div className="border-b pb-1">
              <h2 className="text-muted-foreground text-sm font-bold tracking-wide uppercase">
                Scheduled Stuff
              </h2>
            </div>

            {/* Scheduled Discharge Calls */}
            <Card>
              <CardHeader className="p-2 pb-1">
                <CardTitle className="text-xs font-semibold">
                  Scheduled Discharge Calls (
                  {caseData.scheduled_discharge_calls.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                {caseData.scheduled_discharge_calls.length === 0 ? (
                  <p className="text-muted-foreground text-[10px] italic">
                    No scheduled calls
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {caseData.scheduled_discharge_calls.map((call, index) => (
                      <div key={call.id}>
                        {index > 0 && <Separator className="my-1.5" />}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 py-0.5 font-mono text-[10px]"
                          >
                            {call.id.slice(0, 8)}...
                          </Badge>
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 py-0.5 text-[10px]"
                          >
                            {call.status ?? "null"}
                          </Badge>
                          {call.scheduled_for && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 py-0.5 text-[10px]"
                            >
                              {formatDateShort(call.scheduled_for)}
                            </Badge>
                          )}
                          {call.ended_at && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 py-0.5 text-[10px]"
                            >
                              Ended: {formatDateShort(call.ended_at)}
                            </Badge>
                          )}
                          {call.vapi_call_id && (
                            <Badge
                              variant="outline"
                              className="h-5 px-1.5 py-0.5 font-mono text-[10px]"
                            >
                              VAPI: {call.vapi_call_id.slice(0, 8)}...
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scheduled Discharge Emails */}
            <Card>
              <CardHeader className="p-2 pb-1">
                <CardTitle className="text-xs font-semibold">
                  Scheduled Discharge Emails (
                  {caseData.scheduled_discharge_emails.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                {caseData.scheduled_discharge_emails.length === 0 ? (
                  <p className="text-muted-foreground text-[10px] italic">
                    No scheduled emails
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {caseData.scheduled_discharge_emails.map((email, index) => (
                      <div key={email.id}>
                        {index > 0 && <Separator className="my-1.5" />}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 py-0.5 font-mono text-[10px]"
                          >
                            {email.id.slice(0, 8)}...
                          </Badge>
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 py-0.5 text-[10px]"
                          >
                            {email.status ?? "null"}
                          </Badge>
                          {email.scheduled_for && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 py-0.5 text-[10px]"
                            >
                              {formatDateShort(email.scheduled_for)}
                            </Badge>
                          )}
                          {email.sent_at && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 py-0.5 text-[10px]"
                            >
                              Sent: {formatDateShort(email.sent_at)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Raw JSON */}
          <Card>
            <CardHeader className="p-2 pb-1">
              <CardTitle className="text-xs font-semibold">Raw JSON</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <pre className="bg-muted max-h-64 overflow-auto rounded p-2 text-[10px] leading-tight">
                {JSON.stringify(caseData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
