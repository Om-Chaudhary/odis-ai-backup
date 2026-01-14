"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AccountStep from "./account-step";
import PIMSStep from "./pims-step";
import StepIndicator from "./step-indicator";

export default function OnboardingContainer() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  const totalSteps = 2;

  const handleAccountComplete = (newUserId: string) => {
    setUserId(newUserId);
    setCurrentStep(2);
  };

  const handlePIMSComplete = () => {
    router.push("/dashboard");
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-white/10 p-6 shadow-xl backdrop-blur-md sm:p-8">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/5 to-white/10" />
      <div className="relative space-y-6">
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        {currentStep === 1 && (
          <AccountStep onComplete={handleAccountComplete} />
        )}

        {currentStep === 2 && userId && (
          <PIMSStep userId={userId} onComplete={handlePIMSComplete} />
        )}
      </div>
    </div>
  );
}
