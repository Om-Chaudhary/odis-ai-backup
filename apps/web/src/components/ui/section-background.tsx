"use client";

import { cn } from "~/lib/utils";

type SectionBackgroundVariant =
  // Legacy variants (kept for backwards compatibility)
  | "transition"
  | "subtle-warm"
  | "subtle-cool"
  | "accent-warm"
  | "accent-cool"
  // New research-informed variants
  | "hero-glow"
  | "warm-violet"
  | "subtle-dark"
  | "cool-blue"
  | "mesh-warm"
  | "mesh-cool"
  | "accent-cta"
  | "fade-out";

interface SectionBackgroundProps {
  variant: SectionBackgroundVariant;
  className?: string;
}

/**
 * SectionBackground - Provides cohesive gradient backgrounds for landing page sections
 *
 * New Variants (Research-Informed):
 * - hero-glow: Teal/emerald radial with subtle violet accent orbs
 * - warm-violet: Teal base with purple/violet gradient accents
 * - subtle-dark: Soft navy/slate radial for dark sections
 * - cool-blue: Blue/indigo undertones with teal highlights
 * - mesh-warm: Multi-color mesh gradient (teal + violet + emerald)
 * - mesh-cool: Multi-color mesh gradient (blue + indigo + teal)
 * - accent-cta: Vibrant teal/emerald with purple glow for CTA emphasis
 * - fade-out: Gentle fade for pre-footer
 *
 * Legacy Variants (kept for backwards compatibility):
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
      {/* New variants */}
      {variant === "hero-glow" && <HeroGlowBackground />}
      {variant === "warm-violet" && <WarmVioletBackground />}
      {variant === "subtle-dark" && <SubtleDarkBackground />}
      {variant === "cool-blue" && <CoolBlueBackground />}
      {variant === "mesh-warm" && <MeshWarmBackground />}
      {variant === "mesh-cool" && <MeshCoolBackground />}
      {variant === "accent-cta" && <AccentCTABackground />}
      {variant === "fade-out" && <FadeOutBackground />}
      {/* Legacy variants */}
      {variant === "transition" && <TransitionBackground />}
      {variant === "subtle-warm" && <SubtleWarmBackground />}
      {variant === "subtle-cool" && <SubtleCoolBackground />}
      {variant === "accent-warm" && <AccentWarmBackground />}
      {variant === "accent-cool" && <AccentCoolBackground />}
    </div>
  );
}

// =============================================================================
// NEW VARIANTS - Research-Informed Backgrounds
// =============================================================================

/**
 * Hero Glow - Warm teal center with violet accent orb
 * Effect: Warm, inviting, brand-establishing
 */
function HeroGlowBackground() {
  return (
    <>
      {/* Base gradient - white to teal-50 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-teal-50/20 to-white" />

      {/* Primary teal radial - center focal point */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(20, 184, 166, 0.08) 0%, transparent 60%)",
        }}
      />

      {/* Violet accent orb - top right (key differentiator) */}
      <div
        className="absolute -top-[10%] right-[5%] h-[400px] w-[400px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.10) 0%, transparent 60%)",
          animation: "float-slow 16s ease-in-out infinite",
        }}
      />

      {/* Emerald accent - bottom left balance */}
      <div
        className="absolute bottom-[10%] left-[8%] h-[300px] w-[300px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.07) 0%, transparent 55%)",
          animation: "float-slow-reverse 18s ease-in-out infinite",
        }}
      />

      {/* Secondary teal glow - adds depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 30% 70%, rgba(49, 171, 163, 0.05) 0%, transparent 50%)",
        }}
      />

      {/* Subtle dot pattern */}
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

/**
 * Warm Violet - Purple hints blending with teal base
 * Effect: Engaging, premium feel for demo content
 */
function WarmVioletBackground() {
  return (
    <>
      {/* Base gradient - white to violet-50 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-violet-50/15 to-white" />

      {/* Primary violet radial - upper left */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 30% 40%, rgba(139, 92, 246, 0.08) 0%, transparent 55%)",
        }}
      />

      {/* Teal accent - balances the violet */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at 70% 60%, rgba(20, 184, 166, 0.06) 0%, transparent 55%)",
        }}
      />

      {/* Floating violet orb - top right */}
      <div
        className="absolute top-[5%] right-[10%] h-[280px] w-[280px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(167, 139, 250, 0.09) 0%, transparent 55%)",
          animation: "float-slow 14s ease-in-out infinite",
        }}
      />

      {/* Emerald hint - bottom for warmth */}
      <div
        className="absolute bottom-[15%] left-[15%] h-[220px] w-[220px] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 55%)",
          animation: "float-slow-reverse 16s ease-in-out infinite",
        }}
      />

      {/* Center depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(139, 92, 246, 0.03) 0%, transparent 60%)",
        }}
      />

      {/* Subtle dot pattern with violet tint */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #8b5cf6 0.5px, transparent 0.5px)",
          backgroundSize: "34px 34px",
        }}
      />
    </>
  );
}

