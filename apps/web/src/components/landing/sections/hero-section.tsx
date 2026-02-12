"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";
import { usePostHog } from "posthog-js/react";
import { Calendar, Play, ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { usePageLoaded } from "~/hooks/use-page-loaded";
import { Logo } from "@odis-ai/shared/ui/Logo";
import { AnimatedGradientText } from "../ui/animated-gradient-text";
import { NumberTicker } from "../ui/number-ticker";
import { HeroCallCard } from "../ui/hero-call-card";

// Social proof stats
const STATS = [
  { value: 10000, suffix: "+", label: "Calls Handled" },
  { value: 98, suffix: "%", label: "Client Satisfaction" },
  { value: 15, suffix: "+", label: "Hours Saved Weekly" },
];

// Navigation links
const NAV_LINKS = [
  { name: "Features", href: "#features" },
  { name: "Solutions", href: "#how-it-works" },
  { name: "Contact", href: "#pricing" },
  { name: "About", href: "/about" },
];

// Stagger container
const staggerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

// Cubic-bezier easing (expo-out) — tuple so Framer Motion accepts it
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Fade-in-up with blur
const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.8, ease: EASE_OUT_EXPO },
  },
};

export function HeroSection() {
  const posthog = usePostHog();
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const isPageLoaded = usePageLoaded(150);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Only enable parallax on desktop (>= 1024px) to reduce mobile main thread work
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Parallax scroll (desktop only)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const rawImageY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const rawCardY = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const imageY = isDesktop && !shouldReduceMotion ? rawImageY : 0;
  const cardY = isDesktop && !shouldReduceMotion ? rawCardY : 0;

  // Fallback timeout for image load
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsImageLoaded(true);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  const shouldAnimate = isPageLoaded && isInView && isImageLoaded;

  const handleScheduleDemoClick = () => {
    posthog?.capture("schedule_demo_clicked", {
      location: "hero_secondary_cta",
    });
  };

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      className="mx-0 p-0 sm:mx-8 sm:p-3 lg:mx-12 lg:p-4"
    >
      <div
        ref={containerRef}
        className="hero-container relative overflow-hidden rounded-none sm:rounded-3xl"
      >
        {/* === BACKGROUND LAYERS === */}

        {/* Static gradient base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, hsl(185,30%,5%) 0%, hsl(180,25%,8%) 30%, hsl(178,20%,10%) 60%, hsl(175,18%,7%) 100%)",
          }}
        />

        {/* Parallax hero image with blur treatment */}
        <motion.div
          className="absolute inset-0 transform-gpu"
          style={{ y: imageY }}
        >
          <Image
            alt=""
            src="/images/hero/bg.webp"
            fill
            priority
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoQAAsAAkA4JZQCdAEO/hEMAD+8sv/WDNOH/rnm/+Ue0//LKrUwHakHP/xGf/5ZNsq66XnfcP/rYf/+t/2v/bhmAAAA=="
            fetchPriority="high"
            onLoad={() => setIsImageLoaded(true)}
            className={cn(
              "scale-110 object-cover object-center blur-[2px] transition-opacity duration-700",
              isImageLoaded ? "opacity-45" : "opacity-0",
            )}
          />
          <div className="absolute inset-0 bg-[hsl(185,25%,7%)]/40 mix-blend-overlay" />
        </motion.div>

        {/* Left gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(185,25%,7%)] via-[hsl(185,25%,7%)]/70 to-transparent" />

        {/* Bottom gradient for stats */}
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[hsl(185,25%,7%)]/80 to-transparent" />

        {/* Radial glow accent */}
        <div
          className="pointer-events-none absolute -top-32 right-1/4 h-[700px] w-[900px] opacity-10"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse at center, hsla(174,60%,45%,0.25) 0%, transparent 65%)",
          }}
        />

        {/* === CONTENT LAYER === */}
        <div className="relative z-10 flex min-h-[100dvh] flex-col p-0 sm:min-h-[94dvh] md:p-4">
          {/* ---- Navbar ---- */}
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={
              shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }
            }
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            className="flex items-center justify-between px-6 py-5 sm:px-10 sm:py-6 lg:px-16 xl:px-20"
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <Logo size="lg" className="h-8 w-8 drop-shadow-lg" />
              <span className="font-display text-lg font-bold tracking-tight text-white">
                OdisAI
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden items-center gap-8 lg:flex">
              {NAV_LINKS.map((item) =>
                item.href.startsWith("#") ? (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.href)}
                    className="text-[13px] font-medium text-white/50 transition-colors duration-300 hover:text-white"
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-[13px] font-medium text-white/50 transition-colors duration-300 hover:text-white"
                  >
                    {item.name}
                  </Link>
                ),
              )}
            </div>

            {/* Desktop actions */}
            <div className="hidden items-center gap-4 lg:flex">
              <Link
                href="/login"
                className="text-[13px] font-medium text-white/50 transition-colors duration-300 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/demo"
                className="rounded-lg bg-white px-5 py-2.5 text-[13px] font-semibold text-[hsl(185,25%,7%)] transition-all duration-300 hover:bg-white/90 hover:shadow-lg hover:shadow-white/5"
              >
                Book Demo
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              type="button"
              className="relative z-20 cursor-pointer p-2 text-white lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </motion.nav>

          {/* Mobile menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                className="overflow-hidden lg:hidden"
              >
                <div className="glass-dark mx-6 mb-4 rounded-2xl p-5">
                  <div className="flex flex-col gap-1">
                    {NAV_LINKS.map((item) =>
                      item.href.startsWith("#") ? (
                        <button
                          key={item.name}
                          onClick={() => handleNavClick(item.href)}
                          className="rounded-lg px-4 py-3 text-left text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          {item.name}
                        </button>
                      ) : (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="rounded-lg px-4 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          {item.name}
                        </Link>
                      ),
                    )}
                    <hr className="my-2 border-white/[0.08]" />
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-lg px-4 py-3 text-sm text-white/60 transition-colors hover:text-white"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/demo"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="mt-2 rounded-lg bg-white px-5 py-3 text-center text-sm font-semibold text-[hsl(185,25%,7%)]"
                    >
                      Book Demo
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---- Hero content (left-aligned) ---- */}
          <motion.div
            variants={staggerVariants}
            initial="hidden"
            animate={shouldAnimate ? "visible" : "hidden"}
            className="flex flex-1 flex-col justify-center px-6 sm:px-10 lg:px-16 xl:px-20"
          >
            <div className="max-w-2xl py-16 sm:py-20 lg:py-0">
              {/* Trust badge */}
              <motion.div variants={fadeInUpVariants} className="mb-6">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-1.5",
                    "bg-teal-500/10 ring-1 ring-teal-400/20 backdrop-blur-sm",
                    "text-xs font-medium text-teal-200 sm:text-sm",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                  Your Clinic's AI Phone Team
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeInUpVariants}
                className="font-display text-[32px] leading-[1.08] font-bold tracking-[-0.02em] text-balance text-white sm:text-5xl lg:text-6xl xl:text-[68px]"
              >
                Every call answered.
                <br />
                <span className="text-gradient">Every client cared for.</span>
              </motion.h1>

              {/* Description */}
              <motion.p
                variants={fadeInUpVariants}
                className="mt-5 max-w-[26rem] text-[15px] leading-[1.7] text-pretty text-white/50 sm:mt-6 sm:max-w-lg sm:text-[17px] sm:leading-[1.7]"
              >
                Odis AI handles your clinic's inbound and outbound calls, from
                scheduling appointments to post-visit follow-ups.{" "}
                <AnimatedGradientText
                  speed={2}
                  colorFrom="#2dd4bf"
                  colorVia="#5eead4"
                  colorTo="#2dd4bf"
                  className="font-semibold"
                >
                  Your team focuses on care. We handle the phones.
                </AnimatedGradientText>
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeInUpVariants}
                className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center sm:gap-4"
              >
                <Link
                  href="/demo"
                  onClick={handleScheduleDemoClick}
                  className="btn-shine group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[hsl(185,25%,7%)] shadow-lg shadow-white/10 transition-all duration-300 hover:scale-[1.02] hover:bg-white/95 hover:shadow-xl hover:shadow-white/15 active:scale-[0.98] sm:w-auto"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule Demo
                </Link>
                <a
                  href="#sample-calls"
                  className="group inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.98] sm:w-auto"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(174,70%,45%)]/15">
                    <Play className="h-2.5 w-2.5 fill-[hsl(174,70%,45%)] text-[hsl(174,70%,45%)]" />
                  </span>
                  Hear Real Calls
                </a>
              </motion.div>
            </div>
          </motion.div>

          {/* ---- Stats bar ---- */}
          <motion.div
            variants={fadeInVariants}
            initial="hidden"
            animate={shouldAnimate ? "visible" : "hidden"}
            className="mt-auto px-6 py-5 sm:px-10 sm:py-6 lg:px-16 xl:px-20"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-medium tracking-[0.18em] text-white/30 uppercase">
                Trusted by clinics everywhere
              </p>
              <div className="flex items-center gap-8 sm:gap-10 lg:gap-14">
                {STATS.map((stat, index) => (
                  <div key={stat.label} className="flex items-baseline gap-1.5">
                    <span className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                      <NumberTicker
                        value={stat.value}
                        delay={0.3 + index * 0.15}
                        className="font-display text-xl font-bold text-white sm:text-2xl"
                      />
                      <span className="text-[hsl(174,70%,45%)]">
                        {stat.suffix}
                      </span>
                    </span>
                    <span className="hidden text-xs text-white/35 sm:inline">
                      {stat.label}
                    </span>
                    {/* Divider between stats (not after last) */}
                    {index < STATS.length - 1 && (
                      <div className="ml-6 hidden h-6 w-px bg-white/[0.08] sm:ml-8 sm:block lg:ml-12" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* === FLOATING ELEMENTS === */}

        {/* Live call transcript card (desktop only, parallax) */}
        <motion.div
          style={{ y: cardY }}
          className="absolute right-6 bottom-28 z-20 hidden lg:right-12 lg:block xl:right-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={
              shouldAnimate
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 24, scale: 0.95 }
            }
            transition={{
              duration: 0.8,
              delay: 1,
              ease: EASE_OUT_EXPO,
            }}
          >
            <HeroCallCard shouldAnimate={shouldAnimate} />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="absolute inset-x-0 bottom-20 z-20 hidden items-center justify-center sm:flex lg:bottom-24"
        >
          <a
            href="#problem"
            className="group flex flex-col items-center gap-2 text-white/20 transition-colors hover:text-white/40"
            aria-label="Scroll to learn more"
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut",
              }}
            >
              <ChevronDown className="h-5 w-5" />
            </motion.div>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
