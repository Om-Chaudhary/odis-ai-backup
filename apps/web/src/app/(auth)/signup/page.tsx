import Link from "next/link";
import OnboardingContainer from "~/components/onboarding/onboarding-container";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Join OdisAI",
  description:
    "Register your veterinary practice with OdisAI to start handling calls with AI voice agents.",
  alternates: {
    canonical: "/signup",
  },
  openGraph: {
    title: "Sign Up for OdisAI",
    description:
      "Start your journey towards an AI-powered veterinary practice.",
    url: "/signup",
  },
};

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <OnboardingContainer />
      <div className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-teal-600 transition-colors duration-200 hover:text-teal-500"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
