"use client";

import * as React from "react";
import { Home, Settings, PhoneCall, Command, LogOut } from "lucide-react";
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
} from "~/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "~/server/actions/auth";
import type { User } from "@supabase/supabase-js";

// Menu items
const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Discharges",
    url: "/dashboard/cases",
    icon: PhoneCall,
  },
  // Removed: Patients, Schedule - pages not implemented yet
  // These can be re-added when pages are created
];

const systemItems = [
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
  // Removed: Help & Support - page not implemented yet
  // This can be re-added when page is created
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    role: string;
    clinic_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function AppSidebar({ user, profile, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const firstName = profile?.first_name ?? "User";
  const lastName = profile?.last_name ?? "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`.trim() ?? user.email ?? "User";

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg bg-[#31aba3]">
                  <Command className="size-4 text-white" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Odis AI</span>
                  <span className="truncate text-xs">Practice Management</span>
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
                    isActive={pathname === item.url}
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
                    isActive={pathname === item.url}
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
            <div className="flex items-center gap-3 p-2">
              <Avatar className="h-8 w-8 rounded-lg">
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
