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
    <div className="relative w-full overflow-hidden rounded-2xl bg-teal-50/60 shadow-xl backdrop-blur-md p-6 sm:p-8 dark:bg-slate-900/80">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-cyan-100/40 -z-10 dark:from-slate-900/90 dark:to-emerald-950/30" />
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