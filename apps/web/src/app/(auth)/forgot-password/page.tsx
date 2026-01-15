import type { Metadata } from "next";
import { ForgotPasswordTwoColumn } from "~/components/auth/forgot-password-two-column";

export const metadata: Metadata = {
  title: "Forgot Password | OdisAI",
  description: "Reset your OdisAI account password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordTwoColumn />;
}
