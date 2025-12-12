"use client";

import * as React from "react";
import {
  Home,
  Settings,
  LogOut,
  PhoneIncoming,
  PhoneOutgoing,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@odis-ai/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@odis-ai/ui/avatar";
import { Button } from "@odis-ai/ui/button";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "~/server/actions/auth";
import type { User } from "@supabase/supabase-js";

/**
 * Build a clinic-scoped URL
 */
function buildUrl(clinicSlug: string | null, path: string): string {
  if (!clinicSlug) {
    // Fallback to legacy routes if no clinic slug
    return path;
  }
  // Map legacy paths to clinic-scoped paths
  const pathMap: Record<string, string> = {
    "/dashboard": `/dashboard/${clinicSlug}`,
    "/dashboard/settings": `/dashboard/${clinicSlug}/settings`,
  };
  return pathMap[path] ?? path;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
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

export function AppSidebar({
  user,
  profile,
  clinicSlug,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();
  const firstName = profile?.first_name ?? "User";
  const lastName = profile?.last_name ?? "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`.trim() ?? user.email ?? "User";
  const clinicName = profile?.clinic_name ?? "My Clinic";

  // Build clinic-scoped URLs
  const dashboardUrl = buildUrl(clinicSlug, "/dashboard");
  const settingsUrl = buildUrl(clinicSlug, "/dashboard/settings");
  const inboundDischargesUrl = "/dashboard/inbound";
  const outboundDischargesUrl = "/dashboard/outbound";

  // Menu items with dynamic URLs
  const mainNavItems = [
    {
      title: "Dashboard",
      url: dashboardUrl,
      icon: Home,
    },
  ];

  const dischargeItems = [
    {
      title: "Inbound",
      url: inboundDischargesUrl,
      icon: PhoneIncoming,
    },
    {
      title: "Outbound",
      url: outboundDischargesUrl,
      icon: PhoneOutgoing,
    },
  ];

  const systemItems = [
    {
      title: "Settings",
      url: settingsUrl,
      icon: Settings,
    },
  ];

  // Check if current path matches a nav item (supports nested paths)
  const isPathActive = (url: string) => {
    if (pathname === url) return true;
    // For dashboard root, only match exact
    if (url.endsWith(`/${clinicSlug}`) && pathname === url) return true;
    // For other items, match if path starts with url
    if (!url.endsWith(`/${clinicSlug}`) && pathname.startsWith(url + "/"))
      return true;
    return false;
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={dashboardUrl}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image
                    src="/icon-128.png"
                    alt="Odis AI Logo"
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-lg"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Odis AI</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {clinicName}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isPathActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Discharges</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dischargeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isPathActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      isPathActive(item.url) || pathname.includes("/settings")
                    }
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-1">
              <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                {profile?.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={fullName} />
                )}
                <AvatarFallback className="rounded-lg bg-[#31aba3]/10 text-[#31aba3]">
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
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={signOut} className="w-full">
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start text-slate-700 transition-all hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
