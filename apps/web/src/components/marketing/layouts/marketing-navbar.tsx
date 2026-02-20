"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@odis-ai/shared/ui/navigation-menu";
import { Button } from "@odis-ai/shared/ui/button";
import { cn } from "@odis-ai/shared/util";
import { Logo } from "@odis-ai/shared/ui/Logo";
import { trackBookDemoClick } from "~/components/landing/shared/landing-analytics";
import { createClient } from "@odis-ai/data-access/db/client";
import type { User } from "@supabase/supabase-js";

/**
 * Navigation link configuration
 */
export interface NavLink {
  name: string;
  href: string;
  /** If true, link scrolls to anchor on same page */
  isAnchor?: boolean;
  /** Optional description for dropdown menus */
  description?: string;
}

/**
 * Navigation dropdown configuration
 */
export interface NavDropdown {
  name: string;
  items: NavLink[];
}

export type NavItem = NavLink | NavDropdown;

function isDropdown(item: NavItem): item is NavDropdown {
  return "items" in item;
}

/**
 * Navbar visual variant
 */
export type NavbarVariant = "default" | "transparent" | "solid";

export interface MarketingNavbarProps {
  /**
   * Navigation items to display
   */
  navigation?: NavItem[];
  /**
   * Visual variant of the navbar
   * @default "default"
   */
  variant?: NavbarVariant;
  /**
   * Scroll threshold before navbar becomes visible (for default variant)
   * @default 100
   */
  scrollThreshold?: number;
  /**
   * Whether to show the CTA button
   * @default true
   */
  showCTA?: boolean;
  /**
   * Custom CTA text
   * @default "Book Demo"
   */
  ctaText?: string;
  /**
   * Custom CTA href
   * @default "/demo"
   */
  ctaHref?: string;
}

const defaultNavigation: NavItem[] = [
  { name: "Features", href: "#features", isAnchor: true },
  { name: "How It Works", href: "#how-it-works", isAnchor: true },
  { name: "Testimonials", href: "#testimonials", isAnchor: true },
  { name: "Blog", href: "/blog" },
];

/**
 * MarketingNavbar
 *
 * A flexible, reusable navbar component for marketing pages.
 * Supports different variants, configurable navigation, and auth state awareness.
 *
 * Variants:
 * - default: Appears on scroll (for landing page)
 * - transparent: Always visible with transparent background
 * - solid: Always visible with solid background
 */
