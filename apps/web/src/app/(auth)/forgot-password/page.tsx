"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@odis-ai/shared/ui/button";
import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { Logo } from "@odis-ai/shared/ui/Logo";
import { DotPattern } from "@odis-ai/shared/ui";
import { cn } from "@odis-ai/shared/util";
import { requestPasswordReset } from "~/server/actions/auth";

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    const result = await requestPasswordReset(formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      setIsSuccess(true);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900" />

      {/* Background image with dark overlay */}
      <Image
        alt="Veterinary care background"
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
          "fill-teal-400/30",
          "[mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]",
        )}
      />

      {/* Radial gradient spotlight */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[120px]"
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
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent" />

          <div className="relative">
            {isSuccess ? (
              // Success state
              <div className="space-y-6 text-center">
                {/* Success icon */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 ring-4 ring-teal-500/20">
                  <svg
                    className="h-8 w-8 text-teal-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h1 className="font-display text-2xl font-bold text-white">
                    Check your email
                  </h1>
                  <p className="text-sm text-slate-300">
                    We&apos;ve sent a password reset link to your email address.
                    Click the link in the email to reset your password.
                  </p>
                </div>

                <div className="pt-4">
                  <Link
                    href="/login"
                    className="group inline-flex items-center gap-2 text-sm font-medium text-teal-400 transition-colors hover:text-teal-300"
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
            ) : (
              // Form state
              <div className="space-y-6">
                {/* Lock icon */}
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-4 ring-teal-500/10">
                  <svg
                    className="h-7 w-7 text-teal-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>

                <div className="space-y-2 text-center">
                  <h1 className="font-display text-2xl font-bold text-white">
                    Forgot your password?
                  </h1>
                  <p className="text-sm text-slate-300">
                    No worries! Enter your email and we&apos;ll send you a link
                    to reset your password.
                  </p>
                </div>

                <form action={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-slate-200"
                    >
                      Email address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="veterinarian@clinic.com"
                      className="border-slate-700 bg-slate-900/50 text-white backdrop-blur-sm transition-all duration-200 placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500/30"
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-500/20 transition-all duration-300 hover:scale-[1.02] hover:from-teal-500 hover:to-teal-600 hover:shadow-xl hover:shadow-teal-500/30 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
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
                        Sending...
                      </span>
                    ) : (
                      "Send reset link"
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm text-slate-400">
                  Remember your password?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-teal-400 transition-colors hover:text-teal-300"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-slate-400 transition-colors hover:text-slate-300"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
