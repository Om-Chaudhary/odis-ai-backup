"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Phone,
  Loader2,
  CheckCircle2,
  PhoneCall,
  FileJson,
  Upload,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";
import { sendCall } from "~/server/actions/retell";
import { callFormSchema, type CallFormInput } from "~/lib/retell/validators";
import confetti from "canvas-confetti";

type LoadingStep = "validating" | "connecting" | "initiating" | "success";

export default function SendCallPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState<LoadingStep | null>(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [showJsonImport, setShowJsonImport] = useState(false);

  const form = useForm<CallFormInput>({
    resolver: zodResolver(callFormSchema),
    defaultValues: {
      phoneNumber: "",
      agentId: "",
      petName: "",
      vetName: "",
      clinicName: "",
      ownerName: "",
      clinicPhone: "",
      dischargeSummaryContent: "",
      variables: {},
      metadata: {},
      retryOnBusy: false,
    },
  });

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ["#31aba3", "#10b981", "#0d9488", "#2a9a92"],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      void confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);

      // Map both snake_case (API format) and camelCase (form format)
      const mapping: Record<string, keyof CallFormInput> = {
        pet_name: "petName",
        petName: "petName",
        vet_name: "vetName",
        vetName: "vetName",
        clinic_name: "clinicName",
        clinicName: "clinicName",
        owner_name: "ownerName",
        ownerName: "ownerName",
        clinic_phone: "clinicPhone",
        clinicPhone: "clinicPhone",
        discharge_summary_content: "dischargeSummaryContent",
        dischargeSummaryContent: "dischargeSummaryContent",
        phone_number: "phoneNumber",
        phoneNumber: "phoneNumber",
      };

      // Update form values
      Object.entries(parsed).forEach(([key, value]) => {
        const formKey = mapping[key];
        if (formKey && typeof value === "string") {
          form.setValue(formKey, value);
        }
      });

      toast.success("Variables imported successfully!", {
        description: `${Object.keys(parsed).length} fields populated`,
      });

      setJsonInput("");
      setShowJsonImport(false);
    } catch (error) {
      toast.error("Invalid JSON", {
        description:
          error instanceof Error ? error.message : "Failed to parse JSON",
      });
    }
  };

  const onSubmit = async (data: CallFormInput) => {
    setIsSubmitting(true);

    try {
      // Step 1: Validating
      setLoadingStep("validating");
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Build variables object from form fields
      const variablesObj: Record<string, string> = {
        pet_name: data.petName ?? "",
        vet_name: data.vetName ?? "",
        clinic_name: data.clinicName ?? "",
        owner_name: data.ownerName ?? "",
        clinic_phone: data.clinicPhone ?? "",
        discharge_summary_content: data.dischargeSummaryContent ?? "",
      };

      // Step 2: Connecting
      setLoadingStep("connecting");
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Step 3: Initiating
      setLoadingStep("initiating");
      const result = await sendCall({
        phoneNumber: data.phoneNumber,
        agentId: data.agentId ?? "",
        variables: variablesObj,
        metadata: data.metadata ?? {},
        retryOnBusy: data.retryOnBusy ?? false,
      });

      if (result.success) {
        // Step 4: Success
        setLoadingStep("success");
        triggerConfetti();
        setShowSuccessOverlay(true);

        toast.success("Call initiated successfully!", {
          description: `Calling ${data.phoneNumber}...`,
          duration: 4000,
        });

        // Wait for animation then redirect
        setTimeout(() => {
          router.push("/dashboard/calls");
        }, 2500);
      } else {
        setLoadingStep(null);
        toast.error("Failed to initiate call", {
          description: result.error,
        });
      }
    } catch (error) {
      setLoadingStep(null);
      toast.error("Failed to initiate call", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      if (loadingStep !== "success") {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 p-2">
          <Phone className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Send Call
          </h1>
          <p className="text-sm text-slate-600">
            Initiate a new outbound call via OdisAI
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="relative overflow-hidden border-slate-200/60 bg-white/90 shadow-xl backdrop-blur-md">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(49, 171, 163, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
          }}
        />

        <CardHeader className="relative z-10 border-b border-slate-200/60 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 py-4">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Call Details
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Enter recipient phone number and call variables
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber" className="text-sm font-medium">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+12137774445"
                {...form.register("phoneNumber")}
                className="font-mono"
                disabled={isSubmitting}
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* JSON Import Section */}
            <div className="overflow-hidden rounded-lg border border-slate-200/60">
              <button
                type="button"
                onClick={() => setShowJsonImport(!showJsonImport)}
                className="group flex w-full items-center justify-between bg-gradient-to-r from-slate-50/80 to-slate-50/50 px-4 py-3 transition-all hover:from-emerald-50/50 hover:to-teal-50/30"
                disabled={isSubmitting}
              >
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Import Variables from JSON
                  </span>
                </div>
                <span className="text-xs text-slate-500 transition-colors group-hover:text-emerald-600">
                  {showJsonImport ? "Hide" : "Show"}
                </span>
              </button>

              {showJsonImport && (
                <div className="animate-in slide-in-from-top space-y-3 border-t border-slate-200/60 bg-slate-50/30 p-4 duration-300">
                  <div className="space-y-2">
                    <Label
                      htmlFor="jsonInput"
                      className="text-xs text-slate-600"
                    >
                      Paste JSON with call variables
                    </Label>
                    <Textarea
                      id="jsonInput"
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder={`{\n  "pet_name": "Max",\n  "owner_name": "John Doe",\n  "vet_name": "Dr. Smith",\n  "clinic_name": "Main Street Vet",\n  "clinic_phone": "+1 (555) 123-4567",\n  "discharge_summary_content": "Your pet..."\n}`}
                      rows={8}
                      className="resize-none font-mono text-xs"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-slate-500">
                      Supports both snake_case (pet_name) and camelCase
                      (petName) formats
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleJsonImport}
                      disabled={!jsonInput.trim() || isSubmitting}
                      size="sm"
                      className="bg-gradient-to-r from-[#31aba3] to-[#10b981] text-white hover:from-[#2a9a92] hover:to-[#0d9488]"
                    >
                      <Upload className="mr-2 h-3.5 w-3.5" />
                      Import Variables
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setJsonInput("");
                        setShowJsonImport(false);
                      }}
                      disabled={isSubmitting}
                      size="sm"
                      variant="outline"
                      className="border-slate-300"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Agent Variables - Grid Layout */}
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-semibold text-slate-800">
                Call Variables
              </Label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Pet Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="petName" className="text-sm">
                    Pet Name
                  </Label>
                  <Input
                    id="petName"
                    placeholder="Max, Bella, Charlie"
                    {...form.register("petName")}
                  />
                </div>

                {/* Owner Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="ownerName" className="text-sm">
                    Owner Name
                  </Label>
                  <Input
                    id="ownerName"
                    placeholder="John Doe"
                    {...form.register("ownerName")}
                  />
                </div>

                {/* Vet Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="vetName" className="text-sm">
                    Veterinarian Name
                  </Label>
                  <Input
                    id="vetName"
                    placeholder="Dr. Smith"
                    {...form.register("vetName")}
                  />
                </div>

                {/* Clinic Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="clinicPhone" className="text-sm">
                    Clinic Phone
                  </Label>
                  <Input
                    id="clinicPhone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    {...form.register("clinicPhone")}
                  />
                </div>

                {/* Clinic Name - Full Width */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="clinicName" className="text-sm">
                    Clinic Name
                  </Label>
                  <Input
                    id="clinicName"
                    placeholder="Main Street Veterinary Clinic"
                    {...form.register("clinicName")}
                  />
                </div>
              </div>

              {/* Discharge Summary Content - Full Width */}
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="dischargeSummaryContent" className="text-sm">
                  Discharge Summary
                </Label>
                <Textarea
                  id="dischargeSummaryContent"
                  placeholder="Enter the complete discharge summary that will be shared with the pet owner..."
                  {...form.register("dischargeSummaryContent")}
                  rows={6}
                  className="resize-y"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-slate-500">
                  This content will be read to the pet owner during the call
                </p>
              </div>
            </div>

            {/* Loading Progress */}
            {isSubmitting && loadingStep && (
              <div className="rounded-lg border border-emerald-200/60 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {loadingStep === "success" ? (
                      <CheckCircle2 className="animate-in zoom-in h-5 w-5 text-green-500 duration-300" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {loadingStep === "validating" &&
                          "Validating call details..."}
                        {loadingStep === "connecting" &&
                          "Connecting to OdisAI..."}
                        {loadingStep === "initiating" && "Initiating call..."}
                        {loadingStep === "success" &&
                          "Call initiated successfully!"}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-2 overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#31aba3] to-[#10b981] transition-all duration-500 ease-out"
                      style={{
                        width:
                          loadingStep === "validating"
                            ? "25%"
                            : loadingStep === "connecting"
                              ? "50%"
                              : loadingStep === "initiating"
                                ? "75%"
                                : "100%",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/calls")}
                disabled={isSubmitting}
                className="border-slate-300 transition-all hover:border-slate-400 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="group relative overflow-hidden bg-gradient-to-r from-[#31aba3] to-[#10b981] text-white shadow-xl transition-all hover:scale-105 hover:from-[#2a9a92] hover:to-[#0d9488] hover:shadow-2xl hover:shadow-[#31aba3]/40"
              >
                <span className="relative z-10 flex items-center">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {loadingStep === "validating" && "Validating..."}
                      {loadingStep === "connecting" && "Connecting..."}
                      {loadingStep === "initiating" && "Initiating..."}
                      {loadingStep === "success" && "Success!"}
                    </>
                  ) : (
                    <>
                      <PhoneCall className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                      Send Call
                    </>
                  )}
                </span>
                {!isSubmitting && (
                  <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Overlay */}
      {showSuccessOverlay && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm duration-300">
          <div className="animate-in zoom-in mx-4 max-w-md rounded-2xl bg-white p-8 shadow-2xl duration-500">
            <div className="space-y-4 text-center">
              <div className="animate-in zoom-in mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 duration-700">
                <CheckCircle2 className="animate-in zoom-in h-12 w-12 text-emerald-600 duration-1000" />
              </div>
              <div className="space-y-2">
                <h3 className="animate-in slide-in-from-bottom text-2xl font-bold text-slate-800 duration-500">
                  Call Initiated!
                </h3>
                <p className="animate-in slide-in-from-bottom text-slate-600 duration-700">
                  Your call is now being connected...
                </p>
              </div>
              <div className="animate-in slide-in-from-bottom flex items-center justify-center gap-2 text-sm text-emerald-600 duration-900">
                <PhoneCall className="h-4 w-4 animate-pulse" />
                <span>Redirecting to call history</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
