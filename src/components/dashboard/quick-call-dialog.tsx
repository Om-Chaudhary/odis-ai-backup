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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Checkbox } from "~/components/ui/checkbox";
import {
  sendCall,
  scheduleCall,
  importCallsFromJson,
} from "~/server/actions/retell";
import { Phone, CheckCircle2, Clock, FileJson } from "lucide-react";
import { useToast } from "~/hooks/use-toast";

interface QuickCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Helper function to format dates for voice
function formatDateForVoice(date: Date): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const ordinals = [
    "first",
    "second",
    "third",
    "fourth",
    "fifth",
    "sixth",
    "seventh",
    "eighth",
    "ninth",
    "tenth",
    "eleventh",
    "twelfth",
    "thirteenth",
    "fourteenth",
    "fifteenth",
    "sixteenth",
    "seventeenth",
    "eighteenth",
    "nineteenth",
    "twentieth",
    "twenty first",
    "twenty second",
    "twenty third",
    "twenty fourth",
    "twenty fifth",
    "twenty sixth",
    "twenty seventh",
    "twenty eighth",
    "twenty ninth",
    "thirtieth",
    "thirty first",
  ];

  const month = months[date.getMonth()];
  const day = ordinals[date.getDate() - 1];
  const year = date.getFullYear().toString().split("").join(" ");

  return `${month} ${day}, ${year}`;
}

// Helper function to format phone numbers for voice
function formatPhoneForVoice(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const digitWords: Record<string, string> = {
    "0": "zero",
    "1": "one",
    "2": "two",
    "3": "three",
    "4": "four",
    "5": "five",
    "6": "six",
    "7": "seven",
    "8": "eight",
    "9": "nine",
  };

  const phoneDigits = cleaned.slice(-10);
  const areaCode = phoneDigits
    .slice(0, 3)
    .split("")
    .map((d) => digitWords[d])
    .join(" ");
  const exchange = phoneDigits
    .slice(3, 6)
    .split("")
    .map((d) => digitWords[d])
    .join(" ");
  const subscriber = phoneDigits
    .slice(6)
    .split("")
    .map((d) => digitWords[d])
    .join(" ");

  return `${areaCode}, ${exchange}, ${subscriber}`;
}

