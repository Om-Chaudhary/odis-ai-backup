"use client";

import * as React from "react";
import {
  Home,
  PhoneIncoming,
  PhoneOutgoing,
  Settings,
  LogOut,
  CreditCard,
  ChevronRight,
  Calendar,
  PhoneCall,
  Info,
  AlertCircle,
  AlertTriangle,
  Shield,
  Building2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
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
import { TooltipProvider } from "@odis-ai/shared/ui/tooltip";
import { cn } from "@odis-ai/shared/util";
import { signOut } from "~/server/actions/auth";
import type { User } from "@supabase/supabase-js";
import { api } from "~/trpc/client";

interface UnifiedSidebarProps {
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

interface MainNavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}

interface SecondaryNavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  count?: number;
  isActive: boolean;
  accentColor?: string;
}

function MainNavItem({ href, icon: Icon, label, isActive }: MainNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
        isActive
          ? "bg-white/10 font-medium text-white shadow-sm"
          : "text-slate-300 hover:bg-white/5 hover:text-white",
      )}
    >
      {isActive && (
        <div className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-teal-400" />
      )}
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0",
          isActive && "text-teal-400",
        )}
        strokeWidth={isActive ? 2 : 1.5}
      />
      <span className="tracking-tight">{label}</span>
    </Link>
  );
}

function SecondaryNavItem({
  href,
  icon: Icon,
  label,
  count,
  isActive,
  accentColor,
}: SecondaryNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-200",
        isActive
          ? "bg-white/10 font-medium text-white"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive
            ? (accentColor ?? "text-teal-400")
            : "text-slate-500 group-hover:text-slate-400",
        )}
        strokeWidth={isActive ? 2 : 1.5}
      />
      <span className="flex-1 tracking-tight">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-medium tabular-nums",
            isActive
              ? "bg-white/15 text-white"
              : "bg-teal-900/40 text-teal-200/70",
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

