"use client";

import { cn } from "@odis-ai/shared/util";

interface PathSelectionProps {
  onSelectCreate: () => void;
  onSelectJoin: () => void;
  userEmail?: string;
  hasPendingInvitation?: boolean;
}

export function PathSelection({
  onSelectCreate,
  onSelectJoin,
  userEmail,
  hasPendingInvitation,
}: PathSelectionProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
          Welcome to OdisAI
        </h1>
        <p className="mt-3 text-base text-teal-200/80">
          Let&apos;s get your veterinary practice set up
        </p>
      </div>

      {/* Option cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Create Clinic Card */}
        <button
          onClick={onSelectCreate}
          className={cn(
            "group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300",
            "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm",
            "border border-white/10 hover:border-teal-400/30",
            "hover:bg-white/15 hover:shadow-xl hover:shadow-teal-500/10",
            "focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 focus:ring-offset-transparent focus:outline-none",
          )}
        >
          {/* Decorative gradient */}
          <div
            className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-teal-400/10 blur-2xl transition-transform duration-500 group-hover:scale-150"
            aria-hidden="true"
          />

          {/* Icon */}
          <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-500 shadow-lg shadow-teal-500/30">
            <svg
              className="h-7 w-7 text-teal-950"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>

          {/* Content */}
          <h3 className="relative text-lg font-semibold text-white">
            Create Your Clinic
          </h3>
          <p className="relative mt-2 text-sm text-teal-200/70">
            Set up a new practice and invite your team members to join you.
          </p>

          {/* Arrow indicator */}
          <div className="relative mt-4 flex items-center text-teal-300 transition-transform duration-300 group-hover:translate-x-1">
            <span className="text-sm font-medium">Get started</span>
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
          </div>
        </button>

        {/* Join Clinic Card */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl p-6 text-left",
            "bg-gradient-to-br from-teal-800/20 to-teal-900/30 backdrop-blur-sm",
            "border border-teal-700/30",
          )}
        >
          {/* Icon */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-teal-600/20 bg-teal-700/30">
            <svg
              className="h-7 w-7 text-teal-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold text-white">
            Join an Existing Clinic
          </h3>
          <p className="mt-2 text-sm text-teal-200/70">
            {hasPendingInvitation
              ? "You have a pending invitation! Check your email for the link."
              : "Ask your clinic administrator to send you an invitation email."}
          </p>

          {/* Email display */}
          {userEmail && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-teal-900/40 px-3 py-2">
              <svg
                className="h-4 w-4 text-teal-400/70"
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
              <span className="truncate text-xs text-teal-300/80">
                {userEmail}
              </span>
            </div>
          )}

          {/* Info badge */}
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-teal-400/70">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Invitations are sent by email</span>
          </div>
        </div>
      </div>

      {/* Help text */}
      <p className="text-center text-xs text-teal-300/50">
        You can always add more clinics or join additional teams later from your
        settings.
      </p>
    </div>
  );
}
