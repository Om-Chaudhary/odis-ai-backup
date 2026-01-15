import type { Metadata } from "next";
import { ResetPasswordTwoColumn } from "~/components/auth/reset-password-two-column";

export const metadata: Metadata = {
  title: "Reset Password | OdisAI",
  description: "Set a new password for your OdisAI account",
};

export default function ResetPasswordPage() {
  return <ResetPasswordTwoColumn />;
}
