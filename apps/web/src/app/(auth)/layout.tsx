import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Authentication | Odis AI",
  description: "Sign in or sign up to Odis AI",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50 via-emerald-100/40 to-emerald-50/30 px-4 py-4 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div
          style={{
            background:
              "radial-gradient(circle at 30% 40%, rgba(49, 171, 163, 0.12) 0%, rgba(49, 171, 163, 0.06) 40%, transparent 70%)",
          }}
          className="animate-gradient-move absolute inset-0 opacity-70 blur-sm"
        />
        <div
          style={{
            background:
              "radial-gradient(circle at 70% 60%, rgba(49, 171, 163, 0.10) 0%, rgba(49, 171, 163, 0.05) 50%, transparent 80%)",
          }}
          className="animate-gradient-move-reverse absolute inset-0 opacity-50 blur-sm"
        />
        <div
          style={{
            background:
              "radial-gradient(circle, rgba(49, 171, 163, 0.06) 0%, transparent 60%)",
          }}
          className="animate-float-slow absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full opacity-40 blur-3xl transition-opacity duration-1000 hover:opacity-60"
        />
        <div
          style={{
            background:
              "radial-gradient(circle, rgba(49, 171, 163, 0.05) 0%, transparent 60%)",
          }}
          className="animate-float-slow-reverse absolute right-1/3 bottom-1/3 h-[300px] w-[300px] rounded-full opacity-35 blur-3xl transition-opacity duration-1000 hover:opacity-50"
        />
      </div>

      {/* Dotted Background */}
      <div
        style={{
          backgroundImage:
            "radial-gradient(circle, #31aba3 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        className="pointer-events-none absolute inset-0 opacity-15"
      />

      <div className="relative w-full max-w-md space-y-3 sm:space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 p-2 shadow-lg sm:h-16 sm:w-16 sm:p-3">
            <Image
              src="/icon-128.png"
              alt="Odis AI"
              width={128}
              height={128}
              className="h-full w-full"
              priority
            />
          </div>
          <h2 className="font-display mt-3 text-2xl font-bold tracking-tight text-slate-800 sm:mt-6 sm:text-3xl">
            Welcome to Odis AI
          </h2>
          <p className="mt-1 text-sm text-slate-600 sm:mt-2">
            Streamline your veterinary practice with AI
          </p>
        </div>
        {children}
        <div className="text-center">
          <Link
            href="/"
            className="font-medium text-teal-600 transition-colors duration-200 hover:text-teal-500"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
