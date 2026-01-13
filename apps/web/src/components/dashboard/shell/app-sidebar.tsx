"use client";

import * as React from "react";
import {
  Home,
  Settings,
  LogOut,
  PhoneIncoming,
  PhoneOutgoing,
  CreditCard,
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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@odis-ai/shared/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "~/server/actions/auth";
import type { User } from "@supabase/supabase-js";
import { ClinicSelector } from "../clinic-selector";

/**
 * Extract clinic slug from pathname
 * Matches /dashboard/[clinicSlug] or /dashboard/[clinicSlug]/...
 */
function getClinicSlugFromPathname(pathname: string): string | null {
  const match = /^\/dashboard\/([^/]+)/.exec(pathname);
  if (match) {
    const slug = match[1];
    // Exclude non-clinic paths like /dashboard/inbound, /dashboard/outbound
    if (slug && !["inbound", "outbound"].includes(slug)) {
      return slug;
    }
  }
  return null;
}

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
  allClinics?: Array<{ id: string; name: string; slug: string }>;
  currentClinicName?: string;
}

export function AppSidebar({
  user,
  profile,
  clinicSlug: initialClinicSlug,
  allClinics,
  currentClinicName: _currentClinicName,
}: AppSidebarProps) {
  const pathname = usePathname();
  const firstName = profile?.first_name ?? "User";
  const lastName = profile?.last_name ?? "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`.trim() ?? user.email ?? "User";

  // Derive active clinic slug from URL (handles client-side navigation)
  // Falls back to prop value if not found in pathname
  const activeClinicSlug =
    getClinicSlugFromPathname(pathname) ?? initialClinicSlug;

  // Build clinic-scoped URLs using the active clinic
  const dashboardUrl = buildUrl(activeClinicSlug, "/dashboard");
  const settingsUrl = buildUrl(activeClinicSlug, "/dashboard/settings");

  // Check if on inbound or outbound pages
  const isOnInbound = pathname === "/dashboard/inbound";
  const isOnOutbound =
    pathname === "/dashboard/outbound" ||
    pathname.startsWith("/dashboard/outbound/");
  const isOnDashboard =
    pathname === dashboardUrl || pathname.startsWith(dashboardUrl + "/");
  const isOnSettings = pathname.includes("/settings");

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <Link href={dashboardUrl} className="flex items-center gap-2">
            <Image
              src="/icon-128.png"
              alt="Odis AI"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg transition-transform hover:scale-105"
            />
            <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
              Odis AI
            </span>
          </Link>
        </div>
        {allClinics && allClinics.length > 0 && activeClinicSlug && (
          <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
            <ClinicSelector
              clinics={allClinics}
              currentClinicSlug={activeClinicSlug}
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={
                  isOnDashboard &&
                  !isOnInbound &&
                  !isOnOutbound &&
                  !isOnSettings
                }
                tooltip="Dashboard"
              >
                <Link href={dashboardUrl}>
                  <Home />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Dashboard
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Calls</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isOnInbound}
                tooltip="Inbound"
              >
                <Link href="/dashboard/inbound">
                  <PhoneIncoming />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Inbound
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isOnOutbound}
                tooltip="Outbound"
              >
                <Link href="/dashboard/outbound">
                  <PhoneOutgoing />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Outbound
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isOnSettings}
                tooltip="Settings"
              >
                <Link href={settingsUrl}>
                  <Settings />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Settings
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
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
                </SidebarMenuButton>
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
                  <DropdownMenuItem asChild>
                    <a
                      href="https://billing.stripe.com/p/login/eVqbJ0ctPemHbrq7w25sA00"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Manage Billing
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:bg-red-50 focus:text-red-600"
                  onClick={async () => {
                    await signOut();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
