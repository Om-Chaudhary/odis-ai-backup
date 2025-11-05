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
import { sendCall } from "~/server/actions/retell";
import { Phone, AlertTriangle, CheckCircle2 } from "lucide-react";
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
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Manual phone number (fallback if no patient selected)
  const [manualPhone, setManualPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
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
        description: error instanceof Error ? error.message : "An error occurred",
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
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Call Initiated!</h3>
              <p className="text-sm text-muted-foreground">
                The call is now connecting...
              </p>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                New Call
              </DialogTitle>
              <DialogDescription>
                Select a patient to automatically populate call details, or enter a phone
                number manually.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Patient Selection */}
                <PatientSelect
                  value={selectedPatientId}
                  onValueChange={setSelectedPatientId}
                  onAddNew={onAddPatient}
                  label="Patient (recommended)"
                  placeholder="Select a patient for auto-filled details"
                />

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or enter manually
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
                  <p className="text-xs text-muted-foreground">
                    Only required if no patient is selected
                  </p>
                </div>

                {/* Warning if no patient selected */}
                {!selectedPatientId && manualPhone && (
                  <div className="flex items-start gap-2 p-3 border border-amber-500/50 rounded-md bg-amber-50 dark:bg-amber-950/20">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-600 dark:text-amber-400">
                      <p className="font-medium">No patient selected</p>
                      <p className="text-xs mt-1">
                        Call will be made without pre-filled patient information. Select a
                        patient for better context.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || (!selectedPatientId && !manualPhone)}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Initiating Call...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-2" />
                      Start Call
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