/**
 * Subtle Dark - Soft navy/slate pool (not harsh black)
 * Effect: Data credibility, contrast for numbers
 * Includes smooth transition overlays at top/bottom
 */
function SubtleDarkBackground() {
  return (
    <>
      {/* Main dark radial - soft navy/slate */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 130% 90% at 50% 50%, 
              rgba(15, 23, 42, 0.78) 0%,
              rgba(15, 23, 42, 0.65) 35%,
              rgba(30, 41, 59, 0.45) 55%,
              rgba(51, 65, 85, 0.20) 72%,
              transparent 100%
            )
          `,
        }}
      />

      {/* Secondary radial for depth - slightly offset */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 70% at 50% 55%, 
              rgba(15, 23, 42, 0.45) 0%,
              rgba(30, 41, 59, 0.25) 40%,
              transparent 75%
            )
          `,
        }}
      />

      {/* Top transition fade - blends from previous section */}
      <div
        className="absolute inset-x-0 top-0 h-24"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 0%, transparent 100%)",
        }}
      />

      {/* Bottom transition fade - blends to next section */}
      <div
        className="absolute inset-x-0 bottom-0 h-24"
        style={{
          background:
            "linear-gradient(to top, rgba(255, 255, 255, 0.12) 0%, transparent 100%)",
        }}
      />

      {/* Teal glow - top right (softened) */}
      <div
        className="absolute -top-10 right-[8%] h-[400px] w-[400px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(49, 171, 163, 0.10) 0%, transparent 55%)",
          animation: "float-slow 14s ease-in-out infinite",
        }}
      />

      {/* Teal glow - bottom left */}
      <div
        className="absolute -bottom-10 left-[8%] h-[350px] w-[350px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(49, 171, 163, 0.08) 0%, transparent 55%)",
          animation: "float-slow-reverse 16s ease-in-out infinite",
        }}
      />

      {/* Violet accent - center subtle */}
      <div
        className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 60%)",
          animation: "float-gentle 20s ease-in-out infinite",
        }}
      />

      {/* Subtle dot pattern - teal tinted */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(49, 171, 163, 0.8) 0.5px, transparent 0.5px)",
          backgroundSize: "28px 28px",
        }}
      />
    </>
  );
}

/**
 * Cool Blue - Blue/indigo undertones with teal highlights
 * Effect: Fresh, clear, process-oriented
 */
function CoolBlueBackground() {
  return (
    <>
      {/* Base gradient - white to indigo-50 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-indigo-50/12 to-white" />

      {/* Primary blue radial - upper area */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 30%, rgba(99, 102, 241, 0.07) 0%, transparent 55%)",
        }}
      />

      {/* Indigo accent orb - top right */}
      <div
        className="absolute top-[8%] right-[12%] h-[300px] w-[300px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(129, 140, 248, 0.09) 0%, transparent 55%)",
          animation: "float-slow 15s ease-in-out infinite",
        }}
      />

      {/* Teal balance - bottom left */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 75% 70%, rgba(20, 184, 166, 0.05) 0%, transparent 55%)",
        }}
      />

      {/* Blue orb - bottom */}
      <div
        className="absolute bottom-[10%] left-[20%] h-[250px] w-[250px] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 55%)",
          animation: "float-slow-reverse 17s ease-in-out infinite",
        }}
      />

      {/* Center depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99, 102, 241, 0.025) 0%, transparent 60%)",
        }}
      />

      {/* Subtle dot pattern with blue tint */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #6366f1 0.5px, transparent 0.5px)",
          backgroundSize: "36px 36px",
        }}
      />
    </>
  );
}

/**
 * Mesh Warm - Multi-color mesh gradient (teal + violet + emerald)
 * Effect: Warm, trustworthy, social proof emphasis
 */
