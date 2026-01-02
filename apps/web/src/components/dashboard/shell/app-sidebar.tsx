"use client";

import * as React from "react";
import {
  Home,
  Settings,
  LogOut,
  PhoneIncoming,
  PhoneOutgoing,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@odis-ai/shared/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@odis-ai/shared/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/shared/ui/tooltip";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "~/server/actions/auth";
import type { User } from "@supabase/supabase-js";
import { cn } from "@odis-ai/shared/util";

/**
 * Build a clinic-scoped URL
 */
function buildUrl(clinicSlug: string | null, path: string): string {
  if (!clinicSlug) {
    return path;
  }
  const pathMap: Record<string, string> = {
    "/dashboard": `/dashboard/${clinicSlug}`,
    "/dashboard/settings": `/dashboard/${clinicSlug}/settings`,
  };
  return pathMap[path] ?? path;
}

interface AppSidebarProps {
  user: User;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    role: string;
    clinic_name: string | null;
    avatar_url: string | null;
  } | null;
  clinicSlug: string | null;
}

export function AppSidebar({ user, profile, clinicSlug }: AppSidebarProps) {
  const pathname = usePathname();
  const firstName = profile?.first_name ?? "User";
  const lastName = profile?.last_name ?? "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`.trim() ?? user.email ?? "User";

  // Build clinic-scoped URLs
  const dashboardUrl = buildUrl(clinicSlug, "/dashboard");
  const settingsUrl = buildUrl(clinicSlug, "/dashboard/settings");

  // Check if on inbound or outbound pages
  const isOnInbound = pathname === "/dashboard/inbound";
  const isOnOutbound =
    pathname === "/dashboard/outbound" ||
    pathname.startsWith("/dashboard/outbound/");
  const isOnDashboard =
    pathname === dashboardUrl || pathname.startsWith(dashboardUrl + "/");
  const isOnSettings = pathname.includes("/settings");

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen">
        {/* Icon Rail - Always visible, very thin */}
        <div className="flex w-16 flex-col border-r border-slate-200/60 bg-white/80 backdrop-blur-sm">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-slate-200/60">
            <Link href={dashboardUrl}>
              <Image
                src="/icon-128.png"
                alt="Odis AI"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg transition-transform hover:scale-105"
              />
            </Link>
          </div>

          {/* Main Navigation Icons */}
          <nav className="flex flex-1 flex-col items-center gap-1 py-4">
            {/* Dashboard */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={dashboardUrl}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                    isOnDashboard &&
                      !isOnInbound &&
                      !isOnOutbound &&
                      !isOnSettings
                      ? "bg-teal-100 text-teal-700"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                  )}
                >
                  <Home className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Dashboard</TooltipContent>
            </Tooltip>

            <div className="my-2 h-px w-8 bg-slate-200" />

            {/* Inbound */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/inbound"
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                    isOnInbound
                      ? "bg-teal-100 text-teal-700"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                  )}
                >
                  <PhoneIncoming className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Inbound</TooltipContent>
            </Tooltip>

            {/* Outbound */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/outbound"
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                    isOnOutbound
                      ? "bg-teal-100 text-teal-700"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                  )}
                >
                  <PhoneOutgoing className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Outbound</TooltipContent>
            </Tooltip>

            <div className="my-2 h-px w-8 bg-slate-200" />

            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={settingsUrl}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                    isOnSettings
                      ? "bg-teal-100 text-teal-700"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                  )}
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </nav>

          {/* User Avatar at Bottom */}
          <div className="flex items-center justify-center border-t border-slate-200/60 py-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-lg transition-transform hover:scale-105 focus:ring-2 focus:ring-teal-500/20 focus:outline-none">
                  <Avatar className="h-9 w-9 rounded-lg">
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={fullName} />
                    )}
                    <AvatarFallback className="rounded-lg bg-teal-100 text-sm font-medium text-teal-700">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      {profile?.avatar_url && (
                        <AvatarImage src={profile.avatar_url} alt={fullName} />
                      )}
                      <AvatarFallback className="rounded-lg bg-teal-100 text-teal-700">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{fullName}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href={settingsUrl}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  asChild
                  className="text-red-600 focus:bg-red-50 focus:text-red-600"
                >
                  <form action={signOut} className="w-full">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
