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

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={ref}
      id={id}
      className={`relative w-full overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20 md:pb-24 lg:pb-32 ${className ?? ""}`}
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
                    <ChevronRight className="text-muted-foreground h-4 w-4" />
                  )}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-slate-600">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-muted-foreground transition-colors hover:text-slate-700"
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
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-700">
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
          className="font-display mx-auto max-w-4xl text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl"
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
            className="text-muted-foreground mx-auto mt-6 max-w-2xl text-center text-lg sm:text-xl"
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
