"use client";

import * as React from "react";
import {
  Home,
  PhoneIncoming,
  PhoneOutgoing,
  Settings,
  Building2,
  LogOut,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
import { cn } from "@odis-ai/shared/util";
import { signOut } from "~/server/actions/auth";
import type { User } from "@supabase/supabase-js";

interface IconSidebarProps {
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

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon: Icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col items-center gap-1 px-2 py-2 transition-colors",
        isActive ? "text-white" : "text-white/60 hover:text-white/90",
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
      <span
        className={cn(
          "text-center text-[10px] leading-tight",
          isActive ? "font-medium" : "font-normal",
        )}
      >
        {label}
      </span>
    </Link>
  );
}

export function IconSidebar({
  user,
  profile,
  clinicSlug,
  allClinics,
}: IconSidebarProps) {
  const pathname = usePathname();

  const firstName = profile?.first_name ?? "User";
  const lastName = profile?.last_name ?? "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`.trim() ?? user.email ?? "User";

  // Build clinic-scoped URLs
  const dashboardUrl = clinicSlug ? `/dashboard/${clinicSlug}` : "/dashboard";
  const inboundUrl = clinicSlug
    ? `/dashboard/${clinicSlug}/inbound?outcome=all`
    : "/dashboard/inbound?outcome=all";
  const outboundUrl = clinicSlug
    ? `/dashboard/${clinicSlug}/outbound?view=all`
    : "/dashboard/outbound?view=all";
  const settingsUrl = clinicSlug
    ? `/dashboard/${clinicSlug}/settings`
    : "/dashboard/settings";

  // Determine active states
  const isOnDashboard =
    pathname === dashboardUrl ||
    (pathname.startsWith(`/dashboard/${clinicSlug ?? ""}`) &&
      !pathname.includes("/inbound") &&
      !pathname.includes("/outbound") &&
      !pathname.includes("/settings"));

  const isOnInbound =
    pathname.includes("/inbound") ||
    (clinicSlug && pathname.startsWith(`/dashboard/${clinicSlug}/inbound`));

  const isOnOutbound =
    pathname.includes("/outbound") ||
    (clinicSlug && pathname.startsWith(`/dashboard/${clinicSlug}/outbound`));

  const isOnSettings =
    pathname.includes("/settings") ||
    (clinicSlug && pathname.startsWith(`/dashboard/${clinicSlug}/settings`));

  const currentClinic = allClinics?.find((c) => c.slug === clinicSlug);

  return (
    <div className="hidden h-screen w-20 flex-shrink-0 flex-col bg-teal-800 px-1.5 md:flex">
      {/* Header: Logo */}
      <div className="flex flex-col items-center gap-2 px-2 pt-4 pb-3">
        <Link
          href={dashboardUrl}
          className="flex h-10 w-10 items-center justify-center rounded-lg"
        >
          <Image
            src="/icon-128.png"
            alt="Odis AI"
            width={24}
            height={24}
            className="h-8 w-8 shrink-0 rounded-lg"
          />
        </Link>

        {/* Clinic Selector */}
        {allClinics && allClinics.length > 1 && clinicSlug && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-7 w-7 items-center justify-center rounded text-white/50 hover:text-white/80"
                title={currentClinic?.name ?? "Select Clinic"}
              >
                <Building2 className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="start"
              className="w-56"
              sideOffset={12}
            >
              <DropdownMenuLabel className="text-xs font-normal text-gray-500">
                Switch Clinic
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allClinics.map((clinic) => (
                <DropdownMenuItem key={clinic.id} asChild>
                  <Link
                    href={`/dashboard/${clinic.slug}`}
                    className={cn(
                      "flex items-center justify-between",
                      clinic.slug === clinicSlug && "bg-teal-50 text-teal-700",
                    )}
                  >
                    <span>{clinic.name}</span>
                    {clinic.slug === clinicSlug && (
                      <ChevronRight className="h-4 w-4 text-teal-500" />
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 h-px bg-white/20" />

      {/* Navigation Items */}
      <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
        <NavItem
          href={dashboardUrl}
          icon={Home}
          label="Overview"
          isActive={!!isOnDashboard}
        />
        <NavItem
          href={inboundUrl}
          icon={PhoneIncoming}
          label="After Hours"
          isActive={!!isOnInbound}
        />
        <NavItem
          href={outboundUrl}
          icon={PhoneOutgoing}
          label="Discharge"
          isActive={!!isOnOutbound}
        />
      </nav>

      {/* Footer: Settings + User Menu */}
      <div className="flex flex-col items-center gap-1 px-2 pb-4">
        {/* Divider */}
        <div className="mb-2 h-px w-8 bg-white/20" />

        <NavItem
          href={settingsUrl}
          icon={Settings}
          label="Settings"
          isActive={!!isOnSettings}
        />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="mt-2 flex h-8 w-8 items-center justify-center">
              <Avatar className="h-7 w-7 rounded-md">
                {profile?.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={fullName} />
                )}
                <AvatarFallback className="rounded-md bg-white/20 text-[10px] font-medium text-white/80">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-52"
            side="right"
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2">
                <Avatar className="h-8 w-8 rounded-md">
                  {profile?.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt={fullName} />
                  )}
                  <AvatarFallback className="rounded-md bg-teal-100 text-xs font-medium text-teal-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-gray-900">
                    {fullName}
                  </span>
                  <span className="truncate text-xs text-gray-500">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={settingsUrl} className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-gray-500" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="https://billing.stripe.com/p/login/eVqbJ0ctPemHbrq7w25sA00"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span>Manage Billing</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 text-red-600 focus:bg-red-50 focus:text-red-600"
              onClick={async () => {
                await signOut();
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
