"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu";
import { cn } from "~/lib/utils";
import { Logo } from "@odis-ai/ui/Logo";

const navigationLinks = [
  { name: "Features", link: "#features" },
  { name: "How It Works", link: "#how-it-works" },
  { name: "Testimonials", link: "#testimonials" },
  { name: "Sample Call", link: "#sample-call" },
];

export const PortfolioNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLinkClick = (href: string) => {
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="bg-background/60 fixed top-0 right-0 left-0 z-40 border-b border-white/10 py-4 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleLinkClick("#home")}
            className="font-display text-foreground hover:text-primary flex items-center gap-2 text-xl font-semibold tracking-tight transition-colors"
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
                        "text-muted-foreground hover:text-foreground cursor-pointer bg-transparent transition-all hover:bg-white/10 focus:bg-white/10",
                      )}
                      onClick={() => handleLinkClick(link.link)}
                    >
                      {link.name}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
            <a
              href="mailto:hello@odis.ai?subject=Demo Request"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/25 ml-4 rounded-full px-6 py-2.5 text-sm font-semibold transition-all hover:shadow-lg"
            >
              Book Demo
            </a>
          </div>

          <button
            onClick={toggleMobileMenu}
            className="text-foreground rounded-lg p-2 transition-colors hover:bg-white/10 md:hidden"
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

      {/* Mobile menu with glass effect */}
      {isMobileMenuOpen && (
        <div className="bg-background/80 border-t border-white/10 backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-6 py-4">
            {navigationLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleLinkClick(link.link)}
                className="text-foreground block w-full rounded-lg px-4 py-3 text-left text-base font-medium transition-colors hover:bg-white/10"
              >
                {link.name}
              </button>
            ))}
            <a
              href="mailto:hello@odis.ai?subject=Demo Request"
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 block w-full rounded-full px-6 py-3 text-center text-base font-semibold transition-all"
            >
              Book Demo
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};
