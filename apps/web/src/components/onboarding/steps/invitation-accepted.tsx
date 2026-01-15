"use client";

import { useState } from "react";
import { api } from "~/trpc/client";
import { cn } from "@odis-ai/shared/util";
import { Button } from "@odis-ai/shared/ui/button";

interface InvitationAcceptedProps {
  token: string;
  clinicName: string;
  role: string;
  email: string;
  onSuccess: (clinic: {
    clinicId: string;
    clinicName: string;
    role: string;
  }) => void;
  onBack?: () => void;
}

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Administrator",
  member: "Team Member",
  viewer: "Viewer",
};

export function InvitationAccepted({
  token,
  clinicName,
  role,
  email,
  onSuccess,
  onBack,
}: InvitationAcceptedProps) {
  const [isAccepting, setIsAccepting] = useState(false);

  const acceptInvitation = api.onboarding.acceptInvitation.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        onSuccess({
          clinicId: data.clinicId!,
          clinicName: data.clinicName!,
          role: data.role!,
        });
      }
    },
    onSettled: () => {
      setIsAccepting(false);
    },
  });

  const handleAccept = async () => {
    setIsAccepting(true);
    await acceptInvitation.mutateAsync({ token });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-teal-400/30 bg-gradient-to-br from-teal-400/20 to-teal-500/10">
          <svg
            className="h-10 w-10 text-teal-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
            />
          </svg>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
          You&apos;re Invited!
        </h1>
        <p className="mt-3 text-base text-teal-200/80">
          You&apos;ve been invited to join a veterinary practice
        </p>
      </div>

      {/* Invitation Details Card */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-sm">
        {/* Clinic Name */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20">
            <svg
              className="h-6 w-6 text-teal-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs tracking-wider text-teal-300/60 uppercase">
              Clinic
            </p>
            <p className="text-lg font-semibold text-white">{clinicName}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Role */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20">
            <svg
              className="h-6 w-6 text-teal-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs tracking-wider text-teal-300/60 uppercase">
              Your Role
            </p>
            <p className="text-lg font-semibold text-white">
              {roleLabels[role] ?? role}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Email */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20">
            <svg
              className="h-6 w-6 text-teal-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs tracking-wider text-teal-300/60 uppercase">
              Invitation sent to
            </p>
            <p className="text-lg font-semibold text-white">{email}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {acceptInvitation.error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-sm text-red-300">
            {acceptInvitation.error.message ?? "Failed to accept invitation"}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={isAccepting}
            className="text-teal-200/70 hover:bg-white/10 hover:text-white"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Button>
        )}

        <Button
          onClick={handleAccept}
          disabled={isAccepting}
          className={cn(
            "flex-1 bg-gradient-to-r from-teal-400 to-teal-500 font-semibold text-teal-950",
            "hover:from-teal-300 hover:to-teal-400 disabled:opacity-50",
          )}
        >
          {isAccepting ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Joining...
            </>
          ) : (
            <>
              Accept & Continue
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </>
          )}
        </Button>
      </div>

      {/* Help text */}
      <p className="text-center text-xs text-teal-300/50">
        By accepting, you&apos;ll gain access to {clinicName}&apos;s workspace
        and can start collaborating with your team.
      </p>
    </div>
  );
}
