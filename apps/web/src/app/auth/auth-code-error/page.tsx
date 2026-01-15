"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@odis-ai/shared/ui/button";
import { Logo } from "@odis-ai/shared/ui/Logo";
import { DotPattern } from "@odis-ai/shared/ui";
import { cn } from "@odis-ai/shared/util";

function AuthCodeErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Provide user-friendly error messages
  const getErrorMessage = (error: string | null) => {
    if (!error) {
      return "An authentication error occurred. Please try again.";
    }

    const lowerError = error.toLowerCase();

    if (
      lowerError.includes("expired") ||
      lowerError.includes("invalid") ||
      lowerError.includes("code verifier")
    ) {
      return "This password reset link has expired or is invalid. Please request a new one.";
    }

    if (lowerError.includes("no authentication code")) {
      return "No authentication code was provided. Please use the link from your email.";
    }

    return decodeURIComponent(error);
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900" />

      {/* Background image with dark overlay */}
      <Image
        alt="Background"
        src="/images/hero/bg.png"
        fill
        priority
        className="object-cover opacity-10"
      />

      {/* Dot pattern overlay */}
      <DotPattern
        width={32}
        height={32}
        cx={1}
        cy={1}
        cr={0.8}
        className={cn(
          "absolute inset-0 opacity-20",
          "fill-red-400/30",
          "[mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]",
        )}
      />

      {/* Radial gradient spotlight */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/10 blur-[120px]"
        aria-hidden="true"
      />

      {/* Content card */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-105"
          >
            <Logo size="lg" className="h-10 w-10" />
            <span className="font-display text-2xl font-semibold tracking-tight text-white">
              OdisAI
            </span>
          </Link>
        </div>

        {/* Card with glass effect */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent" />

          <div className="relative space-y-6 text-center">
            {/* Error icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 ring-4 ring-red-500/20">
              <svg
                className="h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold text-white">
                Authentication Error
              </h1>
              <p className="text-sm text-slate-300">{getErrorMessage(error)}</p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                asChild
                className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-500/20 transition-all duration-300 hover:scale-[1.02] hover:from-teal-500 hover:to-teal-600 hover:shadow-xl hover:shadow-teal-500/30"
              >
                <Link href="/forgot-password">Request New Reset Link</Link>
              </Button>

              <Link
                href="/login"
                className="group inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-slate-300"
              >
                <svg
                  className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Footer link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-slate-400 transition-colors hover:text-slate-300"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-slate-950">
          <div className="animate-pulse text-slate-400">Loading...</div>
        </div>
      }
    >
      <AuthCodeErrorContent />
    </Suspense>
  );
}
