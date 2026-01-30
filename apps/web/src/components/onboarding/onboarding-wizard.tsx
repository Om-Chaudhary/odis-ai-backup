"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@odis-ai/shared/ui";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { IdexxCredentialsStep } from "./steps/idexx-credentials-step";
import { WeaveCredentialsStep } from "./steps/weave-credentials-step";
import { CompletionStep } from "./steps/completion-step";
import { createLogger } from "@odis-ai/shared/logger";

const logger = createLogger("onboarding-wizard");

interface FormData {
  idexxUsername: string;
  idexxPassword: string;
  idexxCompanyId: string;
  weaveUsername: string;
  weavePassword: string;
}

interface FormErrors {
  idexxUsername?: string;
  idexxPassword?: string;
  idexxCompanyId?: string;
  weaveUsername?: string;
  weavePassword?: string;
}

/**
 * Onboarding Wizard
 *
 * Multi-step form for collecting user credentials during onboarding:
 * 1. IDEXX Neo credentials
 * 2. Weave credentials
 * 3. Completion and redirect
 */
export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    idexxUsername: "",
    idexxPassword: "",
    idexxCompanyId: "",
    weaveUsername: "",
    weavePassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!formData.idexxUsername.trim()) {
        newErrors.idexxUsername = "IDEXX username is required";
      }
      if (!formData.idexxPassword.trim()) {
        newErrors.idexxPassword = "IDEXX password is required";
      }
      if (!formData.idexxCompanyId.trim()) {
        newErrors.idexxCompanyId = "IDEXX company ID is required";
      }
    } else if (step === 2) {
      if (!formData.weaveUsername.trim()) {
        newErrors.weaveUsername = "Weave username is required";
      }
      if (!formData.weavePassword.trim()) {
        newErrors.weavePassword = "Weave password is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next button
  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep === 2) {
      // Last step - submit the form
      await handleSubmit();
    } else {
      // Move to next step
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  // Submit form data to API
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save credentials");
      }

      logger.info("Onboarding submitted successfully");
      setCurrentStep(3); // Show completion step
    } catch (error) {
      logger.error("Failed to submit onboarding", { error });
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to save credentials. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle completion - redirect to pending page
  const handleComplete = () => {
    router.push("/pending");
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <IdexxCredentialsStep
            username={formData.idexxUsername}
            password={formData.idexxPassword}
            companyId={formData.idexxCompanyId}
            onUsernameChange={(value) =>
              setFormData({ ...formData, idexxUsername: value })
            }
            onPasswordChange={(value) =>
              setFormData({ ...formData, idexxPassword: value })
            }
            onCompanyIdChange={(value) =>
              setFormData({ ...formData, idexxCompanyId: value })
            }
            errors={{
              username: errors.idexxUsername,
              password: errors.idexxPassword,
              companyId: errors.idexxCompanyId,
            }}
          />
        );
      case 2:
        return (
          <WeaveCredentialsStep
            username={formData.weaveUsername}
            password={formData.weavePassword}
            onUsernameChange={(value) =>
              setFormData({ ...formData, weaveUsername: value })
            }
            onPasswordChange={(value) =>
              setFormData({ ...formData, weavePassword: value })
            }
            errors={{
              username: errors.weaveUsername,
              password: errors.weavePassword,
            }}
          />
        );
      case 3:
        return <CompletionStep onContinue={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Progress indicator */}
      {currentStep < 3 && (
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Step {currentStep} of 2
            </span>
            <span className="text-sm text-slate-500">
              {Math.round((currentStep / 2) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-teal-600 transition-all duration-300"
              style={{ width: `${(currentStep / 2) * 100}%` }}
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
      {currentStep < 3 && (
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
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : currentStep === 2 ? (
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
