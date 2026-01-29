"use client";

import * as React from "react";
import {
  Home,
  PhoneIncoming,
  PhoneOutgoing,
  Settings,
  ChevronRight,
  Shield,
  Users,
  RefreshCw,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@odis-ai/shared/ui/dropdown-menu";
import { TooltipProvider } from "@odis-ai/shared/ui/tooltip";
import { cn } from "@odis-ai/shared/util";

interface UnifiedSidebarProps {
  profile?: {
    first_name: string | null;
    last_name: string | null;
    role: string;
    clinic_name: string | null;
    avatar_url: string | null;
  } | null;
  clinicSlug: string | null;
  allClinics?: Array<{ id: string; name: string; slug: string }>;
  isAdmin?: boolean;
}

interface MainNavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
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

/**
 * Extract clinic slug from URL path
 * e.g., /dashboard/alum-rock/admin/sync -> alum-rock
 * e.g., /dashboard/masson-veterinary-hospital -> masson-veterinary-hospital
 */
function getClinicSlugFromPathname(pathname: string): string | null {
  const match = /^\/dashboard\/([^/]+)/.exec(pathname);
  return match?.[1] ?? null;
}

/**
 * Extract sub-path from clinic-scoped URL
 * e.g., /dashboard/alum-rock/admin/sync -> /admin/sync
 * e.g., /dashboard/alum-rock/inbound -> /inbound
 * e.g., /dashboard/alum-rock -> ""
 */
function getSubPathFromPathname(pathname: string): string {
  const match = /^\/dashboard\/[^/]+(\/.*)?$/.exec(pathname);
  return match?.[1] ?? "";
}

export function UnifiedSidebar({
  clinicSlug: initialClinicSlug,
  allClinics,
  isAdmin,
}: UnifiedSidebarProps) {
  const pathname = usePathname();

  // Derive clinic slug from URL path (client-side, updates on navigation)
  // Fall back to server-provided slug for initial render
  const clinicSlug = getClinicSlugFromPathname(pathname) ?? initialClinicSlug;

  // Get current sub-path to preserve when switching clinics
  const currentSubPath = getSubPathFromPathname(pathname);

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

  const currentClinic = allClinics?.find((c) => c.slug === clinicSlug);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="hidden h-screen w-60 shrink-0 md:flex">
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

          {/* Header: Clinic Name/Selector */}
          {clinicSlug && (
            <div className="relative z-10 px-3 pt-4 pb-2">
              {allClinics && allClinics.length > 1 ? (
                /* Multi-clinic: Show dropdown selector */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="group relative flex w-full items-center gap-2 overflow-hidden rounded-lg bg-white/5 px-3 py-2 text-left transition-all hover:bg-white/10 hover:shadow-lg hover:shadow-teal-900/20">
                      {/* Subtle gradient overlay on hover */}
                      <div className="absolute inset-0 bg-linear-to-r from-teal-500/0 via-teal-500/5 to-teal-500/0 opacity-0 transition-opacity group-hover:opacity-100" />

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
                            href={`/dashboard/${clinic.slug}${currentSubPath}`}
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
              ) : (
                /* Single-clinic: Show static clinic name */
                <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-500/20">
                    <Building2 className="h-3.5 w-3.5 text-teal-400" />
                  </div>
                  <p className="truncate text-xs font-medium text-white">
                    {currentClinic?.name ?? "Clinic"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Main Navigation */}
          <nav className="relative z-10 flex flex-col gap-1 px-3 py-2">
            <MainNavItem
              href={dashboardUrl}
              icon={Home}
              label="Overview"
              isActive={!!isOnDashboard}
            />

            {/* After Hours - Simple nav item */}
            <MainNavItem
              href={inboundUrl}
              icon={PhoneIncoming}
              label="After Hours"
              isActive={!!isOnInbound}
            />

            {/* Discharge - Simple nav item */}
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

          {/* Admin Section - only for admin users */}
          {isAdmin && clinicSlug && (
            <>
              <div className="relative z-10 mx-4 my-3">
                <div className="h-px bg-linear-to-r from-transparent via-teal-700/40 to-transparent" />
              </div>
              <div className="mb-2 px-3">
                <span className="px-3 text-[10px] font-semibold tracking-wider text-teal-400/70 uppercase">
                  Admin
                </span>
              </div>
              <nav className="flex flex-col gap-1 px-3">
                <MainNavItem
                  href={`/dashboard/${clinicSlug}/admin`}
                  icon={Shield}
                  label="Admin Overview"
                  isActive={pathname === `/dashboard/${clinicSlug}/admin`}
                />
                <MainNavItem
                  href={`/dashboard/${clinicSlug}/admin/clinics`}
                  icon={Building2}
                  label="Clinics"
                  isActive={pathname.includes(
                    `/dashboard/${clinicSlug}/admin/clinics`,
                  )}
                />
                <MainNavItem
                  href={`/dashboard/${clinicSlug}/admin/users`}
                  icon={Users}
                  label="Users"
                  isActive={pathname.includes(
                    `/dashboard/${clinicSlug}/admin/users`,
                  )}
                />
                <MainNavItem
                  href={`/dashboard/${clinicSlug}/admin/sync`}
                  icon={RefreshCw}
                  label="PIMS Sync"
                  isActive={pathname.includes(
                    `/dashboard/${clinicSlug}/admin/sync`,
                  )}
                />
              </nav>
            </>
          )}

          {/* Spacer - fills remaining space */}
          <div className="flex-1" />
        </div>
      </div>
    </TooltipProvider>
  );
}