function MeshWarmBackground() {
  return (
    <>
      {/* Base gradient - white to emerald-50 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-emerald-50/10 to-white" />

      {/* Mesh layer 1 - Violet (top left) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 30% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)",
        }}
      />

      {/* Mesh layer 2 - Teal (center right) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at 70% 60%, rgba(20, 184, 166, 0.07) 0%, transparent 50%)",
        }}
      />

      {/* Mesh layer 3 - Emerald (bottom center) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 80%, rgba(16, 185, 129, 0.06) 0%, transparent 50%)",
        }}
      />

      {/* Floating mesh orb - violet */}
      <div
        className="absolute top-[15%] right-[15%] h-[260px] w-[260px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, transparent 55%)",
          animation: "mesh-drift 18s ease-in-out infinite",
        }}
      />

      {/* Floating mesh orb - teal */}
      <div
        className="absolute bottom-[20%] left-[10%] h-[240px] w-[240px] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(49, 171, 163, 0.07) 0%, transparent 55%)",
          animation: "mesh-drift-reverse 20s ease-in-out infinite",
        }}
      />

      {/* Center cohesion glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(20, 184, 166, 0.03) 0%, transparent 60%)",
        }}
      />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #14b8a6 0.5px, transparent 0.5px)",
          backgroundSize: "32px 32px",
        }}
      />
    </>
  );
}

/**
 * Mesh Cool - Multi-color mesh gradient (blue + indigo + teal)
 * Effect: Professional, technical competence
 */
function MeshCoolBackground() {
  return (
    <>
      {/* Base gradient - white to blue-50 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/10 to-white" />

      {/* Mesh layer 1 - Indigo (top left) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 20% 30%, rgba(99, 102, 241, 0.07) 0%, transparent 50%)",
        }}
      />

      {/* Mesh layer 2 - Teal (center right) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at 80% 50%, rgba(20, 184, 166, 0.06) 0%, transparent 50%)",
        }}
      />

      {/* Mesh layer 3 - Violet (bottom) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 40% 90%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)",
        }}
      />

      {/* Floating mesh orb - indigo */}
      <div
        className="absolute top-[10%] left-[12%] h-[280px] w-[280px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(129, 140, 248, 0.08) 0%, transparent 55%)",
          animation: "mesh-drift 16s ease-in-out infinite",
        }}
      />

      {/* Floating mesh orb - teal */}
      <div
        className="absolute right-[8%] bottom-[15%] h-[250px] w-[250px] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(49, 171, 163, 0.07) 0%, transparent 55%)",
          animation: "mesh-drift-reverse 19s ease-in-out infinite",
        }}
      />

      {/* Center cohesion glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(99, 102, 241, 0.025) 0%, transparent 60%)",
        }}
      />

      {/* Subtle dot pattern with blue tint */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #6366f1 0.5px, transparent 0.5px)",
          backgroundSize: "34px 34px",
        }}
      />
    </>
  );
}

/**
 * Accent CTA - Vibrant teal/emerald with purple glow for CTA emphasis
 * Effect: Full-circle, urgency, action-oriented
 * Uses directional gradient to draw eye toward center/bottom
 */
function AccentCTABackground() {
  return (
    <>
      {/* Base gradient - echoes hero (full-circle journey) */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-teal-50/20 to-white" />

      {/* Primary radial - draws attention center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(20, 184, 166, 0.10) 0%, transparent 60%)",
        }}
      />

      {/* Purple accent glow - adds urgency/premium feel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 55%)",
        }}
      />

      {/* Directional gradient - guides eye downward to CTA */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(20, 184, 166, 0.04) 50%, rgba(139, 92, 246, 0.03) 100%)",
        }}
      />

      {/* Vibrant floating orb - top */}
      <div
        className="absolute top-[5%] left-1/2 h-[350px] w-[350px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.10) 0%, transparent 55%)",
          animation: "float-gentle 14s ease-in-out infinite",
        }}
      />

      {/* Violet accent orb - side */}
      <div
        className="absolute top-[30%] right-[5%] h-[280px] w-[280px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(167, 139, 250, 0.09) 0%, transparent 55%)",
          animation: "float-slow 16s ease-in-out infinite",
        }}
      />

      {/* Emerald orb - other side */}
      <div
        className="absolute bottom-[25%] left-[8%] h-[260px] w-[260px] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 55%)",
          animation: "float-slow-reverse 18s ease-in-out infinite",
        }}
      />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #14b8a6 0.5px, transparent 0.5px)",
          backgroundSize: "30px 30px",
        }}
      />
    </>
  );
}

/**
 * Fade Out - Gentle fade for pre-footer
 * Effect: Calm resolution, transition to footer
 */
function FadeOutBackground() {
  return (
    <>
      {/* Base gradient - teal to slate (pre-footer) */}
      <div className="absolute inset-0 bg-gradient-to-b from-teal-50/10 via-white to-slate-50/25" />

      {/* Subtle teal glow - top (connects to previous section) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(20, 184, 166, 0.05) 0%, transparent 55%)",
        }}
      />

      {/* Fading depth - center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(100, 116, 139, 0.02) 0%, transparent 60%)",
        }}
      />

      {/* Slate hint - bottom (prepares for footer) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 35% at 50% 100%, rgba(100, 116, 139, 0.04) 0%, transparent 50%)",
        }}
      />

      {/* Minimal floating element - subtle movement */}
      <div
        className="absolute right-[15%] bottom-[20%] h-[200px] w-[200px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(49, 171, 163, 0.04) 0%, transparent 55%)",
          animation: "float-gentle 22s ease-in-out infinite",
        }}
      />

      {/* Very subtle dot pattern - fading out */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #64748b 0.5px, transparent 0.5px)",
          backgroundSize: "38px 38px",
        }}
      />
    </>
  );
}

// =============================================================================
// LEGACY VARIANTS - Kept for backwards compatibility
// =============================================================================

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
