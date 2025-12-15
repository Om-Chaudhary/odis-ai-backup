"use client";

import { cn } from "~/lib/utils";

type SectionBackgroundVariant =
  | "transition"
  | "subtle-warm"
  | "subtle-cool"
  | "accent-warm"
  | "accent-cool";

interface SectionBackgroundProps {
  variant: SectionBackgroundVariant;
  className?: string;
}

/**
 * SectionBackground - Provides cohesive gradient backgrounds for landing page sections
 *
 * Variants:
 * - transition: Gentle gradient for smooth section flow
 * - subtle-warm: Soft teal radial glow (top-right bias)
 * - subtle-cool: Soft slate-teal blend (top-left bias)
 * - accent-warm: More visible teal/emerald accents with floating orb
 * - accent-cool: Slate-dominant with teal accent orb
 */
export function SectionBackground({
  variant,
  className,
}: SectionBackgroundProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {variant === "transition" && <TransitionBackground />}
      {variant === "subtle-warm" && <SubtleWarmBackground />}
      {variant === "subtle-cool" && <SubtleCoolBackground />}
      {variant === "accent-warm" && <AccentWarmBackground />}
      {variant === "accent-cool" && <AccentCoolBackground />}
    </div>
  );
}

/** Gentle gradient bridging sections - used after hero and between accent zones */
function TransitionBackground() {
  return (
    <>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/50 to-white" />

      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(49, 171, 163, 0.06) 0%, transparent 60%)",
        }}
      />

      {/* Very subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #31aba3 0.5px, transparent 0.5px)",
          backgroundSize: "40px 40px",
        }}
      />
    </>
  );
}

/** Soft teal radial glow with top-right bias */
function SubtleWarmBackground() {
  return (
    <>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-teal-50/20 to-emerald-50/10" />

      {/* Primary radial glow - top right */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 60%)",
        }}
      />

      {/* Secondary subtle glow - bottom left */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 20% 80%, rgba(49, 171, 163, 0.05) 0%, transparent 50%)",
        }}
      />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #31aba3 0.5px, transparent 0.5px)",
          backgroundSize: "36px 36px",
        }}
      />
    </>
  );
}

/** Soft slate-teal blend with top-left bias */
function SubtleCoolBackground() {
  return (
    <>
      {/* Base gradient - cooler tones */}
      <div className="absolute inset-0 bg-gradient-to-bl from-slate-50/60 via-white to-teal-50/10" />

      {/* Primary radial glow - top left */}
      <div
        className="absolute inset-0 opacity-35"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 15% 25%, rgba(100, 116, 139, 0.06) 0%, transparent 55%)",
        }}
      />

      {/* Teal accent - center right */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background:
            "radial-gradient(ellipse 45% 50% at 85% 50%, rgba(49, 171, 163, 0.05) 0%, transparent 50%)",
        }}
      />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #64748b 0.5px, transparent 0.5px)",
          backgroundSize: "32px 32px",
        }}
      />
    </>
  );
}

/** More visible teal/emerald accents with animated floating orb */
function AccentWarmBackground() {
  return (
    <>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-teal-50/30 to-emerald-50/20" />

      {/* Animated gradient overlay - primary */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, rgba(16, 185, 129, 0.10) 0%, rgba(16, 185, 129, 0.03) 40%, transparent 65%)",
          animation: "gradient-move 22s ease-in-out infinite",
        }}
      />

      {/* Animated gradient overlay - secondary */}
      <div
        className="absolute inset-0 opacity-35"
        style={{
          background:
            "radial-gradient(circle at 30% 70%, rgba(49, 171, 163, 0.08) 0%, rgba(49, 171, 163, 0.02) 45%, transparent 70%)",
          animation: "gradient-move-reverse 26s ease-in-out infinite",
        }}
      />

      {/* Floating orb - top right area */}
      <div
        className="absolute top-[15%] right-[10%] h-[350px] w-[350px] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 60%)",
          animation: "float-slow 14s ease-in-out infinite",
        }}
      />

      {/* Floating orb - bottom left area */}
      <div
        className="absolute bottom-[20%] left-[5%] h-[250px] w-[250px] rounded-full opacity-15 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(49, 171, 163, 0.10) 0%, transparent 60%)",
          animation: "float-slow-reverse 16s ease-in-out infinite",
        }}
      />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #31aba3 0.5px, transparent 0.5px)",
          backgroundSize: "32px 32px",
        }}
      />
    </>
  );
}

/** Slate-dominant with teal accent orb */
function AccentCoolBackground() {
  return (
    <>
      {/* Base gradient - cooler dominant */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/40 via-white to-teal-50/15" />

      {/* Animated gradient overlay - slate primary */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 25% 35%, rgba(100, 116, 139, 0.08) 0%, rgba(100, 116, 139, 0.02) 45%, transparent 65%)",
          animation: "gradient-move 24s ease-in-out infinite",
        }}
      />

      {/* Animated gradient overlay - teal accent */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 75% 65%, rgba(49, 171, 163, 0.07) 0%, rgba(49, 171, 163, 0.02) 40%, transparent 60%)",
          animation: "gradient-move-reverse 28s ease-in-out infinite",
        }}
      />

      {/* Floating orb - top left (slate tinted) */}
      <div
        className="absolute top-[10%] left-[8%] h-[300px] w-[300px] rounded-full opacity-18 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(100, 116, 139, 0.10) 0%, transparent 60%)",
          animation: "float-slow 15s ease-in-out infinite",
        }}
      />

      {/* Floating orb - bottom right (teal accent) */}
      <div
        className="absolute right-[12%] bottom-[15%] h-[280px] w-[280px] rounded-full opacity-15 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(49, 171, 163, 0.08) 0%, transparent 60%)",
          animation: "float-slow-reverse 18s ease-in-out infinite",
        }}
      />

      {/* Dot pattern - slate colored */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #64748b 0.5px, transparent 0.5px)",
          backgroundSize: "36px 36px",
        }}
      />
    </>
  );
}