export function UnifiedSidebar({
  user,
  profile,
  clinicSlug,
  allClinics,
}: UnifiedSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
  const billingUrl = clinicSlug
    ? `/dashboard/${clinicSlug}/billing`
    : "/dashboard/billing";

  // Determine active states
  const isOnDashboard =
    pathname === dashboardUrl ||
    (pathname.startsWith(`/dashboard/${clinicSlug ?? ""}`) &&
      !pathname.includes("/inbound") &&
      !pathname.includes("/outbound") &&
      !pathname.includes("/settings") &&
      !pathname.includes("/billing"));

  const isOnInbound =
    pathname.includes("/inbound") ||
    (clinicSlug && pathname.startsWith(`/dashboard/${clinicSlug}/inbound`));

  const isOnOutbound =
    pathname.includes("/outbound") ||
    (clinicSlug && pathname.startsWith(`/dashboard/${clinicSlug}/outbound`));

  const isOnSettings =
    pathname.includes("/settings") ||
    (clinicSlug && pathname.startsWith(`/dashboard/${clinicSlug}/settings`));

  // Determine if we should show secondary navigation
  const showInboundSecondary = !!isOnInbound;
  const showOutboundSecondary = !!isOnOutbound;
  const showSecondaryNav = showInboundSecondary || showOutboundSecondary;

  // Get current filters
  const outcomeFilter = searchParams.get("outcome") ?? "all";
  const viewMode = searchParams.get("view") ?? "all";

  // Fetch stats
  const { data: inboundStats } = api.inbound.getInboundStats.useQuery(
    {},
    { enabled: !!clinicSlug && showInboundSecondary },
  );

  const { data: outboundStats } = api.outbound.getDischargeCaseStats.useQuery(
    { clinicSlug: clinicSlug ?? undefined },
    { enabled: !!clinicSlug && showOutboundSecondary },
  );

  const currentClinic = allClinics?.find((c) => c.slug === clinicSlug);
  const inboundBaseUrl = `/dashboard/${clinicSlug}/inbound`;
  const outboundBaseUrl = `/dashboard/${clinicSlug}/outbound`;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="hidden h-screen w-60 flex-shrink-0 md:flex">
        {/* Sidebar Container - Teal-family dark for brand cohesion */}
        <div
          className="relative flex w-full flex-col"
          style={{
            background:
              "linear-gradient(to bottom, hsl(175 35% 12%), hsl(175 30% 9%), hsl(175 25% 7%))",
          }}
        >
          {/* Subtle texture overlay */}
          <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+Cjwvc3ZnPg==')] opacity-50" />

          {/* Header: Logo & Clinic */}
          <div className="relative z-10 flex items-center gap-3 px-4 pt-5 pb-4">
            <Link
              href={dashboardUrl}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-900/30 transition-transform hover:scale-105"
            >
              <Image
                src="/icon-128.png"
                alt="Odis AI"
                width={20}
                height={20}
                className="h-5 w-5"
              />
            </Link>

            {/* Clinic Selector */}
            {allClinics && allClinics.length > 1 && clinicSlug && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group relative flex flex-1 items-center gap-2 overflow-hidden rounded-lg bg-white/5 px-3 py-2 text-left transition-all hover:bg-white/10 hover:shadow-lg hover:shadow-teal-900/20">
                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/5 to-teal-500/0 opacity-0 transition-opacity group-hover:opacity-100" />

                    <div className="relative flex min-w-0 flex-1 items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-500/20 transition-colors group-hover:bg-teal-500/30">
                        <Building2 className="h-3.5 w-3.5 text-teal-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white">
                          {currentClinic?.name ?? "Select Clinic"}
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-teal-400/60 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-400" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="start"
                  className="w-64"
                  sideOffset={12}
                >
                  <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2">
                    <Building2 className="h-4 w-4 text-teal-600" />
                    <span className="text-xs font-semibold text-gray-700">
                      Switch Clinic
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto">
                    {allClinics.map((clinic) => (
                      <DropdownMenuItem key={clinic.id} asChild>
                        <Link
                          href={`/dashboard/${clinic.slug}`}
                          className={cn(
                            "group relative flex items-center gap-3 px-3 py-2.5 transition-colors",
                            clinic.slug === clinicSlug
                              ? "bg-teal-50 text-teal-700"
                              : "hover:bg-gray-50",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                              clinic.slug === clinicSlug
                                ? "bg-teal-100"
                                : "bg-gray-100 group-hover:bg-teal-50",
                            )}
                          >
                            <Building2
                              className={cn(
                                "h-4 w-4",
                                clinic.slug === clinicSlug
                                  ? "text-teal-600"
                                  : "text-gray-500 group-hover:text-teal-600",
                              )}
                            />
                          </div>
                          <span className="flex-1 text-sm font-medium">
                            {clinic.name}
                          </span>
                          {clinic.slug === clinicSlug && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600">
                              <ChevronRight
                                className="h-3 w-3 text-white"
                                strokeWidth={3}
                              />
                            </div>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Main Navigation */}
          <nav className="relative z-10 flex flex-col gap-1 px-3 py-2">
            <MainNavItem
              href={dashboardUrl}
              icon={Home}
              label="Overview"
              isActive={!!isOnDashboard}
            />
            <MainNavItem
              href={inboundUrl}
              icon={PhoneIncoming}
              label="After Hours"
              isActive={!!isOnInbound}
            />
            <MainNavItem
              href={outboundUrl}
              icon={PhoneOutgoing}
              label="Discharge"
              isActive={!!isOnOutbound}
            />
            <MainNavItem
              href={settingsUrl}
              icon={Settings}
              label="Settings"
              isActive={!!isOnSettings}
            />
          </nav>

          {/* Divider & Secondary Navigation */}
          {showSecondaryNav && clinicSlug && (
            <>
              <div className="relative z-10 mx-4 my-3">
                <div className="h-px bg-gradient-to-r from-transparent via-teal-700/40 to-transparent" />
              </div>

              <div className="relative z-10 flex-1 overflow-y-auto px-3">
                {/* Inbound Secondary Nav */}
                {showInboundSecondary && (
                  <nav
                    id="inbound-nav-filters"
                    className="flex flex-col gap-0.5"
                  >
                    <SecondaryNavItem
                      href={`${inboundBaseUrl}?outcome=all`}
                      icon={PhoneIncoming}
                      label="All Calls"
                      count={inboundStats?.calls?.total}
                      isActive={
                        pathname.startsWith(inboundBaseUrl) &&
                        outcomeFilter === "all"
                      }
                    />
                    <SecondaryNavItem
                      href={`${inboundBaseUrl}?outcome=appointment`}
                      icon={Calendar}
                      label="Appointments"
                      count={inboundStats?.calls?.appointment}
                      isActive={
                        pathname.startsWith(inboundBaseUrl) &&
                        outcomeFilter === "appointment"
                      }
                      accentColor="text-emerald-400"
                    />
                    <SecondaryNavItem
                      href={`${inboundBaseUrl}?outcome=callback`}
                      icon={PhoneCall}
                      label="Callback"
                      count={inboundStats?.calls?.callback}
                      isActive={
                        pathname.startsWith(inboundBaseUrl) &&
                        outcomeFilter === "callback"
                      }
                      accentColor="text-amber-400"
                    />
                    <SecondaryNavItem
                      href={`${inboundBaseUrl}?outcome=info`}
                      icon={Info}
                      label="Info"
                      count={inboundStats?.calls?.info}
                      isActive={
                        pathname.startsWith(inboundBaseUrl) &&
                        outcomeFilter === "info"
                      }
                      accentColor="text-blue-400"
                    />
                    <SecondaryNavItem
                      href={`${inboundBaseUrl}?outcome=emergency`}
                      icon={AlertCircle}
                      label="Emergency"
                      count={inboundStats?.calls?.emergency}
                      isActive={
                        pathname.startsWith(inboundBaseUrl) &&
                        outcomeFilter === "emergency"
                      }
                      accentColor="text-orange-400"
                    />
                  </nav>
                )}

                {/* Outbound Secondary Nav */}
                {showOutboundSecondary && (
                  <nav className="flex flex-col gap-0.5">
                    <SecondaryNavItem
                      href={`${outboundBaseUrl}?view=all`}
                      icon={PhoneOutgoing}
                      label="All Calls"
                      count={outboundStats?.total}
                      isActive={
                        pathname.startsWith(outboundBaseUrl) &&
                        viewMode === "all"
                      }
                    />
                    <SecondaryNavItem
                      href={`${outboundBaseUrl}?view=needs_attention`}
                      icon={AlertTriangle}
                      label="Needs Attention"
                      count={outboundStats?.needsAttention}
                      isActive={
                        pathname.startsWith(outboundBaseUrl) &&
                        viewMode === "needs_attention"
                      }
                      accentColor="text-amber-400"
                    />
                  </nav>
                )}
              </div>
            </>
          )}

          {/* Spacer when no secondary nav */}
          {!showSecondaryNav && <div className="flex-1" />}

          {/* Footer Divider - matches section divider above */}
          <div className="relative z-10 mx-4 mt-auto mb-3">
            <div className="h-px bg-gradient-to-r from-transparent via-teal-700/40 to-transparent" />
          </div>

          {/* Footer: User Menu */}
          <div className="relative z-10 px-3 pb-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/5">
                  <Avatar className="h-8 w-8 rounded-lg ring-2 ring-teal-800/50">
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={fullName} />
                    )}
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-xs font-semibold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium text-white">
                      {fullName}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {user.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56"
                side="top"
                align="start"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-2">
                    <Avatar className="h-8 w-8 rounded-lg">
                      {profile?.avatar_url && (
                        <AvatarImage src={profile.avatar_url} alt={fullName} />
                      )}
                      <AvatarFallback className="rounded-lg bg-teal-100 text-xs font-medium text-teal-700">
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
                    <Link
                      href={settingsUrl}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={billingUrl} className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span>Billing</span>
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-700">Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
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
      </div>
    </TooltipProvider>
  );
}
