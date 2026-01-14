import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication | Odis AI",
  description: "Sign in or sign up to Odis AI",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page has its own full-page layout with two columns
  // Render children directly without wrapper
  return <>{children}</>;
}