export function QuickCallDialog({
  open,
  onOpenChange,
  onSuccess,
}: QuickCallDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form fields
  const [phoneNumber, setPhoneNumber] = useState("");
  const [petName, setPetName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [vetName, setVetName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [dischargeSummary, setDischargeSummary] = useState("");

  // JSON import field
  const [jsonInput, setJsonInput] = useState("");
  const [callImmediately, setCallImmediately] = useState(false);

  const handleCallNow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Phone number is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await sendCall({
        phoneNumber,
        variables: {
          pet_name: petName,
          owner_name: ownerName,
          vet_name: vetName,
          clinic_name: clinicName,
          clinic_phone: clinicPhone,
          discharge_summary_content: dischargeSummary,
        },
        metadata: {},
        retryOnBusy: false,
        agentId: "",
      });

      if (result.success) {
        setSuccessMessage("Call initiated successfully!");
        setShowSuccess(true);

        toast({
          title: "Call Initiated",
          description: `Call to ${result.data?.phoneNumber} has been started`,
        });

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
    if (!phoneNumber || !petName) {
      toast({
        title: "Error",
        description:
          "Phone number and pet name are required to schedule a call",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Format today's date for voice (e.g., "November twelfth, twenty twenty five")
      const today = new Date();
      const appointmentDate = formatDateForVoice(today);

      const result = await scheduleCall({
        phoneNumber,
        petName,
        ownerName: ownerName || "Unknown",

        // Required VAPI fields with defaults
        appointmentDate,
        callType: "discharge" as const,
        agentName: "Sarah",
        clinicName: clinicName || "our clinic",
        clinicPhone: clinicPhone
          ? formatPhoneForVoice(clinicPhone)
          : "five five five, one two three, four five six seven",
        emergencyPhone:
          "five five five, nine nine nine, eight eight eight eight",
        dischargeSummary: dischargeSummary || "had a routine checkup",
        subType: "wellness",

        // Optional fields
        vetName: vetName || undefined,
        nextSteps: undefined,
      });

      if (result.success) {
        setSuccessMessage("Call scheduled successfully!");
        setShowSuccess(true);

        toast({
          title: "Call Scheduled",
          description: `Call for ${result.data?.petName} has been queued`,
        });

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

  const handleJsonImport = async () => {
    if (!jsonInput.trim()) {
      toast({
        title: "Error",
        description: "Please paste JSON data",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (callImmediately) {
        // Parse JSON and call each number immediately
        let callsData;
        try {
          callsData = JSON.parse(jsonInput);
        } catch {
          throw new Error("Invalid JSON format");
        }

        if (!Array.isArray(callsData)) {
          throw new Error("JSON must be an array of call objects");
        }

        // Call each number
        let successCount = 0;
        let failCount = 0;

        for (const call of callsData) {
          const result = await sendCall({
            phoneNumber: call.phone_number,
            variables: {
              pet_name: call.pet_name,
              owner_name: call.owner_name ?? "",
              vet_name: call.vet_name ?? "",
              clinic_name: call.clinic_name ?? "",
              clinic_phone: call.clinic_phone ?? "",
              discharge_summary_content: call.discharge_summary_content ?? "",
            },
            metadata: {},
            retryOnBusy: false,
            agentId: "",
          });

          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        }

        setSuccessMessage(
          `Called ${successCount} number${successCount !== 1 ? "s" : ""}${failCount > 0 ? `, ${failCount} failed` : ""}!`,
        );
        setShowSuccess(true);

        toast({
          title: "Calls Initiated",
          description: `${successCount} call${successCount !== 1 ? "s" : ""} started${failCount > 0 ? `, ${failCount} failed` : ""}`,
        });

        setTimeout(() => {
          setShowSuccess(false);
          resetForm();
          onOpenChange(false);
          onSuccess?.();
        }, 1500);
      } else {
        // Import as scheduled calls
        const result = await importCallsFromJson(jsonInput);

        if (result.success) {
          setSuccessMessage(
            `Successfully imported ${result.data?.count ?? 0} call${(result.data?.count ?? 0) !== 1 ? "s" : ""}!`,
          );
          setShowSuccess(true);

          toast({
            title: "Import Successful",
            description: `${result.data?.count ?? 0} call${(result.data?.count ?? 0) !== 1 ? "s" : ""} imported`,
          });

          setTimeout(() => {
            setShowSuccess(false);
            resetForm();
            onOpenChange(false);
            onSuccess?.();
          }, 1500);
        } else {
          toast({
            title: "Import Failed",
            description: result.error ?? "Failed to import calls",
            variant: "destructive",
          });
        }
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
    setPhoneNumber("");
    setPetName("");
    setOwnerName("");
    setVetName("");
    setClinicName("");
    setClinicPhone("");
    setDischargeSummary("");
    setJsonInput("");
    setCallImmediately(false);
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
                Schedule a call manually or import from JSON
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="json">
                  <FileJson className="mr-2 h-4 w-4" />
                  JSON Import
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                <form onSubmit={handleCallNow} className="space-y-4">
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Owner Name</Label>
                      <Input
                        id="ownerName"
                        placeholder="John Doe"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vetName">Vet Name</Label>
                      <Input
                        id="vetName"
                        placeholder="Dr. Smith"
                        value={vetName}
                        onChange={(e) => setVetName(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clinicName">Clinic Name</Label>
                      <Input
                        id="clinicName"
                        placeholder="Pet Care Clinic"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                      disabled={isSubmitting}
                      rows={3}
                    />
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

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSchedule}
                      disabled={isSubmitting || !phoneNumber || !petName}
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

                    <Button
                      type="submit"
                      disabled={isSubmitting || !phoneNumber}
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
              </TabsContent>

              <TabsContent value="json" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jsonInput">
                    Paste JSON Array
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      (Array of call objects)
                    </span>
                  </Label>
                  <Textarea
                    id="jsonInput"
                    placeholder={`[\n  {\n    "phone_number": "+1XXXXXXXXXX",\n    "pet_name": "Brownie",\n    "owner_name": "John Doe",\n    "vet_name": "Dr. Allen",\n    "clinic_name": "Delle Valle",\n    "clinic_phone": "+1925XXXXXXX",\n    "discharge_summary_content": "Brownie came in with limping"\n  }\n]`}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    disabled={isSubmitting}
                    rows={12}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="callImmediately"
                    checked={callImmediately}
                    onCheckedChange={(checked) =>
                      setCallImmediately(checked === true)
                    }
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="callImmediately"
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Call immediately (instead of scheduling for later)
                  </label>
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

                  <Button
                    type="button"
                    onClick={handleJsonImport}
                    disabled={isSubmitting || !jsonInput.trim()}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        {callImmediately ? "Calling..." : "Importing..."}
                      </>
                    ) : callImmediately ? (
                      <>
                        <Phone className="mr-2 h-4 w-4" />
                        Call Now
                      </>
                    ) : (
                      <>
                        <FileJson className="mr-2 h-4 w-4" />
                        Schedule Calls
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
