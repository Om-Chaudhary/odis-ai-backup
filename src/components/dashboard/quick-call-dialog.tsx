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
import { Textarea } from "~/components/ui/textarea";
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

  // Form fields for scheduled calls
  const [phoneNumber, setPhoneNumber] = useState("");
  const [petName, setPetName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [vetName, setVetName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [dischargeSummary, setDischargeSummary] = useState("");

  const handleCallNow = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    if (!selectedPatientId && !phoneNumber) {
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
        phoneNumber: phoneNumber ?? "", // Will be overridden by patient data if patientId provided
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
          resetForm();
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
    // Validate required fields for scheduling
    if (!phoneNumber || !petName || !ownerName) {
      toast({
        title: "Error",
        description:
          "Phone number, pet name, and owner name are required to schedule a call",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await scheduleCall({
        phoneNumber,
        petName,
        ownerName,
        vetName: vetName || undefined,
        clinicName: clinicName || undefined,
        clinicPhone: clinicPhone || undefined,
        dischargeSummary: dischargeSummary || undefined,
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
          resetForm();
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

  const resetForm = () => {
    setSelectedPatientId(undefined);
    setPhoneNumber("");
    setPetName("");
    setOwnerName("");
    setVetName("");
    setClinicName("");
    setClinicPhone("");
    setDischargeSummary("");
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      setShowSuccess(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
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
                Call an existing patient or schedule a new call with patient
                details.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCallNow} className="space-y-6">
              <div className="space-y-4">
                {/* Quick Call with Existing Patient */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Quick Call (Existing Patient)
                  </Label>
                  <PatientSelect
                    value={selectedPatientId}
                    onValueChange={setSelectedPatientId}
                    onAddNew={onAddPatient}
                    placeholder="Select a patient to call immediately"
                  />
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background text-muted-foreground px-2">
                      Or schedule a new call
                    </span>
                  </div>
                </div>

                {/* Patient Details for Scheduling */}
                <div className="bg-muted/30 space-y-4 rounded-lg border p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={!!selectedPatientId || isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="petName">
                        Pet Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="petName"
                        placeholder="Fluffy"
                        value={petName}
                        onChange={(e) => setPetName(e.target.value)}
                        disabled={!!selectedPatientId || isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerName">
                        Owner Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="ownerName"
                        placeholder="John Doe"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        disabled={!!selectedPatientId || isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vetName">Vet Name</Label>
                      <Input
                        id="vetName"
                        placeholder="Dr. Smith"
                        value={vetName}
                        onChange={(e) => setVetName(e.target.value)}
                        disabled={!!selectedPatientId || isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clinicName">Clinic Name</Label>
                      <Input
                        id="clinicName"
                        placeholder="Pet Care Clinic"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        disabled={!!selectedPatientId || isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clinicPhone">Clinic Phone</Label>
                      <Input
                        id="clinicPhone"
                        type="tel"
                        placeholder="+1 (555) 987-6543"
                        value={clinicPhone}
                        onChange={(e) => setClinicPhone(e.target.value)}
                        disabled={!!selectedPatientId || isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dischargeSummary">Discharge Summary</Label>
                    <Textarea
                      id="dischargeSummary"
                      placeholder="Enter discharge summary or medical notes..."
                      value={dischargeSummary}
                      onChange={(e) => setDischargeSummary(e.target.value)}
                      disabled={!!selectedPatientId || isSubmitting}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Warning if patient selected */}
                {selectedPatientId && (
                  <div className="flex items-start gap-2 rounded-md border border-blue-500/50 bg-blue-50 p-3 dark:bg-blue-950/20">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      <p className="font-medium">Patient selected</p>
                      <p className="mt-1 text-xs">
                        Patient details will be used. Form fields above are
                        disabled.
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

                {/* Schedule button - only enabled when form filled or patient selected */}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSchedule}
                  disabled={
                    isSubmitting ||
                    (!selectedPatientId &&
                      (!phoneNumber || !petName || !ownerName))
                  }
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
                    isSubmitting || (!selectedPatientId && !phoneNumber)
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
