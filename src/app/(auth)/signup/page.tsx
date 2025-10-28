import { signUp } from "~/server/actions/auth";
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

export default function SignupPage() {
  return (
    <Card className="relative w-full overflow-hidden border-0 rounded-2xl bg-teal-50/60 shadow-xl backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-cyan-100/40" />
      <CardHeader className="relative pb-3 sm:pb-6">
        <CardTitle className="font-display text-xl sm:text-2xl font-bold text-slate-800">
          Create your account
        </CardTitle>
        <CardDescription className="text-slate-600 text-sm">
          Enter your email and password to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <form action={signUp} className="space-y-4 sm:space-y-6">
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
              className="border-slate-200 bg-white/90 text-slate-900 placeholder:text-slate-500 backdrop-blur-sm transition-all duration-200 focus:border-teal-500 focus:ring-teal-500/20"
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
              autoComplete="new-password"
              required
              placeholder="Create a secure password (min. 6 characters)"
              minLength={6}
              className="border-slate-200 bg-white/90 text-slate-900 placeholder:text-slate-500 backdrop-blur-sm transition-all duration-200 focus:border-teal-500 focus:ring-teal-500/20"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-[#2a9a92] hover:to-[#31aba3] hover:shadow-lg hover:shadow-[#31aba3]/30"
          >
            Create account
          </Button>
        </form>
        <div className="mt-4 sm:mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-teal-600 transition-colors duration-200 hover:text-teal-500"
          >
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
