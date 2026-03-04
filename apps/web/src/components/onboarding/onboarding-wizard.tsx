"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@odis-ai/shared/ui";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { PmsSelectionStep } from "./steps/pms-selection-step";
import { IdexxCredentialsStep } from "./steps/idexx-credentials-step";
import { PmsCredentialsStep } from "./steps/pms-credentials-step";
import { PhoneSystemSelectionStep } from "./steps/phone-system-selection-step";
import { WeaveCredentialsStep } from "./steps/weave-credentials-step";
import { PhoneSystemDetailsStep } from "./steps/phone-system-details-step";
import { CompletionStep } from "./steps/completion-step";
import type { PmsType, PhoneSystemType } from "~/app/api/onboarding/schemas";
import { createLogger } from "@odis-ai/shared/logger";

const logger = createLogger("onboarding-wizard");

const TOTAL_STEPS = 4; // Selection + credentials for PMS and phone (completion is step 5)

interface FormData {
  // PMS
  pmsType: PmsType | "";
  idexxUsername: string;
  idexxPassword: string;
  idexxCompanyId: string;
  pmsUsername: string;
  pmsPassword: string;
  // Phone
  phoneSystemType: PhoneSystemType | "";
  weaveUsername: string;
  weavePassword: string;
  phoneSystemProviderName: string;
  phoneSystemContactInfo: string;
  phoneSystemDetails: string;
}

/**
 * Onboarding Wizard (v2)
 *
 * 5-step flow:
 * 1. Select PMS
 * 2. PMS Credentials (IDEXX or generic, skippable)
 * 3. Select Phone System
 * 4. Phone System Details (Weave creds or provider info, skippable)
 * 5. Completion summary
 */
