"use client";

import type { ReactNode } from "react";
import { MarketingNavbar, type MarketingNavbarProps } from "./marketing-navbar";
import { MarketingFooter, type MarketingFooterProps } from "./marketing-footer";
import { ScrollProgress } from "~/components/landing/shared/scroll-progress";
import { LandingAnalytics } from "~/components/landing/shared/landing-analytics";

export interface MarketingLayoutProps {
  children: ReactNode;
  /**
   * Configuration for the navbar
   */
  navbar?: MarketingNavbarProps;
  /**
   * Configuration for the footer
   */
  footer?: MarketingFooterProps;
  /**
   * Whether to show the scroll progress indicator
   * @default false
   */
  showScrollProgress?: boolean;
  /**
   * Whether to enable analytics tracking
   * @default true
   */
  enableAnalytics?: boolean;
  /**
   * Additional className for the main content wrapper
   */
  className?: string;
}

/**
 * MarketingLayout
 *
 * A reusable layout wrapper for all marketing/public pages.
 * Provides consistent navbar, footer, and optional scroll progress indicator.
 *
 * @example
 * ```tsx
 * <MarketingLayout
 *   navbar={{ variant: "transparent" }}
 *   showScrollProgress
 * >
 *   <PageHero title="Integrations" />
 *   <IntegrationContent />
 * </MarketingLayout>
 * ```
 */
export function MarketingLayout({
  children,
  navbar,
  footer,
  showScrollProgress = false,
  enableAnalytics = true,
  className,
}: MarketingLayoutProps) {
  return (
    <>
      {enableAnalytics && <LandingAnalytics />}
      {showScrollProgress && <ScrollProgress />}
      <MarketingNavbar {...navbar} />
      <main className={className}>{children}</main>
      <MarketingFooter {...footer} />
    </>
  );
}

export default MarketingLayout;
