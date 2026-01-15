"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@odis-ai/shared/ui/button";
import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { Logo } from "@odis-ai/shared/ui/Logo";
import { DotPattern } from "@odis-ai/shared/ui";
import { cn } from "@odis-ai/shared/util";
import { requestPasswordReset } from "~/server/actions/auth";

export function ForgotPasswordTwoColumn() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback timeout for image loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsImageLoaded(true);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

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
    <div className="relative grid h-screen overflow-hidden lg:grid-cols-2">
      {/* Full-screen background image */}
      <Image
        alt="Veterinary care"
        src="/images/hero/bg.png"
        fill
        priority
        onLoad={() => setIsImageLoaded(true)}
        className={cn(
          "object-cover object-center transition-opacity duration-700",
          isImageLoaded ? "opacity-70" : "opacity-0",
        )}
      />

      {/* Left Column - Forgot Password Form */}
      <div className="relative flex h-full flex-col gap-4 overflow-y-auto p-6 md:p-10">
        {/* Blurred teal overlay for readability */}
        <div className="absolute inset-0 bg-teal-950/75 backdrop-blur-md" />

        {/* Subtle dot pattern overlay */}
        <DotPattern
          width={32}
          height={32}
          cx={1}
          cy={1}
          cr={0.8}
          className={cn("absolute inset-0 opacity-[0.15]", "fill-teal-400/20")}
        />

        {/* Header with Logo */}
        <div className="relative flex justify-center gap-2 md:justify-start">
          <Link
            href="/"
            className="group flex items-center gap-2.5 font-medium"
          >
            <Logo
              size="lg"
              className="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
            />
            <span className="font-display text-xl font-semibold tracking-tight text-white">
              OdisAI
            </span>
          </Link>
        </div>

        {/* Form Section - Centered */}
        <div className="relative flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            {isSuccess ? (
              // Success State
              <div className="space-y-6 text-center">
                {/* Success Icon */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/30 to-emerald-500/20 ring-4 ring-teal-500/20">
                  <svg
                    className="h-8 w-8 text-teal-300"
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
                  <h1 className="font-display text-3xl font-bold tracking-tight text-white">
                    Check your email
                  </h1>
                  <p className="text-sm text-slate-200">
                    We&apos;ve sent a password reset link to your email address.
                    Click the link in the email to reset your password.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-teal-300 transition-colors hover:text-teal-200"
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
            ) : (
              // Form State
              <>
                {/* Title */}
                <div className="space-y-2 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/20 ring-4 ring-teal-500/10">
                    <svg
                      className="h-7 w-7 text-teal-300"
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
                  <h1 className="font-display text-3xl font-bold tracking-tight text-white">
                    Forgot your password?
                  </h1>
                  <p className="text-sm text-slate-200">
                    No worries! Enter your email and we&apos;ll send you a link
                    to reset your password.
                  </p>
                </div>

                {/* Forgot Password Form */}
                <form action={handleSubmit} className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-slate-100"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="veterinarian@clinic.com"
                      className="border-slate-200 bg-white/90 text-slate-900 backdrop-blur-sm transition-all duration-200 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500/20"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-teal-500 hover:to-teal-600 hover:shadow-xl hover:shadow-teal-500/30 disabled:opacity-50 disabled:hover:scale-100"
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

                {/* Sign In Link */}
                <div className="text-center text-sm text-slate-200">
                  Remember your password?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-teal-300 underline-offset-4 transition-colors hover:text-teal-200 hover:underline"
                  >
                    Sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Testimonial - Bottom of Left Column */}
        <div className="relative mt-auto space-y-4">
          <blockquote className="space-y-2">
            <p className="text-sm text-slate-100 italic">
              &ldquo;The support team at OdisAI is incredible. They helped us
              get set up quickly and our clients love the seamless
              experience.&rdquo;
            </p>
            <footer className="text-sm font-medium text-white">
              - Dr. Emily Chen, DVM
            </footer>
          </blockquote>

          {/* Back to home link */}
          <div className="text-center">
            <Link
              href="/"
              className="text-sm font-medium text-teal-300 transition-colors duration-200 hover:text-teal-200"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column - Darker overlay */}
      <div className="relative hidden bg-teal-950/70 lg:block">
        {/* Primary gradient overlay - stronger on edges */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-950/50 via-teal-900/30 to-teal-950/60" />

        {/* Vertical gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-950/40 via-transparent to-teal-950/70" />

        {/* Radial gradient for center focus - spotlight effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,transparent_20%,rgba(4,47,46,0.6)_100%)]" />

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Dot pattern - teal tinted */}
        <DotPattern
          width={32}
          height={32}
          cx={1}
          cy={1}
          cr={0.8}
          className={cn(
            "absolute inset-0",
            "mask-[linear-gradient(to_bottom,black,transparent_60%)]",
            "fill-teal-400/8",
          )}
        />

        {/* Subtle ambient glow */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[100px]"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
