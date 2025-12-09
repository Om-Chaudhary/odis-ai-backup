"use client";

import { useState, useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { EnhancedButton } from "@odis/ui/enhanced-button";
import { Logo } from "@odis/ui/Logo";
import WaitlistModal from "./WaitlistModal";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";
import Link from "next/link";
import { createClient } from "@odis/db/client";
import { Avatar, AvatarFallback, AvatarImage } from "@odis/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@odis/ui/dropdown-menu";
import { signOut } from "~/server/actions/auth";
import { LayoutDashboard, LogOut, Settings, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export default function Navigation() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check auth state on mount
  useEffect(() => {
    const supabase = createClient();

    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Fetch user profile
          const { data: profileData } = await supabase
            .from("users")
            .select("first_name, last_name, avatar_url, email")
            .eq("id", user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
        }
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: profileData } = await supabase
          .from("users")
          .select("first_name, last_name, avatar_url, email")
          .eq("id", session.user.id)
          .single();
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleButtonClick = () => {
    posthog.capture("waitlist_cta_clicked", {
      location: "navigation",
      button_text: "Join Waitlist",
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
    });
    setIsModalOpen(true);
  };

  const handleButtonHover = () => {
    // Debounce hover events
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      posthog.capture("cta_button_hover", {
        location: "navigation",
        button_text: "Join Waitlist",
        device_type: deviceInfo.device_type,
      });
    }, 200);
  };

  const handleButtonLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleSignOut = async () => {
    posthog.capture("user_signed_out", {
      location: "navigation",
    });
    await signOut();
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (profile?.first_name || profile?.last_name) {
      const first = profile.first_name?.charAt(0) ?? "";
      const last = profile.last_name?.charAt(0) ?? "";
      return `${first}${last}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Get display name for dropdown
  const getDisplayName = () => {
    if (profile?.first_name) {
      return profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile.first_name;
    }
    return user?.email ?? "User";
  };

  return (
    <>
      <nav
        className={`fixed top-0 right-0 left-0 z-[9999] transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 shadow-md backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-20 items-center justify-between">
            <div className="relative z-10 flex items-center gap-2">
              <Logo size="lg" className="h-8 w-8" />
              <span
                className={`font-display relative z-10 text-xl font-bold transition-colors duration-300 ${
                  isScrolled
                    ? "text-[#1a202c]"
                    : "text-[#1a202c] drop-shadow-sm"
                }`}
              >
                OdisAI
              </span>
            </div>
            <div className="relative z-10 hidden items-center space-x-8 md:flex">
              <Link
                href="/"
                className={`relative z-10 text-sm font-medium transition-colors duration-300 hover:text-teal-600 ${
                  isScrolled ? "text-gray-700" : "text-gray-800"
                }`}
              >
                Home
              </Link>
              <Link
                href="/blog"
                className={`relative z-10 text-sm font-medium transition-colors duration-300 hover:text-teal-600 ${
                  isScrolled ? "text-gray-700" : "text-gray-800"
                }`}
              >
                Blog
              </Link>
              <Link
                href="/support"
                className={`relative z-10 text-sm font-medium transition-colors duration-300 hover:text-teal-600 ${
                  isScrolled ? "text-gray-700" : "text-gray-800"
                }`}
              >
                Support
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {isLoadingAuth ? (
                // Loading skeleton
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
              ) : user ? (
                // Authenticated user UI
                <>
                  <Link
                    href="/dashboard"
                    className={`relative z-10 hidden text-sm font-medium transition-colors duration-300 hover:text-teal-600 sm:inline ${
                      isScrolled ? "text-gray-700" : "text-gray-800"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="relative z-10 flex items-center gap-2 rounded-full ring-offset-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
                        <Avatar className="h-9 w-9 cursor-pointer border-2 border-white shadow-sm ring-2 ring-teal-500/20 transition-all hover:ring-teal-500/40">
                          {profile?.avatar_url && (
                            <AvatarImage
                              src={profile.avatar_url}
                              alt={getDisplayName()}
                            />
                          )}
                          <AvatarFallback className="bg-gradient-to-br from-[#31aba3] to-[#10b981] text-xs font-semibold text-white">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm leading-none font-medium">
                            {getDisplayName()}
                          </p>
                          <p className="text-xs leading-none text-gray-500">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard"
                          className="flex cursor-pointer items-center"
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/settings"
                          className="flex cursor-pointer items-center"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/profile"
                          className="flex cursor-pointer items-center"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                // Unauthenticated user UI
                <>
                  <Link
                    href="/signup"
                    className={`relative z-10 text-sm font-medium transition-colors duration-300 hover:text-teal-600 ${
                      isScrolled ? "text-gray-700" : "text-gray-800"
                    }`}
                  >
                    Sign Up
                  </Link>
                  <EnhancedButton
                    onClick={handleButtonClick}
                    onMouseEnter={handleButtonHover}
                    onMouseLeave={handleButtonLeave}
                    variant="shimmer"
                    size="sm"
                    className="px-4 sm:px-6 md:px-8"
                  >
                    <span className="hidden sm:inline">Join Waitlist</span>
                    <span className="sm:hidden">Join</span>
                  </EnhancedButton>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        triggerLocation="navigation"
      />
    </>
  );
}
