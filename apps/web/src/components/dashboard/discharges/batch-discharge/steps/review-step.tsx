import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Checkbox } from "@odis-ai/shared/ui/checkbox";
import { Alert, AlertDescription } from "@odis-ai/shared/ui/alert";
import { ScrollArea } from "@odis-ai/shared/ui/scroll-area";
import { Separator } from "@odis-ai/shared/ui/separator";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@odis-ai/shared/ui/card";
import {
  ArrowLeft,
  Send,
  Mail,
  Phone,
  Users,
  TestTube,
  AlertOctagon,
  Sparkles,
  SkipForward,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@odis-ai/shared/util";
import type { BatchEligibleCase } from "@odis-ai/shared/types";
import type { ScheduleMode } from "../types";

interface ReviewStepProps {
  selectedCases: Set<string>;
  skippedCases: Set<string>;
  selectedCasesData: BatchEligibleCase[];
  emailsEnabled: boolean;
  callsEnabled: boolean;
  emailScheduleMode: ScheduleMode;
  callScheduleMode: ScheduleMode;
  emailScheduleTime: Date | null;
  callScheduleTime: Date | null;
  emailMinutesFromNow: number;
  callMinutesFromNow: number;
  selectedCasesWithEmail: number;
  selectedCasesWithPhone: number;
  testModeEnabled: boolean;
  testContactEmail?: string;
  testContactPhone?: string;
  isProcessing: boolean;
  onToggleSkip: (caseId: string) => void;
  onClearSkips: () => void;
  onBack: () => void;
  onProcess: () => void;
}

export function ReviewStep({
  selectedCases,
  skippedCases,
  selectedCasesData,
  emailsEnabled,
  callsEnabled,
  emailScheduleMode,
  callScheduleMode,
  emailScheduleTime,
  callScheduleTime,
  emailMinutesFromNow,
  callMinutesFromNow,
  selectedCasesWithEmail,
  selectedCasesWithPhone,
  testModeEnabled,
  testContactEmail,
  testContactPhone,
  isProcessing,
  onToggleSkip,
  onClearSkips,
  onBack,
  onProcess,
}: ReviewStepProps) {
  return (
    <>
      {/* Test Mode Alert */}
      {testModeEnabled && (
        <Alert className="border-amber-300 bg-amber-50">
          <TestTube className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong className="font-semibold">Test Mode Active:</strong> All
            communications will be redirected to your test contacts.
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              {testContactEmail && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <strong>{testContactEmail}</strong>
                </span>
              )}
              {testContactPhone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <strong>{testContactPhone}</strong>
                </span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2.5">
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle>Ready to Send</CardTitle>
              <CardDescription>
                Review your batch discharge settings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <Users className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{selectedCases.size}</p>
                  <p className="text-muted-foreground text-sm">
                    Cases Selected
                  </p>
                </div>
              </div>
            </div>
            <div
              className={cn(
                "rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4",
                !emailsEnabled && "opacity-50",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "rounded-lg p-2",
                    emailsEnabled ? "bg-blue-100" : "bg-slate-100",
                  )}
                >
                  <Mail
                    className={cn(
                      "h-5 w-5",
                      emailsEnabled ? "text-blue-600" : "text-slate-400",
                    )}
                  />
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {emailsEnabled ? selectedCasesWithEmail : 0}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {emailsEnabled ? "Emails to Send" : "Emails Disabled"}
                  </p>
                </div>
              </div>
            </div>
            <div
              className={cn(
                "rounded-xl border bg-gradient-to-br from-green-50 to-white p-4",
                !callsEnabled && "opacity-50",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "rounded-lg p-2",
                    callsEnabled ? "bg-green-100" : "bg-slate-100",
                  )}
                >
                  <Phone
                    className={cn(
                      "h-5 w-5",
                      callsEnabled ? "text-green-600" : "text-slate-400",
                    )}
                  />
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {callsEnabled ? selectedCasesWithPhone : 0}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {callsEnabled ? "Calls to Make" : "Calls Disabled"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Schedule Summary */}
          <div className="space-y-4">
            <h4 className="font-medium">Schedule Summary</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4",
                  !emailsEnabled && "opacity-50",
                )}
              >
                <div
                  className={cn(
                    "rounded-full p-2",
                    emailsEnabled ? "bg-blue-100" : "bg-slate-100",
                  )}
                >
                  <Mail
                    className={cn(
                      "h-4 w-4",
                      emailsEnabled ? "text-blue-600" : "text-slate-400",
                    )}
                  />
                </div>
                <div>
                  <p className="font-medium">Emails</p>
                  {emailsEnabled ? (
                    emailScheduleMode === "minutes" ? (
                      <p className="text-muted-foreground text-sm">
                        In{" "}
                        {emailMinutesFromNow < 60
                          ? `${emailMinutesFromNow} minutes`
                          : `${emailMinutesFromNow / 60} hour`}
                      </p>
                    ) : (
                      <>
                        <p className="text-muted-foreground text-sm">
                          {emailScheduleTime
                            ? format(emailScheduleTime, "EEEE, MMMM d, yyyy")
                            : "Not scheduled"}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {emailScheduleTime
                            ? format(emailScheduleTime, "h:mm a")
                            : ""}
                        </p>
                      </>
                    )
                  ) : (
                    <p className="text-muted-foreground text-sm">Disabled</p>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4",
                  !callsEnabled && "opacity-50",
                )}
              >
                <div
                  className={cn(
                    "rounded-full p-2",
                    callsEnabled ? "bg-green-100" : "bg-slate-100",
                  )}
                >
                  <Phone
                    className={cn(
                      "h-4 w-4",
                      callsEnabled ? "text-green-600" : "text-slate-400",
                    )}
                  />
                </div>
                <div>
                  <p className="font-medium">Follow-up Calls</p>
                  {callsEnabled ? (
                    callScheduleMode === "minutes" ? (
                      <p className="text-muted-foreground text-sm">
                        In{" "}
                        {callMinutesFromNow < 60
                          ? `${callMinutesFromNow} minutes`
                          : `${callMinutesFromNow / 60} hour`}
                      </p>
                    ) : (
                      <>
                        <p className="text-muted-foreground text-sm">
                          {callScheduleTime
                            ? format(callScheduleTime, "EEEE, MMMM d, yyyy")
                            : "Not scheduled"}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {callScheduleTime
                            ? format(callScheduleTime, "h:mm a")
                            : ""}
                        </p>
                      </>
                    )
                  ) : (
                    <p className="text-muted-foreground text-sm">Disabled</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Cases Preview - With Skip Option */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                Selected Cases ({selectedCases.size - skippedCases.size} to
                process, {skippedCases.size} to skip)
              </h4>
              {skippedCases.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSkips}
                  className="text-muted-foreground text-xs"
                >
                  Clear all skips
                </Button>
              )}
            </div>
            <Alert className="border-amber-200 bg-amber-50">
              <AlertOctagon className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                <strong>Review carefully:</strong> Mark any emergencies,
                euthanasias, or sensitive cases to skip them before processing.
              </AlertDescription>
            </Alert>
            <ScrollArea className="h-64 rounded-lg border">
              <div className="divide-y p-2">
                {selectedCasesData.map((caseData) => {
                  const isSkipped = skippedCases.has(caseData.id);
                  return (
                    <div
                      key={caseData.id}
                      className={cn(
                        "flex items-center justify-between px-2 py-3 transition-colors",
                        isSkipped && "bg-slate-50 opacity-60",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={!isSkipped}
                          onCheckedChange={() => onToggleSkip(caseData.id)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-medium",
                                isSkipped && "line-through",
                              )}
                            >
                              {caseData.patientName}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              — {caseData.ownerName}
                            </span>
                          </div>
                          {isSkipped && (
                            <Badge
                              variant="outline"
                              className="mt-1 border-amber-300 bg-amber-50 text-amber-700"
                            >
                              <SkipForward className="mr-1 h-3 w-3" />
                              Will be skipped
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {caseData.hasEmail && (
                            <Mail className="h-3.5 w-3.5 text-blue-500" />
                          )}
                          {caseData.hasPhone && (
                            <Phone className="h-3.5 w-3.5 text-green-500" />
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleSkip(caseData.id)}
                          className={cn(
                            "h-8 px-2 text-xs",
                            isSkipped
                              ? "text-emerald-600 hover:text-emerald-700"
                              : "text-amber-600 hover:text-amber-700",
                          )}
                        >
                          {isSkipped ? (
                            <>
                              <RotateCcw className="mr-1 h-3 w-3" />
                              Include
                            </>
                          ) : (
                            <>
                              <SkipForward className="mr-1 h-3 w-3" />
                              Skip
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-slate-50/30 p-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            size="lg"
            onClick={onProcess}
            disabled={
              isProcessing || selectedCases.size - skippedCases.size === 0
            }
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="h-4 w-4" />
            Process {selectedCases.size - skippedCases.size} Cases
            {skippedCases.size > 0 && ` (${skippedCases.size} skipped)`}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
