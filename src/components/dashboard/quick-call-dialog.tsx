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
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { PatientSelect } from "./patient-select";
import { sendCall, scheduleCall } from "~/server/actions/retell";
import { Phone, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "~/hooks/use-toast";

interface QuickCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onAddPatient?: () => void;
}

export function QuickCallDialog({
  open,
  onOpenChange,
  onSuccess,
  onAddPatient,
}: QuickCallDialogProps) {
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<
    string | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Manual phone number (fallback if no patient selected)
  const [manualPhone, setManualPhone] = useState("");

  const handleCallNow = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    if (!selectedPatientId && !manualPhone) {
      toast({
        title: "Error",
        description: "Please select a patient or enter a phone number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Send call with patient ID or manual phone
      const result = await sendCall({
        phoneNumber: manualPhone ?? "", // Will be overridden by patient data if patientId provided
        patientId: selectedPatientId,
        variables: {},
        metadata: {},
        retryOnBusy: false,
        agentId: "",
      });

      if (result.success) {
        setSuccessMessage("Call initiated successfully!");
        setShowSuccess(true);

        // Show success toast
        toast({
          title: "Call Initiated",
          description: `Call to ${result.data?.phoneNumber} has been started`,
        });

        // Close dialog and reset after delay
        setTimeout(() => {
          setShowSuccess(false);
          setSelectedPatientId(undefined);
          setManualPhone("");
          onOpenChange(false);
          onSuccess?.();
        }, 1500);
      } else {
        toast({
          title: "Call Failed",
          description: result.error ?? "Failed to initiate call",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchedule = async () => {
    // Validate patient selected (scheduling requires patient)
    if (!selectedPatientId) {
      toast({
        title: "Error",
        description: "Please select a patient to schedule a call",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await scheduleCall({
        patientId: selectedPatientId,
      });

      if (result.success) {
        setSuccessMessage("Call scheduled successfully!");
        setShowSuccess(true);

        // Show success toast
        toast({
          title: "Call Scheduled",
          description: `Call for ${result.data?.petName} has been queued`,
        });

        // Close dialog and reset after delay
        setTimeout(() => {
          setShowSuccess(false);
          setSelectedPatientId(undefined);
          setManualPhone("");
          onOpenChange(false);
          onSuccess?.();
        }, 1500);
      } else {
        toast({
          title: "Schedule Failed",
          description: result.error ?? "Failed to schedule call",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedPatientId(undefined);
      setManualPhone("");
      setShowSuccess(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-semibold">{successMessage}</h3>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                New Call
              </DialogTitle>
              <DialogDescription>
                Select a patient to call immediately or schedule for later.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCallNow} className="space-y-6">
              <div className="space-y-4">
                {/* Patient Selection */}
                <PatientSelect
                  value={selectedPatientId}
                  onValueChange={setSelectedPatientId}
                  onAddNew={onAddPatient}
                  label="Patient (required for scheduling)"
                  placeholder="Select a patient"
                />

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background text-muted-foreground px-2">
                      Or call manually
                    </span>
                  </div>
                </div>

                {/* Manual Phone Entry */}
                <div className="space-y-2">
                  <Label htmlFor="manual-phone">Phone Number</Label>
                  <Input
                    id="manual-phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    disabled={!!selectedPatientId || isSubmitting}
                  />
                  <p className="text-muted-foreground text-xs">
                    Only needed if calling without selecting a patient
                  </p>
                </div>

                {/* Warning if no patient selected for manual phone */}
                {!selectedPatientId && manualPhone && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-50 p-3 dark:bg-amber-950/20">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <div className="text-sm text-amber-600 dark:text-amber-400">
                      <p className="font-medium">Manual call only</p>
                      <p className="mt-1 text-xs">
                        Without a patient selected, you can only call now (not
                        schedule).
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>

                {/* Schedule button - only enabled when patient selected */}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSchedule}
                  disabled={isSubmitting || !selectedPatientId}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Schedule for Later
                    </>
                  )}
                </Button>

                {/* Call Now button */}
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || (!selectedPatientId && !manualPhone)
                  }
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Calling...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-4 w-4" />
                      Call Now
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
