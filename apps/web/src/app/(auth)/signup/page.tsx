import { SignupFormTwoColumn } from "~/components/auth/signup-form-two-column";
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
  return <SignupFormTwoColumn />;
}
