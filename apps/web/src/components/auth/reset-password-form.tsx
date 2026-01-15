"use client";

import { useState } from "react";
import { updatePassword } from "~/server/actions/auth";
import { Button, Input, Label } from "@odis-ai/shared/ui";
import Link from "next/link";

export function ResetPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);
    const result = await updatePassword(formData);
    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="w-1/2 space-y-4 sm:space-y-6">
      <div className="overflow-hidden rounded-2xl bg-teal-100/50 p-6 shadow-xl backdrop-blur-md sm:p-8">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-teal-50/50 to-cyan-100/40" />
        <div className="relative space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-xl font-bold text-slate-800 sm:text-2xl">
              Set a new password
            </h1>
            <p className="text-sm text-slate-600">
              Enter your new password below. Make sure it&apos;s at least 6
              characters long.
            </p>
          </div>
          <form action={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                New password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Enter your new password"
                className="border-slate-200 bg-white/90 text-slate-900 backdrop-blur-sm transition-all duration-200 placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-slate-700"
              >
                Confirm new password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Confirm your new password"
                className="border-slate-200 bg-white/90 text-slate-900 backdrop-blur-sm transition-all duration-200 placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
              />
            </div>
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-linear-to-r from-teal-800 to-slate-900 text-white shadow-lg transition-all duration-300 hover:scale-101 hover:from-slate-900 hover:to-teal-700 hover:shadow-lg hover:shadow-[#31aba3]/30 disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Update password"}
            </Button>
          </form>
          <div className="text-center text-sm text-slate-600">
            <Link
              href="/login"
              className="font-medium text-teal-600 transition-colors duration-200 hover:text-teal-500"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
      {error && <div className="text-red-600">{error}</div>}
    </form>
  );
}
