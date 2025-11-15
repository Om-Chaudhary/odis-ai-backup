"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AccountStep from "./AccountStep";
import PIMSStep from "./PIMSStep";
import StepIndicator from "./StepIndicator";

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
    <div className="relative w-full overflow-hidden rounded-2xl bg-teal-50/60 p-6 shadow-xl backdrop-blur-md sm:p-8">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-teal-50/50 to-cyan-100/40" />
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
