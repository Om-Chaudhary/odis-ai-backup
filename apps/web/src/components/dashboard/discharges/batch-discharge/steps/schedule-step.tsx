import { Button } from "@odis-ai/ui/button";
import { Input } from "@odis-ai/ui/input";
import { Label } from "@odis-ai/ui/label";
import { Switch } from "@odis-ai/ui/switch";
import { Alert, AlertDescription } from "@odis-ai/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@odis-ai/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Phone,
  Clock,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Timer,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@odis-ai/utils";
import { ScheduleModeToggle } from "../components";
import { TIME_OPTIONS } from "../constants";
import type { ScheduleMode } from "../types";

interface ScheduleStepProps {
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
  onEmailsEnabledChange: (enabled: boolean) => void;
  onCallsEnabledChange: (enabled: boolean) => void;
  onEmailScheduleModeChange: (mode: ScheduleMode) => void;
  onCallScheduleModeChange: (mode: ScheduleMode) => void;
  onEmailDateChange: (date: string) => void;
  onCallDateChange: (date: string) => void;
  onEmailTimeChange: (time: string) => void;
  onCallTimeChange: (time: string) => void;
  onEmailMinutesChange: (minutes: number) => void;
  onCallMinutesChange: (minutes: number) => void;
  onResetToDefaults: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function ScheduleStep({
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
  onEmailsEnabledChange,
  onCallsEnabledChange,
  onEmailScheduleModeChange,
  onCallScheduleModeChange,
  onEmailDateChange,
  onCallDateChange,
  onEmailTimeChange,
  onCallTimeChange,
  onEmailMinutesChange,
  onCallMinutesChange,
  onResetToDefaults,
  onBack,
  onNext,
}: ScheduleStepProps) {
  const emailDateValue = emailScheduleTime
    ? format(emailScheduleTime, "yyyy-MM-dd")
    : "";
  const callDateValue = callScheduleTime
    ? format(callScheduleTime, "yyyy-MM-dd")
    : "";
  const emailTimeValue = emailScheduleTime
    ? `${emailScheduleTime.getHours().toString().padStart(2, "0")}:${emailScheduleTime.getMinutes().toString().padStart(2, "0")}`
    : "09:00";
  const callTimeValue = callScheduleTime
    ? `${callScheduleTime.getHours().toString().padStart(2, "0")}:${callScheduleTime.getMinutes().toString().padStart(2, "0")}`
    : "14:00";
  const minDate = format(new Date(), "yyyy-MM-dd");

  const emailScheduleValid =
    !emailsEnabled ||
    emailScheduleMode === "minutes" ||
    (emailScheduleMode === "datetime" && emailScheduleTime !== null);
  const callScheduleValid =
    !callsEnabled ||
    callScheduleMode === "minutes" ||
    (callScheduleMode === "datetime" && callScheduleTime !== null);
  const canProceed =
    (emailsEnabled || callsEnabled) && emailScheduleValid && callScheduleValid;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Schedule */}
        <Card className={cn(!emailsEnabled && "opacity-60")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "rounded-lg p-2.5",
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
                  <CardTitle className="text-lg">Email Schedule</CardTitle>
                  <CardDescription>
                    When to send discharge emails
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="emails-enabled"
                  checked={emailsEnabled}
                  onCheckedChange={onEmailsEnabledChange}
                />
                <Label htmlFor="emails-enabled" className="text-sm font-medium">
                  {emailsEnabled ? "Enabled" : "Disabled"}
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {emailsEnabled ? (
              <>
                <ScheduleModeToggle
                  mode={emailScheduleMode}
                  onModeChange={onEmailScheduleModeChange}
                />

                {emailScheduleMode === "minutes" ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Send in</label>
                      <div className="flex gap-2">
                        {[1, 5, 10, 30, 60].map((mins) => (
                          <Button
                            key={mins}
                            type="button"
                            variant={
                              emailMinutesFromNow === mins
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => onEmailMinutesChange(mins)}
                            className="flex-1"
                          >
                            {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Alert className="border-blue-100 bg-blue-50/50">
                      <Timer className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-700">
                        <strong>{selectedCasesWithEmail}</strong> emails will be
                        sent in{" "}
                        <strong>
                          {emailMinutesFromNow < 60
                            ? `${emailMinutesFromNow} minutes`
                            : `${emailMinutesFromNow / 60} hour`}
                        </strong>
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date</label>
                      <div className="relative">
                        <Calendar className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                          type="date"
                          className="pl-10"
                          value={emailDateValue}
                          min={minDate}
                          onChange={(e) => onEmailDateChange(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time</label>
                      <Select
                        value={emailTimeValue}
                        onValueChange={onEmailTimeChange}
                      >
                        <SelectTrigger>
                          <Clock className="mr-2 h-4 w-4" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {emailScheduleTime && (
                      <Alert className="border-blue-100 bg-blue-50/50">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-700">
                          <strong>{selectedCasesWithEmail}</strong> emails
                          scheduled for{" "}
                          <strong>
                            {format(
                              emailScheduleTime,
                              "EEEE, MMM d 'at' h:mm a",
                            )}
                          </strong>
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-muted-foreground py-4 text-center text-sm">
                Emails will not be sent for this batch
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call Schedule */}
        <Card className={cn(!callsEnabled && "opacity-60")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "rounded-lg p-2.5",
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
                  <CardTitle className="text-lg">Call Schedule</CardTitle>
                  <CardDescription>
                    When to make follow-up calls
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="calls-enabled"
                  checked={callsEnabled}
                  onCheckedChange={onCallsEnabledChange}
                />
                <Label htmlFor="calls-enabled" className="text-sm font-medium">
                  {callsEnabled ? "Enabled" : "Disabled"}
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {callsEnabled ? (
              <>
                <ScheduleModeToggle
                  mode={callScheduleMode}
                  onModeChange={onCallScheduleModeChange}
                />

                {callScheduleMode === "minutes" ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Call in</label>
                      <div className="flex gap-2">
                        {[1, 5, 10, 30, 60].map((mins) => (
                          <Button
                            key={mins}
                            type="button"
                            variant={
                              callMinutesFromNow === mins
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => onCallMinutesChange(mins)}
                            className="flex-1"
                          >
                            {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Alert className="border-green-100 bg-green-50/50">
                      <Timer className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">
                        <strong>{selectedCasesWithPhone}</strong> calls will be
                        made in{" "}
                        <strong>
                          {callMinutesFromNow < 60
                            ? `${callMinutesFromNow} minutes`
                            : `${callMinutesFromNow / 60} hour`}
                        </strong>
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date</label>
                      <div className="relative">
                        <Calendar className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                          type="date"
                          className="pl-10"
                          value={callDateValue}
                          min={minDate}
                          onChange={(e) => onCallDateChange(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time</label>
                      <Select
                        value={callTimeValue}
                        onValueChange={onCallTimeChange}
                      >
                        <SelectTrigger>
                          <Clock className="mr-2 h-4 w-4" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {callScheduleTime && (
                      <Alert className="border-green-100 bg-green-50/50">
                        <Phone className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          <strong>{selectedCasesWithPhone}</strong> calls
                          scheduled for{" "}
                          <strong>
                            {format(
                              callScheduleTime,
                              "EEEE, MMM d 'at' h:mm a",
                            )}
                          </strong>
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-muted-foreground py-4 text-center text-sm">
                Calls will not be made for this batch
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Warning if neither enabled */}
      {!emailsEnabled && !callsEnabled && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Warning:</strong> You have disabled both emails and calls.
            Please enable at least one communication type to proceed.
          </AlertDescription>
        </Alert>
      )}

      {/* Reset & Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onResetToDefaults} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={onNext} disabled={!canProceed} className="gap-2">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
