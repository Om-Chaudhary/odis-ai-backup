"use client";

import { useRouter } from "next/navigation";
import AccountStep from "./account-step";

export default function OnboardingContainer() {
  const router = useRouter();

  const handleAccountComplete = () => {
    router.push("/dashboard");
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-white/10 p-6 shadow-xl backdrop-blur-md sm:p-8">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/5 to-white/10" />
      <div className="relative">
        <AccountStep onComplete={handleAccountComplete} />
      </div>
    </div>
  );
}
