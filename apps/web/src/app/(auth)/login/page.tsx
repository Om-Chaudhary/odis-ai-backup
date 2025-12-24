import { signIn } from "~/server/actions/auth";
import Link from "next/link";
import { Button } from "@odis-ai/shared/ui/button";
import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your Odis AI veterinary practice management account. Access your dashboard and manage your practice efficiently.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-teal-50/60 p-6 shadow-xl backdrop-blur-md sm:p-8">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-teal-50/50 to-cyan-100/40" />
      <div className="relative space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h1 className="font-display text-xl font-bold text-slate-800 sm:text-2xl">
            Sign in to your account
          </h1>
          <p className="text-sm text-slate-600">
            Enter your email and password to access your account
          </p>
        </div>
        <form action={signIn} className="space-y-4 sm:space-y-6">
          <div className="space-y-1.5 sm:space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
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
              className="border-slate-200 bg-white/90 text-slate-900 backdrop-blur-sm transition-all duration-200 placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
            />
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Your secure password"
              className="border-slate-200 bg-white/90 text-slate-900 backdrop-blur-sm transition-all duration-200 placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-[#2a9a92] hover:to-[#31aba3] hover:shadow-lg hover:shadow-[#31aba3]/30"
          >
            Sign in
          </Button>
        </form>
        <div className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-teal-600 transition-colors duration-200 hover:text-teal-500"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
