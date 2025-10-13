import { signIn } from "~/server/actions/auth";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="relative w-full max-w-md overflow-hidden border-0 bg-white/80 shadow-xl backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-emerald-50/30" />
        <CardHeader className="relative">
          <CardTitle className="font-display text-2xl font-bold text-slate-800">
            Sign in to your account
          </CardTitle>
          <CardDescription className="text-slate-600">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <form action={signIn} className="space-y-6">
            <div className="space-y-2">
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
                className="border-slate-200 bg-white/50 backdrop-blur-sm transition-all duration-200 focus:border-teal-500 focus:ring-teal-500/20"
              />
            </div>
            <div className="space-y-2">
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
                className="border-slate-200 bg-white/50 backdrop-blur-sm transition-all duration-200 focus:border-teal-500 focus:ring-teal-500/20"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-[#2a9a92] hover:to-[#31aba3] hover:shadow-lg hover:shadow-[#31aba3]/30"
            >
              Sign in
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-teal-600 transition-colors duration-200 hover:text-teal-500"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
