"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@odis-ai/ui/navigation-menu";
import { Button } from "@odis-ai/ui/button";
import { cn } from "~/lib/utils";
import { Logo } from "@odis-ai/ui/Logo";
import { trackBookDemoClick } from "./landing-analytics";
import { createClient } from "@odis-ai/db/client";
import type { User } from "@supabase/supabase-js";

const navigationLinks = [
  { name: "Features", link: "#features" },
  { name: "How It Works", link: "#how-it-works" },
  { name: "Testimonials", link: "#testimonials" },
  { name: "Sample Call", link: "#sample-call" },
];

const SCROLL_THRESHOLD = 100;

export const LandingNavbar = () => {
  const posthog = usePostHog();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
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
      setIsVisible(scrollYRef.current > SCROLL_THRESHOLD);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = (href: string) => {
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 right-0 left-0 z-40 border-b py-4 transition-all duration-300 ease-out",
        isVisible
          ? "bg-background/60 translate-y-0 border-white/10 opacity-100 backdrop-blur-xl backdrop-saturate-150"
          : "pointer-events-none -translate-y-full border-transparent bg-transparent opacity-0",
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleLinkClick("#home")}
            className="font-display hover:text-primary flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-800 transition-colors"
          >
            <Logo size="lg" className="h-8 w-8" />
            OdisAI
          </button>

          {/* Desktop Navigation using shadcn NavigationMenu */}
          <div className="hidden items-center gap-2 md:flex">
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                {navigationLinks.map((link) => (
                  <NavigationMenuItem key={link.name}>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "text-muted-foreground cursor-pointer bg-transparent transition-all hover:bg-white/10 hover:text-slate-800 focus:bg-white/10",
                      )}
                      onClick={() => handleLinkClick(link.link)}
                    >
                      {link.name}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
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
              // Unauthenticated: Show Sign In button
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-muted-foreground ml-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all hover:bg-white/10 hover:text-slate-800"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <a
                  href="mailto:hello@odis.ai?subject=Demo Request"
                  onClick={() => handleBookDemoClick("navbar-desktop")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/25 ml-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all hover:shadow-lg"
                >
                  Book Demo
                </a>
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
                {navigationLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleLinkClick(link.link)}
                    className="block w-full rounded-lg px-4 py-3 text-left text-base font-medium text-slate-800 transition-colors hover:bg-white/10"
                  >
                    {link.name}
                  </button>
                ))}

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
                    <a
                      href="mailto:hello@odis.ai?subject=Demo Request"
                      onClick={() => handleBookDemoClick("navbar-mobile")}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 block w-full rounded-full px-6 py-3 text-center text-base font-semibold transition-all"
                    >
                      Book Demo
                    </a>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