export function MarketingNavbar({
  navigation = defaultNavigation,
  variant = "default",
  scrollThreshold = 100,
  showCTA = true,
  ctaText = "Book Demo",
  ctaHref = "/demo",
}: MarketingNavbarProps) {
  // usePostHog may return null during SSG/SSR when provider isn't mounted
  const posthog = usePostHog();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const scrollYRef = useRef(0);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleBookDemoClick = (location: string) => {
    trackBookDemoClick(posthog, location);
  };

  // Check auth state on mount
  useEffect(() => {
    const supabase = createClient();

    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    void checkUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
      // For transparent variant, use viewport height as threshold
      // For other variants, use the configured scrollThreshold
      const threshold =
        variant === "transparent" ? window.innerHeight : scrollThreshold;
      setIsScrolled(scrollYRef.current > threshold);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollThreshold, variant]);

  const handleLinkClick = (href: string, isAnchor?: boolean) => {
    setIsMobileMenuOpen(false);

    if (isAnchor) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Determine visibility based on variant
  const isVisible = variant === "default" ? isScrolled : true;

  // Determine background style based on variant and scroll state
  const getNavbarStyles = () => {
    if (variant === "solid") {
      return "bg-background/95 border-border/50 backdrop-blur-xl backdrop-saturate-150";
    }
    if (variant === "transparent") {
      return isScrolled
        ? "bg-background/60 border-white/10 backdrop-blur-xl backdrop-saturate-150"
        : "bg-transparent border-transparent";
    }
    // default variant - only shows when scrolled
    return "bg-background/60 border-white/10 backdrop-blur-xl backdrop-saturate-150";
  };

  return (
    <nav
      className={cn(
        "fixed top-0 right-0 left-0 z-40 border-b py-4 transition-all duration-300 ease-out",
        getNavbarStyles(),
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="font-display hover:text-primary flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-800 transition-colors"
          >
            <Logo size="lg" className="h-8 w-8" />
            OdisAI
          </Link>

          {/* Desktop Navigation using shadcn NavigationMenu */}
          <div className="hidden items-center gap-2 md:flex">
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                {navigation.map((item) => {
                  if (isDropdown(item)) {
                    return (
                      <NavigationMenuItem key={item.name}>
                        <NavigationMenuTrigger
                          className={cn(
                            navigationMenuTriggerStyle(),
                            "text-muted-foreground cursor-pointer bg-transparent transition-all hover:bg-white/10 hover:text-slate-800 focus:bg-white/10",
                          )}
                        >
                          {item.name}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                            {item.items.map((subItem) => (
                              <li key={subItem.name}>
                                <NavigationMenuLink asChild>
                                  <Link
                                    href={subItem.href}
                                    className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                                  >
                                    <div className="text-sm leading-none font-medium">
                                      {subItem.name}
                                    </div>
                                    {subItem.description && (
                                      <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                                        {subItem.description}
                                      </p>
                                    )}
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    );
                  }

                  const isActive = !item.isAnchor && pathname === item.href;

                  return (
                    <NavigationMenuItem key={item.name}>
                      {item.isAnchor ? (
                        <NavigationMenuLink
                          className={cn(
                            navigationMenuTriggerStyle(),
                            "text-muted-foreground cursor-pointer bg-transparent transition-all hover:bg-white/10 hover:text-slate-800 focus:bg-white/10",
                          )}
                          onClick={() => handleLinkClick(item.href, true)}
                        >
                          {item.name}
                        </NavigationMenuLink>
                      ) : (
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              navigationMenuTriggerStyle(),
                              "text-muted-foreground bg-transparent transition-all hover:bg-white/10 hover:text-slate-800 focus:bg-white/10",
                              isActive && "font-medium text-slate-800",
                            )}
                          >
                            {item.name}
                          </Link>
                        </NavigationMenuLink>
                      )}
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>

            {isLoadingAuth ? (
              // Loading skeleton
              <div className="ml-4 h-10 w-24 animate-pulse rounded-full bg-white/20" />
            ) : user ? (
              // Authenticated: Show Dashboard button
              <Button
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/25 ml-4 rounded-full px-6 py-2.5 text-sm font-semibold transition-all hover:shadow-lg"
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              // Unauthenticated: Show Sign In button and CTA
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-muted-foreground ml-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all hover:bg-white/10 hover:text-slate-800"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                {showCTA && (
                  <Link
                    href={ctaHref}
                    onClick={() => handleBookDemoClick("navbar-desktop")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/25 ml-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all hover:shadow-lg"
                  >
                    {ctaText}
                  </Link>
                )}
              </>
            )}
          </div>

          <button
            onClick={toggleMobileMenu}
            className="rounded-lg p-2 text-slate-800 transition-colors hover:bg-white/10 md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu with backdrop and animations */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu content */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-background/95 border-t border-white/10 backdrop-blur-xl md:hidden"
            >
              <div className="space-y-1 px-6 py-4">
                {navigation.map((item) => {
                  if (isDropdown(item)) {
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between px-4 py-3 text-base font-medium text-slate-800">
                          {item.name}
                          <ChevronDown className="h-4 w-4" />
                        </div>
                        <div className="ml-4 space-y-1 border-l border-slate-200 pl-4">
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block rounded-lg px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-white/10 hover:text-slate-800"
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return item.isAnchor ? (
                    <button
                      key={item.name}
                      onClick={() => handleLinkClick(item.href, true)}
                      className="block w-full rounded-lg px-4 py-3 text-left text-base font-medium text-slate-800 transition-colors hover:bg-white/10"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full rounded-lg px-4 py-3 text-left text-base font-medium text-slate-800 transition-colors hover:bg-white/10"
                    >
                      {item.name}
                    </Link>
                  );
                })}

                {isLoadingAuth ? (
                  // Loading skeleton
                  <div className="mt-4 h-11 w-full animate-pulse rounded-full bg-white/20" />
                ) : user ? (
                  // Authenticated: Show Dashboard button
                  <Link
                    href="/dashboard"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 block w-full rounded-full px-6 py-3 text-center text-base font-semibold transition-all"
                  >
                    Dashboard
                  </Link>
                ) : (
                  // Unauthenticated: Show Sign In and Book Demo
                  <>
                    <Link
                      href="/login"
                      className="mt-4 block w-full rounded-full border border-white/20 px-6 py-3 text-center text-base font-medium text-slate-800 transition-all hover:bg-white/10"
                    >
                      Sign In
                    </Link>
                    {showCTA && (
                      <Link
                        href={ctaHref}
                        onClick={() => handleBookDemoClick("navbar-mobile")}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 block w-full rounded-full px-6 py-3 text-center text-base font-semibold transition-all"
                      >
                        {ctaText}
                      </Link>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default MarketingNavbar;
