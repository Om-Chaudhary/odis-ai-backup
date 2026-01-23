"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { usePostHog } from "posthog-js/react";
import {
  Calendar,
  Play,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { usePageLoaded } from "~/hooks/use-page-loaded";
import { Logo } from "@odis-ai/shared/ui/Logo";
import { WordRotate } from "../ui/word-rotate";
import { AnimatedGradientText } from "../ui/animated-gradient-text";
import { NumberTicker } from "../ui/number-ticker";
import { DotPattern } from "@odis-ai/shared/ui";

// Rotating words for dynamic headline - benefit-focused
const ROTATING_WORDS = [
  "Never Misses a Call",
  "Books More Appointments",
  "Saves 15+ Hours Weekly",
  "Works 24/7",
];

// Social proof stats
const STATS = [
  { value: 5000, suffix: "+", label: "Calls Handled" },
  { value: 98, suffix: "%", label: "Client Satisfaction" },
  { value: 15, suffix: "+", label: "Hours Saved Weekly" },
];

// Navigation links
const NAVIGATION_LINKS = [
  { name: "Features", link: "#features" },
  { name: "How It Works", link: "#how-it-works" },
  { name: "Testimonials", link: "#testimonials" },
];

// Animation variants - slower, more noticeable
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function HeroSection() {
  const posthog = usePostHog();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const isPageLoaded = usePageLoaded(150); // Wait for page load + 150ms
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fallback timeout - don't wait forever if image fails to load
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsImageLoaded(true);
    }, 3000); // 3 second max wait
    return () => clearTimeout(timeout);
  }, []);

  // Only start animations once page is loaded, section is in view, AND image is ready
  const shouldAnimate = isPageLoaded && isInView && isImageLoaded;

  const handleScheduleDemoClick = () => {
    posthog?.capture("schedule_demo_clicked", {
      location: "hero_secondary_cta",
    });
  };

  const handleLinkClick = (href: string) => {
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative isolate flex min-h-screen w-full flex-col overflow-hidden bg-teal-950"
    >
      {/* Background: Hero image - base layer */}
      <Image
        alt=""
        src="/images/hero/bg.png"
        fill
        priority
        onLoad={() => setIsImageLoaded(true)}
        className={cn(
          "-z-20 object-cover object-center transition-opacity duration-700",
          isImageLoaded ? "opacity-70" : "opacity-0",
        )}
      />

      {/* Primary gradient overlay - stronger on left for text area */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-teal-950/95 via-teal-900/80 to-teal-950/50" />

      {/* Vertical gradient for depth and vignette effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-teal-950/40 via-transparent to-teal-950/70" />

      {/* Radial gradient for center focus - spotlight effect */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,transparent_20%,rgba(4,47,46,0.6)_100%)]" />

      {/* Noise texture overlay for premium feel */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Dot pattern - teal tinted */}
      <DotPattern
        width={32}
        height={32}
        cx={1}
        cy={1}
        cr={0.8}
        className={cn(
          "mask-[linear-gradient(to_bottom,black,transparent_60%)]",
          "-z-10 fill-teal-400/8",
        )}
      />

      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 w-full px-4 pt-6 sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="lg" className="h-8 w-8 drop-shadow-lg" />
            <span className="font-display text-xl font-semibold tracking-tight text-white drop-shadow-md">
              OdisAI
            </span>
          </div>

          {/* Desktop - Book Demo button */}
          <Link
            href="/demo"
            className={cn(
              "hidden items-center justify-center sm:inline-flex",
              "rounded-full px-5 py-2.5 text-sm font-medium",
              "bg-white/95 text-teal-900 backdrop-blur-sm",
              "shadow-lg shadow-teal-950/20",
              "transition-all duration-300",
              "hover:scale-[1.02] hover:bg-white hover:shadow-xl hover:shadow-teal-950/25",
            )}
          >
            Book Demo
          </Link>

          {/* Mobile - Hamburger button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 sm:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-teal-950/80 backdrop-blur-sm sm:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu content */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-20 right-4 left-4 z-40 rounded-2xl border border-white/10 bg-teal-900/95 backdrop-blur-xl sm:hidden"
            >
              <div className="space-y-1 px-6 py-4">
                {NAVIGATION_LINKS.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleLinkClick(link.link)}
                    className="block w-full rounded-lg px-4 py-3 text-left text-base font-medium text-white transition-colors hover:bg-white/10"
                  >
                    {link.name}
                  </button>
                ))}

                <Link
                  href="/demo"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "mt-4 flex items-center justify-center gap-2",
                    "w-full rounded-full px-6 py-3",
                    "bg-white text-teal-900",
                    "text-base font-semibold",
                    "transition-all hover:bg-white/90",
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  Book Demo
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-20 lg:px-8 lg:pt-24">
        {/* Subtle ambient glow behind content */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[100px]"
          aria-hidden="true"
        />

        {/* Centered Content */}
        <motion.div
          className="-mt-8 flex w-full max-w-5xl flex-col items-center text-center sm:-mt-16"
          variants={containerVariants}
          initial="hidden"
          animate={shouldAnimate ? "visible" : "hidden"}
        >
          {/* Trust Badge */}
          <motion.div variants={itemVariants} className="mb-4 sm:mb-6">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 sm:gap-2 sm:px-4",
                "bg-teal-500/10 ring-1 ring-teal-400/20 backdrop-blur-sm",
                "text-xs font-medium text-teal-200 sm:text-sm",
              )}
            >
              <Sparkles className="h-3 w-3 text-teal-300 sm:h-3.5 sm:w-3.5" />
              <span className="xs:inline hidden">
                Built for Veterinary Practices
              </span>
              <span className="xs:hidden">For Veterinary Practices</span>
              <span className="h-1 w-1 rounded-full bg-teal-400/60" />
              <span className="text-teal-300">AI-Powered</span>
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-display text-4xl leading-[1.1] font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)] sm:text-6xl sm:leading-[1.08] lg:text-7xl"
          >
            Your AI Assistant <br className="hidden sm:block" />
            <WordRotate
              words={ROTATING_WORDS}
              duration={4000}
              className="text-teal-300 drop-shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
              motionProps={{
                initial: { opacity: 0, y: 12 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -12 },
                transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
              }}
            />
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="mt-4 max-w-3xl text-base leading-relaxed text-teal-50/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.15)] sm:mt-6 sm:text-xl sm:leading-8"
          >
            Enterprise Veterinary AI voice assistance that picks up every call,
            follows-up with every client, and{" "}
            <AnimatedGradientText
              speed={2}
              colorFrom="#5eead4"
              colorVia="#99f6e4"
              colorTo="#a7f3d0"
              className="font-semibold"
            >
              free your team to focus on in-clinic care.
            </AnimatedGradientText>
          </motion.p>

          {/* CTA Buttons - Centered */}
          <motion.div
            variants={itemVariants}
            className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-5"
          >
            {/* Primary CTA - Schedule Demo with shimmer */}
            <Link
              href="/demo"
              onClick={handleScheduleDemoClick}
              className={cn(
                "group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3.5 sm:w-auto sm:gap-2.5 sm:px-8 sm:py-4",
                "bg-white text-teal-900",
                "text-sm font-semibold sm:text-base",
                "shadow-xl shadow-teal-950/30",
                "transition-all duration-300",
                "hover:scale-[1.03] hover:shadow-2xl hover:shadow-teal-400/25",
                "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-900 focus-visible:outline-none",
              )}
            >
              {/* Animated shimmer effect */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-teal-400/20 to-transparent" />
              {/* Glow effect on hover */}
              <span className="pointer-events-none absolute inset-0 rounded-full bg-white opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-30" />
              <Calendar className="relative h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              <span className="relative">Schedule Demo</span>
            </Link>

            {/* Secondary CTA - Hear Odis */}
            <a
              href="#sample-calls"
              className={cn(
                "group relative inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 sm:w-auto sm:gap-2.5 sm:px-8 sm:py-4",
                "bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm",
                "text-sm font-semibold sm:text-base",
                "transition-all duration-300",
                "hover:bg-white/15 hover:shadow-lg hover:shadow-teal-400/10 hover:ring-white/30",
                "focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-900 focus-visible:outline-none",
              )}
            >
              <Play className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110 sm:h-5 sm:w-5" />
              <span>Hear Odis</span>
            </a>
          </motion.div>

          {/* Trust Line */}
          <motion.div
            variants={itemVariants}
            className="mt-4 flex flex-col items-center gap-2 text-xs text-teal-100/70 sm:mt-5 sm:flex-row sm:gap-4 sm:text-sm"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 sm:h-4 sm:w-4" />
              No credit card required
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-teal-400/40 sm:block" />
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-teal-400 sm:h-4 sm:w-4" />
              HIPAA Compliant
            </span>
          </motion.div>

          {/* Social Proof Stats */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:mt-10 sm:gap-12"
          >
            {STATS.map((stat, index) => (
              <div key={stat.label} className="flex flex-col items-center">
                <div className="flex items-baseline gap-0.5">
                  <NumberTicker
                    value={stat.value}
                    delay={0.3 + index * 0.15}
                    className="font-display text-2xl font-bold text-white sm:text-4xl"
                  />
                  <span className="font-display text-xl font-bold text-teal-300 sm:text-3xl">
                    {stat.suffix}
                  </span>
                </div>
                <span className="mt-0.5 text-xs font-medium text-teal-100/60 sm:mt-1 sm:text-sm">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <a
          href="#problem"
          className="group flex flex-col items-center gap-2 text-teal-100/50 transition-colors hover:text-teal-100/80"
        >
          <span className="text-xs font-medium tracking-widest uppercase">
            Learn More
          </span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </a>
      </motion.div>

      {/* Bottom gradient fade for smooth transition */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-teal-950 to-transparent" />
    </section>
  );
}
