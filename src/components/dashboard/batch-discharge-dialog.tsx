"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  AlertCircle,
  Calendar,
  Clock,
  Mail,
  Phone,
  Send,
  Users,
} from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { addDays, format } from "date-fns";

interface BatchDischargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eligibleCases: Array<{
    id: string;
    patientName: string;
    ownerName: string | null;
    ownerEmail: string | null;
    ownerPhone: string | null;
    hasEmail: boolean;
    hasPhone: boolean;
  }>;
  onConfirm: (emailTime: string) => void;
  isProcessing?: boolean;
}

export function BatchDischargeDialog({
  open,
  onOpenChange,
  eligibleCases,
  onConfirm,
  isProcessing = false,
}: BatchDischargeDialogProps) {
  const [selectedTime, setSelectedTime] = useState("09:00");

  // Calculate schedule dates
  // Email: Next day (Day 1)
  // Call: 2 days after the email (Day 3) = 3 days from now
  const now = new Date();
  const emailDate = addDays(now, 1);
  const callDate = addDays(now, 3);

  // Count cases with email/phone
  const casesWithEmail = eligibleCases.filter((c) => c.hasEmail).length;
  const casesWithPhone = eligibleCases.filter((c) => c.hasPhone).length;

  const handleConfirm = () => {
    onConfirm(selectedTime);
  };

  // Generate time options (every hour from 6 AM to 8 PM)
  const timeOptions = [];
  for (let hour = 6; hour <= 20; hour++) {
    const time = `${hour.toString().padStart(2, "0")}:00`;
    const label = format(new Date().setHours(hour, 0, 0, 0), "h:mm a");
    timeOptions.push({ value: time, label });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Send className="h-5 w-5" />
            Send All Discharge Communications
          </DialogTitle>
          <DialogDescription>
            Schedule discharge emails and calls for all eligible cases at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-background rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Users className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">
                  Total Cases
                </span>
              </div>
              <p className="mt-1 text-2xl font-semibold">
                {eligibleCases.length}
              </p>
            </div>

            <div className="bg-background rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Emails</span>
              </div>
              <p className="mt-1 text-2xl font-semibold">{casesWithEmail}</p>
            </div>

            <div className="bg-background rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Phone className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Calls</span>
              </div>
              <p className="mt-1 text-2xl font-semibold">{casesWithPhone}</p>
            </div>
          </div>

          <Separator />

          {/* Schedule Configuration */}
          <div className="space-y-4">
            <h3 className="font-medium">Schedule Settings</h3>

            {/* Email Schedule */}
            <div className="space-y-2">
              <Label htmlFor="email-time" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Schedule
              </Label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3" />
                    {format(emailDate, "EEEE, MMMM d, yyyy")}
                  </div>
                </div>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger id="email-time" className="w-[180px]">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-muted-foreground text-sm">
                Discharge emails will be sent tomorrow at the selected time
              </p>
            </div>

            {/* Call Schedule */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Call Schedule
              </Label>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3" />
                <span>{format(callDate, "EEEE, MMMM d, yyyy")}</span>
                <Badge variant="secondary">2:00 PM</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Follow-up calls will be placed 2 days after the email is sent
              </p>
            </div>
          </div>

          <Separator />

          {/* Cases Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Cases to Process</h3>
              <Badge variant="outline">{eligibleCases.length} cases</Badge>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-lg border">
              <div className="divide-y">
                {eligibleCases.slice(0, 10).map((caseData) => (
                  <div
                    key={caseData.id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">
                        {caseData.patientName}
                      </span>
                      <span className="text-muted-foreground mx-2">•</span>
                      <span className="text-muted-foreground">
                        {caseData.ownerName ?? "No owner name"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {caseData.hasEmail && (
                        <Badge variant="secondary" className="h-5">
                          <Mail className="h-3 w-3" />
                        </Badge>
                      )}
                      {caseData.hasPhone && (
                        <Badge variant="secondary" className="h-5">
                          <Phone className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {eligibleCases.length > 10 && (
                  <div className="text-muted-foreground px-3 py-2 text-center text-sm">
                    ...and {eligibleCases.length - 10} more cases
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Warnings */}
          {(casesWithEmail < eligibleCases.length ||
            casesWithPhone < eligibleCases.length) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Some cases are missing contact information:
                <ul className="mt-1 list-inside list-disc text-sm">
                  {casesWithEmail < eligibleCases.length && (
                    <li>
                      {eligibleCases.length - casesWithEmail} cases without
                      email addresses
                    </li>
                  )}
                  {casesWithPhone < eligibleCases.length && (
                    <li>
                      {eligibleCases.length - casesWithPhone} cases without
                      phone numbers
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Processing Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This will schedule {casesWithEmail} discharge emails and{" "}
              {casesWithPhone} follow-up calls. The process will continue even
              if some cases fail, and you&apos;ll receive a detailed report when
              complete.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || eligibleCases.length === 0}
          >
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Schedule All Discharges
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
