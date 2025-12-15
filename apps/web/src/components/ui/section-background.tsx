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
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/40 to-white" />

      {/* Radial teal glow - top center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 45% at 50% 0%, rgba(49, 171, 163, 0.05) 0%, transparent 55%)",
        }}
      />

      {/* Emerald accent - bottom right corner */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 85% 90%, rgba(16, 185, 129, 0.04) 0%, transparent 50%)",
        }}
      />

      {/* Subtle center depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(49, 171, 163, 0.02) 0%, transparent 60%)",
        }}
      />

      {/* Very subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #31aba3 0.5px, transparent 0.5px)",
          backgroundSize: "36px 36px",
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
      <div className="absolute inset-0 bg-gradient-to-br from-white via-teal-50/25 to-emerald-50/15" />

      {/* Primary radial glow - top right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 80% 15%, rgba(16, 185, 129, 0.08) 0%, transparent 60%)",
        }}
      />

      {/* Secondary subtle glow - bottom left */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 15% 85%, rgba(49, 171, 163, 0.06) 0%, transparent 55%)",
        }}
      />

      {/* Center depth glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(49, 171, 163, 0.03) 0%, transparent 55%)",
        }}
      />

      {/* Emerald accent top-left */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 40% 35% at 10% 20%, rgba(16, 185, 129, 0.04) 0%, transparent 50%)",
        }}
      />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #31aba3 0.5px, transparent 0.5px)",
          backgroundSize: "32px 32px",
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
      <div className="absolute inset-0 bg-gradient-to-bl from-slate-50/50 via-white to-teal-50/15" />

      {/* Primary radial glow - top left */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 12% 20%, rgba(100, 116, 139, 0.05) 0%, transparent 55%)",
        }}
      />

      {/* Teal accent - center right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 55% at 88% 50%, rgba(49, 171, 163, 0.05) 0%, transparent 55%)",
        }}
      />

      {/* Center depth glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(49, 171, 163, 0.02) 0%, transparent 55%)",
        }}
      />

      {/* Emerald hint bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 35% at 50% 95%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)",
        }}
      />

      {/* Dot pattern - mix of slate and teal */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #31aba3 0.5px, transparent 0.5px)",
          backgroundSize: "34px 34px",
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
      <div className="absolute inset-0 bg-gradient-to-b from-white via-teal-50/25 to-emerald-50/15" />

      {/* Primary radial accent - upper area */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 65% 20%, rgba(16, 185, 129, 0.07) 0%, transparent 55%)",
        }}
      />

      {/* Secondary radial accent - lower area */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 35% 75%, rgba(49, 171, 163, 0.05) 0%, transparent 55%)",
        }}
      />

      {/* Center depth glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(49, 171, 163, 0.035) 0%, transparent 60%)",
        }}
      />

      {/* Floating orb - top right area */}
      <div
        className="absolute top-[10%] right-[8%] h-[300px] w-[300px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 55%)",
          animation: "float-slow 14s ease-in-out infinite",
        }}
      />

      {/* Floating orb - bottom left area */}
      <div
        className="absolute bottom-[15%] left-[5%] h-[220px] w-[220px] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(49, 171, 163, 0.06) 0%, transparent 55%)",
          animation: "float-slow-reverse 16s ease-in-out infinite",
        }}
      />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #31aba3 0.5px, transparent 0.5px)",
          backgroundSize: "30px 30px",
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
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/35 via-white to-teal-50/12" />

      {/* Primary radial - slate upper area */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 25% 30%, rgba(100, 116, 139, 0.05) 0%, transparent 55%)",
        }}
      />

      {/* Teal accent - lower right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% 70%, rgba(49, 171, 163, 0.05) 0%, transparent 55%)",
        }}
      />

      {/* Center depth glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(49, 171, 163, 0.025) 0%, transparent 55%)",
        }}
      />

      {/* Floating orb - top left (slate tinted) */}
      <div
        className="absolute top-[8%] left-[6%] h-[260px] w-[260px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(100, 116, 139, 0.06) 0%, transparent 55%)",
          animation: "float-slow 15s ease-in-out infinite",
        }}
      />

      {/* Floating orb - bottom right (teal accent) */}
      <div
        className="absolute right-[10%] bottom-[12%] h-[240px] w-[240px] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(49, 171, 163, 0.055) 0%, transparent 55%)",
          animation: "float-slow-reverse 18s ease-in-out infinite",
        }}
      />

      {/* Dot pattern - teal tinted for cohesion */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #31aba3 0.5px, transparent 0.5px)",
          backgroundSize: "34px 34px",
        }}
      />
    </>
  );
}