export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const [formData, setFormData] = useState<FormData>({
    pmsType: "",
    idexxUsername: "",
    idexxPassword: "",
    idexxCompanyId: "",
    pmsUsername: "",
    pmsPassword: "",
    phoneSystemType: "",
    weaveUsername: "",
    weavePassword: "",
    phoneSystemProviderName: "",
    phoneSystemContactInfo: "",
    phoneSystemDetails: "",
  });

  const canAdvance = (): boolean => {
    if (currentStep === 1) return formData.pmsType !== "";
    if (currentStep === 3) return formData.phoneSystemType !== "";
    // Steps 2 and 4 are always advanceable (credentials are optional)
    return true;
  };

  const handleNext = async () => {
    console.log("[Wizard] handleNext called", {
      currentStep,
      TOTAL_STEPS,
      canAdvance: canAdvance(),
    });
    if (!canAdvance()) return;

    if (currentStep === TOTAL_STEPS) {
      console.log("[Wizard] Calling handleSubmit from handleNext");
      await handleSubmit();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipCredentials = async () => {
    // Clear credential fields for the current step
    if (currentStep === 2) {
      if (formData.pmsType === "idexx_neo") {
        setFormData({
          ...formData,
          idexxUsername: "",
          idexxPassword: "",
          idexxCompanyId: "",
        });
      } else {
        setFormData({ ...formData, pmsUsername: "", pmsPassword: "" });
      }
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 4) {
      if (formData.phoneSystemType === "weave") {
        setFormData({ ...formData, weaveUsername: "", weavePassword: "" });
      } else {
        setFormData({
          ...formData,
          phoneSystemProviderName: "",
          phoneSystemContactInfo: "",
          phoneSystemDetails: "",
        });
      }
      // Step 4 is the last input step — submit before showing completion
      console.log(
        "[Wizard] Calling handleSubmit from handleSkipCredentials step 4",
      );
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    console.log("[Wizard] handleSubmit called", {
      submittingRef: submittingRef.current,
      currentStep,
      pmsType: formData.pmsType,
      phoneSystemType: formData.phoneSystemType,
    });
    if (submittingRef.current) {
      console.log("[Wizard] handleSubmit SKIPPED - already submitting");
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pmsType: formData.pmsType,
          idexxUsername: formData.idexxUsername,
          idexxPassword: formData.idexxPassword,
          idexxCompanyId: formData.idexxCompanyId,
          pmsUsername: formData.pmsUsername,
          pmsPassword: formData.pmsPassword,
          phoneSystemType: formData.phoneSystemType,
          weaveUsername: formData.weaveUsername,
          weavePassword: formData.weavePassword,
          phoneSystemProviderName: formData.phoneSystemProviderName,
          phoneSystemContactInfo: formData.phoneSystemContactInfo,
          phoneSystemDetails: formData.phoneSystemDetails,
        }),
      });

      console.log("[Wizard] fetch response", {
        status: response.status,
        ok: response.ok,
      });
      const data = await response.json();
      console.log("[Wizard] response data", data);

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save onboarding data");
      }

      logger.info("Onboarding submitted successfully");
      console.log("[Wizard] Submit SUCCESS - advancing to step 5");
      setCurrentStep(5);
    } catch (error) {
      logger.error("Failed to submit onboarding", { error });
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to save. Please try again.",
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    console.log("[Wizard] handleComplete called - navigating to /pending");
    router.push("/pending");
  };

  const hasPmsCredentials = (): boolean => {
    if (formData.pmsType === "idexx_neo") {
      return !!(
        formData.idexxUsername ||
        formData.idexxPassword ||
        formData.idexxCompanyId
      );
    }
    return !!(formData.pmsUsername || formData.pmsPassword);
  };

  const hasPhoneCredentials = (): boolean => {
    if (formData.phoneSystemType === "weave") {
      return !!(formData.weaveUsername || formData.weavePassword);
    }
    return !!(
      formData.phoneSystemProviderName ||
      formData.phoneSystemContactInfo ||
      formData.phoneSystemDetails
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PmsSelectionStep
            selected={formData.pmsType}
            onSelect={(type) => setFormData({ ...formData, pmsType: type })}
          />
        );
      case 2:
        if (formData.pmsType === "idexx_neo") {
          return (
            <IdexxCredentialsStep
              username={formData.idexxUsername}
              password={formData.idexxPassword}
              companyId={formData.idexxCompanyId}
              onUsernameChange={(v) =>
                setFormData({ ...formData, idexxUsername: v })
              }
              onPasswordChange={(v) =>
                setFormData({ ...formData, idexxPassword: v })
              }
              onCompanyIdChange={(v) =>
                setFormData({ ...formData, idexxCompanyId: v })
              }
              onSkip={handleSkipCredentials}
            />
          );
        }
        return (
          <PmsCredentialsStep
            pmsType={formData.pmsType as PmsType}
            username={formData.pmsUsername}
            password={formData.pmsPassword}
            onUsernameChange={(v) =>
              setFormData({ ...formData, pmsUsername: v })
            }
            onPasswordChange={(v) =>
              setFormData({ ...formData, pmsPassword: v })
            }
            onSkip={handleSkipCredentials}
          />
        );
      case 3:
        return (
          <PhoneSystemSelectionStep
            selected={formData.phoneSystemType}
            onSelect={(type) =>
              setFormData({ ...formData, phoneSystemType: type })
            }
          />
        );
      case 4:
        if (formData.phoneSystemType === "weave") {
          return (
            <WeaveCredentialsStep
              username={formData.weaveUsername}
              password={formData.weavePassword}
              onUsernameChange={(v) =>
                setFormData({ ...formData, weaveUsername: v })
              }
              onPasswordChange={(v) =>
                setFormData({ ...formData, weavePassword: v })
              }
              onSkip={handleSkipCredentials}
            />
          );
        }
        return (
          <PhoneSystemDetailsStep
            phoneSystemType={formData.phoneSystemType as PhoneSystemType}
            providerName={formData.phoneSystemProviderName}
            contactInfo={formData.phoneSystemContactInfo}
            details={formData.phoneSystemDetails}
            onProviderNameChange={(v) =>
              setFormData({ ...formData, phoneSystemProviderName: v })
            }
            onContactInfoChange={(v) =>
              setFormData({ ...formData, phoneSystemContactInfo: v })
            }
            onDetailsChange={(v) =>
              setFormData({ ...formData, phoneSystemDetails: v })
            }
            onSkip={handleSkipCredentials}
          />
        );
      case 5:
        return (
          <CompletionStep
            pmsType={formData.pmsType as PmsType}
            phoneSystemType={formData.phoneSystemType as PhoneSystemType}
            hasCredentials={{
              pms: hasPmsCredentials(),
              phone: hasPhoneCredentials(),
            }}
            onContinue={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Progress indicator */}
      {currentStep <= TOTAL_STEPS && (
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <span className="text-sm text-slate-500">
              {Math.round((currentStep / TOTAL_STEPS) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-teal-600 transition-all duration-300"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="mb-8">{renderStep()}</div>

      {/* Error message */}
      {submitError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      {/* Navigation buttons */}
      {currentStep <= TOTAL_STEPS && (
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canAdvance() || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : currentStep === TOTAL_STEPS ? (
              "Complete Setup"
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
