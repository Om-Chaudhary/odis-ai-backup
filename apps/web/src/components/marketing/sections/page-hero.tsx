"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SectionBackground } from "~/components/landing/ui/section-background";
import type { SectionBackgroundProps } from "~/components/landing/ui/section-background";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface PageHeroProps {
  /**
   * Badge text displayed above the title
   */
  badge?: string;
  /**
   * Main page title (h1)
   */
  title: string;
  /**
   * Subtitle/description text
   */
  subtitle?: string;
  /**
   * Breadcrumb navigation items
   */
  breadcrumbs?: BreadcrumbItem[];
  /**
   * Background variant for the hero section
   * @default "hero-glow"
   */
  backgroundVariant?: SectionBackgroundProps["variant"];
  /**
   * Optional children (CTA buttons, etc.)
   */
  children?: ReactNode;
  /**
   * Additional className for the section
   */
  className?: string;
  /**
   * Section ID for anchor links
   */
  id?: string;
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

/**
 * PageHero
 *
 * A reusable hero section for secondary marketing pages.
 * Includes badge, title, subtitle, breadcrumbs, and optional CTA children.
 *
 * @example
 * ```tsx
 * <PageHero
 *   badge="Integrations"
 *   title="Connect Your Practice Management System"
 *   subtitle="Seamlessly integrate OdisAI with your existing tools."
 *   breadcrumbs={[
 *     { label: "Home", href: "/" },
 *     { label: "Integrations", href: "/integrations" },
 *   ]}
 * >
 *   <Button>Get Started</Button>
 * </PageHero>
 * ```
 */
/** Variants that use a dark background and need light text */
const DARK_VARIANTS = new Set(["hero-dark"]);

export function PageHero({
  badge,
  title,
  subtitle,
  breadcrumbs,
  backgroundVariant = "hero-glow",
  children,
  className,
  id,
}: PageHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();
  const isDark = DARK_VARIANTS.has(backgroundVariant);

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={ref}
      id={id}
      className={`relative w-full overflow-hidden pt-24 sm:pt-28 md:pt-32 ${
        isDark ? "pb-14 sm:pb-16 md:pb-20" : "pb-8 sm:pb-10 md:pb-12"
      } ${className ?? ""}`}
    >
      <SectionBackground variant={backgroundVariant} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <motion.nav
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeUpVariant}
            transition={{ ...transition, delay: 0 }}
            aria-label="Breadcrumb"
            className="mb-6"
          >
            <ol className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronRight
                      className={
                        isDark
                          ? "h-4 w-4 text-slate-400"
                          : "text-muted-foreground h-4 w-4"
                      }
                    />
                  )}
                  {index === breadcrumbs.length - 1 ? (
                    <span
                      className={isDark ? "text-slate-300" : "text-slate-600"}
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className={
                        isDark
                          ? "text-slate-400 transition-colors hover:text-white"
                          : "text-muted-foreground transition-colors hover:text-slate-700"
                      }
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </motion.nav>
        )}

        {/* Badge */}
        {badge && (
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeUpVariant}
            transition={{ ...transition, delay: 0.1 }}
            className="mb-6 flex justify-center"
          >
            <span
              className={
                isDark
                  ? "inline-flex items-center gap-2 rounded-full bg-teal-400/15 px-4 py-2 text-sm font-medium text-teal-300"
                  : "inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-700"
              }
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
              {badge}
            </span>
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUpVariant}
          transition={{ ...transition, delay: 0.2 }}
          className={`font-display mx-auto max-w-4xl text-center text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          {title}
        </motion.h1>

        {/* Subtitle */}
        {subtitle && (
          <motion.p
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeUpVariant}
            transition={{ ...transition, delay: 0.3 }}
            className={`mx-auto mt-6 max-w-2xl text-center text-lg sm:text-xl ${
              isDark ? "text-slate-300" : "text-muted-foreground"
            }`}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Children (CTAs, etc.) */}
        {children && (
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeUpVariant}
            transition={{ ...transition, delay: 0.4 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default PageHero;
