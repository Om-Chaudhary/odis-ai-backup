"use client";

import { signIn } from "~/server/actions/auth";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@odis-ai/shared/ui/button";
import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import { Logo } from "@odis-ai/shared/ui/Logo";
import { cn } from "@odis-ai/shared/util";
import { DotPattern } from "@odis-ai/shared/ui";

export function LoginFormTwoColumn() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Fallback timeout for image loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsImageLoaded(true);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative grid min-h-svh lg:grid-cols-2">
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

      {/* Left Column - Login Form */}
      <div className="relative flex flex-col gap-4 p-6 md:p-10">
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
            {/* Title */}
            <div className="space-y-2 text-center">
              <h1 className="font-display text-3xl font-bold tracking-tight text-white">
                Login to your account
              </h1>
              <p className="text-sm text-slate-200">
                Enter your email below to login to your account
              </p>
            </div>

            {/* Login Form */}
            <form action={signIn} className="space-y-4">
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

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-100"
                  >
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-teal-300 underline-offset-4 transition-colors hover:text-teal-200 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Your secure password"
                  className="border-slate-200 bg-white/90 text-slate-900 backdrop-blur-sm transition-all duration-200 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500/20"
                />
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-teal-500 hover:to-teal-600 hover:shadow-xl hover:shadow-teal-500/30"
              >
                Login
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center text-sm text-slate-200">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-teal-300 underline-offset-4 transition-colors hover:text-teal-200 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>

        {/* Testimonial - Bottom of Left Column */}
        <div className="relative mt-auto space-y-4">
          <blockquote className="space-y-2">
            <p className="text-sm text-slate-100 italic">
              &ldquo;OdisAI has transformed how we handle client communications.
              Our team can now focus on patient care while Odis handles
              follow-ups flawlessly.&rdquo;
            </p>
            <footer className="text-sm font-medium text-white">
              - Dr. Sarah Mitchell, DVM
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
