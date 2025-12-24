"use client";

import * as React from "react";
import {
  Home,
  Settings,
  LogOut,
  PhoneIncoming,
  PhoneOutgoing,
  Phone,
  Calendar,
  MessageSquare,
  List,
  UserX,
  AlertTriangle,
  ChevronRight,
  PanelLeftClose,
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
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "~/server/actions/auth";
import type { User } from "@supabase/supabase-js";
import { cn } from "@odis-ai/shared/util";

type ActivePanel = "inbound" | "outbound" | null;

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
  const searchParams = useSearchParams();
  const firstName = profile?.first_name ?? "User";
  const lastName = profile?.last_name ?? "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`.trim() ?? user.email ?? "User";

  // Build clinic-scoped URLs
  const dashboardUrl = buildUrl(clinicSlug, "/dashboard");
  const settingsUrl = buildUrl(clinicSlug, "/dashboard/settings");

  // Track which secondary panel is open (hover-based)
  const [hoveredPanel, setHoveredPanel] = React.useState<ActivePanel>(null);
  const [isPanelHovered, setIsPanelHovered] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Check if on inbound or outbound pages
  const isOnInbound = pathname === "/dashboard/inbound";
  const isOnOutbound =
    pathname === "/dashboard/outbound" ||
    pathname.startsWith("/dashboard/outbound/");
  const isOnDashboard =
    pathname === dashboardUrl || pathname.startsWith(dashboardUrl + "/");
  const isOnSettings = pathname.includes("/settings");

  // Get current view from URL
  const currentView = searchParams.get("view");

  // Determine active sub-item for inbound
  const inboundActiveView = isOnInbound
    ? (currentView ?? "appointments")
    : null;
  const outboundActiveView = isOnOutbound ? (currentView ?? "all") : null;

  // The panel to display is either the hovered one or the route-based one (unless dismissed)
  const routeBasedPanel = isOnInbound
    ? "inbound"
    : isOnOutbound
      ? "outbound"
      : null;
  const displayPanel = isDismissed
    ? hoveredPanel
    : (hoveredPanel ?? routeBasedPanel);

  // Handle hover enter on icon
  const handleIconHover = (panel: ActivePanel) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Reset dismissed state when actively hovering on a panel icon
    if (panel !== null) {
      setIsDismissed(false);
    }
    setHoveredPanel(panel);
  };

  // Handle dismiss button click
  const handleDismiss = () => {
    setIsDismissed(true);
    setHoveredPanel(null);
    setIsPanelHovered(false);
  };

  // Handle hover leave with delay
  const handleIconLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isPanelHovered) {
        setHoveredPanel(null);
      }
    }, 150);
  };

  // Handle panel hover
  const handlePanelHover = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsPanelHovered(true);
  };

  // Handle panel leave
  const handlePanelLeave = () => {
    setIsPanelHovered(false);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredPanel(null);
    }, 150);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Inbound sub-items
  const inboundSubItems = [
    {
      title: "Calls",
      url: "/dashboard/inbound?view=calls",
      icon: Phone,
      viewKey: "calls",
    },
    {
      title: "Appointments",
      url: "/dashboard/inbound?view=appointments",
      icon: Calendar,
      viewKey: "appointments",
    },
    {
      title: "Messages",
      url: "/dashboard/inbound?view=messages",
      icon: MessageSquare,
      viewKey: "messages",
    },
  ];

  // Outbound sub-items
  const outboundSubItems = [
    {
      title: "All",
      url: "/dashboard/outbound?view=all",
      icon: List,
      viewKey: "all",
    },
    {
      title: "Missing",
      url: "/dashboard/outbound?view=needs_review",
      icon: UserX,
      viewKey: "needs_review",
    },
    {
      title: "Needs Attention",
      url: "/dashboard/outbound?view=needs_attention",
      icon: AlertTriangle,
      viewKey: "needs_attention",
    },
  ];

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
                  onMouseEnter={() => handleIconHover(null)}
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
            <div
              onMouseEnter={() => handleIconHover("inbound")}
              onMouseLeave={handleIconLeave}
              className="relative"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/inbound?view=appointments"
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                      isOnInbound || displayPanel === "inbound"
                        ? "bg-teal-100 text-teal-700"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                    )}
                  >
                    <PhoneIncoming className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  hidden={displayPanel === "inbound"}
                >
                  Inbound
                </TooltipContent>
              </Tooltip>
              {/* Hover indicator */}
              <div
                className={cn(
                  "absolute top-1/2 right-0 -translate-y-1/2 transition-all duration-200",
                  displayPanel === "inbound"
                    ? "translate-x-1 opacity-100"
                    : "translate-x-0 opacity-0",
                )}
              >
                <ChevronRight className="h-3 w-3 text-teal-500" />
              </div>
            </div>

            {/* Outbound */}
            <div
              onMouseEnter={() => handleIconHover("outbound")}
              onMouseLeave={handleIconLeave}
              className="relative"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/outbound?view=all"
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                      isOnOutbound || displayPanel === "outbound"
                        ? "bg-teal-100 text-teal-700"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                    )}
                  >
                    <PhoneOutgoing className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  hidden={displayPanel === "outbound"}
                >
                  Outbound
                </TooltipContent>
              </Tooltip>
              {/* Hover indicator */}
              <div
                className={cn(
                  "absolute top-1/2 right-0 -translate-y-1/2 transition-all duration-200",
                  displayPanel === "outbound"
                    ? "translate-x-1 opacity-100"
                    : "translate-x-0 opacity-0",
                )}
              >
                <ChevronRight className="h-3 w-3 text-teal-500" />
              </div>
            </div>

            <div className="my-2 h-px w-8 bg-slate-200" />

            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={settingsUrl}
                  onMouseEnter={() => handleIconHover(null)}
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

        {/* Secondary Panel - Opens to the right of icon rail on hover */}
        <div
          onMouseEnter={handlePanelHover}
          onMouseLeave={handlePanelLeave}
          className={cn(
            "border-r border-slate-200/60 bg-slate-50/80 backdrop-blur-sm",
            "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            displayPanel
              ? "w-52 opacity-100"
              : "pointer-events-none w-0 opacity-0",
          )}
        >
          <div
            className={cn(
              "flex h-full w-52 flex-col transition-all delay-75 duration-300",
              displayPanel
                ? "translate-x-0 opacity-100"
                : "-translate-x-4 opacity-0",
            )}
          >
            {/* Panel Header */}
            <div className="flex h-16 items-center border-b border-slate-200/60 px-4">
              <h2 className="text-sm font-semibold text-slate-800">
                {displayPanel === "inbound" ? "Inbound" : "Outbound"}
              </h2>
            </div>

            {/* Panel Content */}
            <nav className="flex-1 p-3">
              <ul className="space-y-1">
                {(displayPanel === "inbound"
                  ? inboundSubItems
                  : displayPanel === "outbound"
                    ? outboundSubItems
                    : []
                ).map((item, index) => {
                  const isActive =
                    displayPanel === "inbound"
                      ? inboundActiveView === item.viewKey
                      : outboundActiveView === item.viewKey;

                  return (
                    <li
                      key={item.title}
                      className={cn(
                        "transition-all duration-300",
                        displayPanel
                          ? "translate-x-0 opacity-100"
                          : "-translate-x-2 opacity-0",
                      )}
                      style={{
                        transitionDelay: displayPanel
                          ? `${100 + index * 50}ms`
                          : "0ms",
                      }}
                    >
                      <Link
                        href={item.url}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                          "transition-all duration-200",
                          isActive
                            ? "bg-teal-100 text-teal-700 shadow-sm"
                            : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm",
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Dismiss Button */}
            <div className="border-t border-slate-200/60 p-3">
              <button
                onClick={handleDismiss}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
                  "text-slate-400 transition-all duration-200",
                  "hover:bg-slate-100 hover:text-slate-600",
                )}
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
                Collapse
              </button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
