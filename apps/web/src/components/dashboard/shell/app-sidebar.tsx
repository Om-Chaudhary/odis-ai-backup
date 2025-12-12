"use client";

import * as React from "react";
import {
  Home,
  Settings,
  LogOut,
  PhoneIncoming,
  PhoneOutgoing,
  ChevronsUpDown,
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
  useSidebar,
} from "@odis-ai/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@odis-ai/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@odis-ai/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "~/server/actions/auth";
import type { User } from "@supabase/supabase-js";

interface NavUserProps {
  user: User;
  fullName: string;
  initials: string;
  avatarUrl?: string | null;
  settingsUrl: string;
}

function NavUser({
  user,
  fullName,
  initials,
  avatarUrl,
  settingsUrl,
}: NavUserProps) {
  const { isMobile } = useSidebar();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
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
          <ChevronsUpDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
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
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={settingsUrl}>
              <Settings />
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
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut />
              Log out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Odis AI</span>
                  <span className="text-muted-foreground truncate overflow-hidden text-xs text-ellipsis">
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavUser
              user={user}
              fullName={fullName}
              initials={initials}
              avatarUrl={profile?.avatar_url}
              settingsUrl={settingsUrl}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
