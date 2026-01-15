"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/client";
import { cn } from "@odis-ai/shared/util";
import { PathSelection } from "./steps/path-selection";
import { ClinicCreation } from "./steps/clinic-creation";
import { InvitationAccepted } from "./steps/invitation-accepted";
import { ProfileSetup } from "./steps/profile-setup";

type OnboardingStep =
  | "loading"
  | "path-selection"
  | "clinic-creation"
  | "invitation-accepted"
  | "profile-setup";

interface OnboardingFlowProps {
  initialToken?: string;
  userEmail?: string;
}

interface CreatedClinic {
  id: string;
  name: string;
  slug: string;
}

interface JoinedClinic {
  clinicId: string;
  clinicName: string;
  role: string;
}

export function OnboardingFlow({
  initialToken,
  userEmail,
}: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("loading");
  const [createdClinic, setCreatedClinic] = useState<CreatedClinic | null>(
    null,
  );
  const [joinedClinic, setJoinedClinic] = useState<JoinedClinic | null>(null);
  const [invitationToken, setInvitationToken] = useState<string | undefined>(
    initialToken,
  );

  // Fetch onboarding status
  const {
    data: status,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = api.onboarding.getStatus.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Validate invitation token if present
  const { data: invitationInfo, isLoading: invitationLoading } =
    api.onboarding.validateInvitationToken.useQuery(
      { token: invitationToken! },
      {
        enabled: !!invitationToken,
        refetchOnWindowFocus: false,
      },
    );

  // Determine initial step based on status and token
  useEffect(() => {
    if (statusLoading) return;

    // If onboarding is already complete, redirect
    if (status?.isComplete) {
      const primaryClinic = status.clinics.find((c) => c.isPrimary);
      const slug = primaryClinic?.slug ?? status.clinics[0]?.slug;
      router.push(slug ? `/dashboard/${slug}` : "/dashboard");
      return;
    }

    // If user already has a clinic, go straight to profile setup
    if (status?.hasClinic && !status?.hasProfile) {
      setCurrentStep("profile-setup");
      return;
    }

    // If there's an invitation token, wait for validation
    if (invitationToken) {
      if (invitationLoading) {
        setCurrentStep("loading");
        return;
      }

      if (invitationInfo?.valid) {
        setCurrentStep("invitation-accepted");
        return;
      }
    }

    // If user has a pending invitation for their email, show it
    if (status?.pendingInvitation) {
      setInvitationToken(status.pendingInvitation.token);
      setCurrentStep("invitation-accepted");
      return;
    }

    // Default to path selection
    setCurrentStep("path-selection");
  }, [
    status,
    statusLoading,
    invitationToken,
    invitationInfo,
    invitationLoading,
    router,
  ]);

  // Handle path selection
  const handleSelectCreateClinic = useCallback(() => {
    setCurrentStep("clinic-creation");
  }, []);

  const handleSelectJoinClinic = useCallback(() => {
    // Show message about checking email
    // User needs to click the invitation link from their email
    setCurrentStep("path-selection");
  }, []);

  // Handle clinic creation success
  const handleClinicCreated = useCallback(
    (clinic: CreatedClinic) => {
      setCreatedClinic(clinic);
      void refetchStatus();
      setCurrentStep("profile-setup");
    },
    [refetchStatus],
  );

  // Handle invitation acceptance
  const handleInvitationAccepted = useCallback(
    (clinic: JoinedClinic) => {
      setJoinedClinic(clinic);
      void refetchStatus();
      setCurrentStep("profile-setup");
    },
    [refetchStatus],
  );
  // Handle profile completion
  const handleProfileCompleted = useCallback(
    (redirectTo: string) => {
      router.push(redirectTo);
    },
    [router],
  );

  // Handle going back
  const handleBack = useCallback(() => {
    if (currentStep === "clinic-creation") {
      setCurrentStep("path-selection");
    } else if (currentStep === "invitation-accepted" && !initialToken) {
      setInvitationToken(undefined);
      setCurrentStep("path-selection");
    }
  }, [currentStep, initialToken]);

  // Loading state
  if (currentStep === "loading" || statusLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-400/30 border-t-teal-400" />
        <p className="mt-4 text-sm text-teal-200/70">
          {invitationToken
            ? "Validating your invitation..."
            : "Loading your account..."}
        </p>
      </div>
    );
  }

  // Get the clinic name for profile setup context
  const clinicName =
    createdClinic?.name ??
    joinedClinic?.clinicName ??
    status?.clinics[0]?.name ??
    null;

  return (
    <div className="w-full max-w-2xl">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {["Setup", "Details"].map((label, index) => {
          const stepIndex = currentStep === "profile-setup" ? 1 : 0;
          const isActive = index === stepIndex;
          const isCompleted = index < stepIndex;

          return (
            <div key={label} className="flex items-center">
              {index > 0 && (
                <div
                  className={cn(
                    "mx-2 h-px w-8 transition-colors duration-300",
                    isCompleted ? "bg-teal-400" : "bg-teal-700/50",
                  )}
                />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all duration-300",
                    isActive
                      ? "bg-teal-400 text-teal-950 shadow-lg shadow-teal-400/30"
                      : isCompleted
                        ? "bg-teal-500/20 text-teal-300"
                        : "bg-teal-800/30 text-teal-500/50",
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium transition-colors duration-300",
                    isActive
                      ? "text-white"
                      : isCompleted
                        ? "text-teal-300/70"
                        : "text-teal-500/50",
                  )}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step content with transitions */}
      <div className="relative">
        <div
          className={cn(
            "transition-all duration-500 ease-out",
            currentStep === "path-selection"
              ? "translate-y-0 opacity-100"
              : "pointer-events-none absolute inset-0 translate-y-4 opacity-0",
          )}
        >
          {currentStep === "path-selection" && (
            <PathSelection
              onSelectCreate={handleSelectCreateClinic}
              onSelectJoin={handleSelectJoinClinic}
              userEmail={userEmail}
              hasPendingInvitation={!!status?.pendingInvitation}
            />
          )}
        </div>

        <div
          className={cn(
            "transition-all duration-500 ease-out",
            currentStep === "clinic-creation"
              ? "translate-y-0 opacity-100"
              : "pointer-events-none absolute inset-0 translate-y-4 opacity-0",
          )}
        >
          {currentStep === "clinic-creation" && (
            <ClinicCreation
              onSuccess={handleClinicCreated}
              onBack={handleBack}
            />
          )}
        </div>

        <div
          className={cn(
            "transition-all duration-500 ease-out",
            currentStep === "invitation-accepted"
              ? "translate-y-0 opacity-100"
              : "pointer-events-none absolute inset-0 translate-y-4 opacity-0",
          )}
        >
          {currentStep === "invitation-accepted" && invitationInfo?.valid && (
            <InvitationAccepted
              token={invitationToken!}
              clinicName={invitationInfo.clinicName!}
              role={invitationInfo.role!}
              email={invitationInfo.email!}
              onSuccess={handleInvitationAccepted}
              onBack={!initialToken ? handleBack : undefined}
            />
          )}
        </div>

        <div
          className={cn(
            "transition-all duration-500 ease-out",
            currentStep === "profile-setup"
              ? "translate-y-0 opacity-100"
              : "pointer-events-none absolute inset-0 translate-y-4 opacity-0",
          )}
        >
          {currentStep === "profile-setup" && (
            <ProfileSetup
              clinicName={clinicName}
              onSuccess={handleProfileCompleted}
            />
          )}
        </div>
      </div>
    </div>
  );
}
