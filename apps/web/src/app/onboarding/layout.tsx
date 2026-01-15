import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@odis-ai/shared/ui/Logo";
import { DotPattern } from "@odis-ai/shared/ui";
import { cn } from "@odis-ai/shared/util";

export const metadata: Metadata = {
  title: "Complete Your Setup | OdisAI",
  description:
    "Set up your veterinary practice on OdisAI. Create your clinic or join an existing team.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background image */}
      <Image
        alt="Veterinary care"
        src="/images/hero/bg.png"
        fill
        priority
        className="object-cover object-center opacity-60"
      />

      {/* Full-page teal overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-950/90 via-teal-900/85 to-teal-950/95 backdrop-blur-sm" />

      {/* Decorative flowing shape - top right */}
      <div
        className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-teal-400/5 blur-3xl"
        aria-hidden="true"
      />

      {/* Decorative flowing shape - bottom left */}
      <div
        className="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full bg-teal-300/5 blur-3xl"
        aria-hidden="true"
      />

      {/* Subtle dot pattern */}
      <DotPattern
        width={40}
        height={40}
        cx={1}
        cy={1}
        cr={0.6}
        className={cn(
          "absolute inset-0 opacity-[0.08]",
          "fill-teal-400/30",
          "[mask-image:radial-gradient(ellipse_80%_80%_at_50%_30%,black_20%,transparent_70%)]",
        )}
      />

      {/* Content */}
      <div className="relative flex h-full flex-col">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between px-6 py-4 md:px-10 md:py-6">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <Logo
              size="lg"
              className="h-8 w-8 transition-transform duration-300 group-hover:scale-105"
            />
            <span className="font-display text-xl font-semibold tracking-tight text-white">
              OdisAI
            </span>
          </Link>

          <p className="hidden text-sm text-teal-200/80 sm:block">
            Setting up your practice
          </p>
        </header>

        {/* Main content - scrollable area */}
        <main className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8 md:px-6">
          <div className="flex min-h-full w-full items-center justify-center">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="shrink-0 px-6 py-4 text-center md:px-10">
          <p className="text-xs text-teal-300/50">
            Need help?{" "}
            <a
              href="mailto:support@odisai.net"
              className="text-teal-300/70 underline-offset-2 transition-colors hover:text-teal-200 hover:underline"
            >
              Contact support
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
