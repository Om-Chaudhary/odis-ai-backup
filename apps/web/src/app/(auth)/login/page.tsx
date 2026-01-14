import { LoginFormTwoColumn } from "~/components/auth/login-form-two-column";
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
  return <LoginFormTwoColumn />;
}
