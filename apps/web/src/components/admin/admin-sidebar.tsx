"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  ArrowLeft,
  Shield,
  LayoutDashboard,
  Building2,
  Users,
  RefreshCw,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import type { User } from "@supabase/supabase-js";
import { useAdminContext } from "~/lib/admin-context";

interface AdminSidebarProps {
  user: User;
  profile: {
    first_name: string | null;
    last_name: string | null;
    role: string | null;
    clinic_name: string | null;
  } | null;
}

const navItems = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    description: "System health and quick stats",
  },
  {
    title: "Clinics",
    href: "/admin/clinics",
    icon: Building2,
    description: "Manage clinic settings and config",
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    description: "User management and invitations",
  },
  {
    title: "PIMS Sync",
    href: "/admin/sync",
    icon: RefreshCw,
    description: "Sync operations and schedules",
  },
  {
    title: "Operations",
    href: "/admin/operations",
    icon: CalendarClock,
    description: "Scheduled calls and emails",
  },
];

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname();
  const { selectedClinicId } = useAdminContext();

  // Helper to build URLs with clinic query param
  const buildUrl = (href: string) => {
    if (!selectedClinicId) return href;
    return `${href}?clinic=${selectedClinicId}`;
  };

  return (
    <div
      className="relative flex h-full w-60 flex-shrink-0 flex-col"
      style={{
        background:
          "linear-gradient(to bottom, hsl(175 35% 12%), hsl(175 30% 9%), hsl(175 25% 7%))",
      }}
    >
      {/* Subtle texture overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+Cjwvc3ZnPg==')] opacity-50" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-5 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-900/30">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white">Admin Panel</h1>
          <p className="text-xs text-slate-400">
            {profile?.clinic_name ?? "System Admin"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 px-3 py-2">
        <div className="mb-2 px-3 text-[10px] font-semibold tracking-wider text-teal-400/70 uppercase">
          Management
        </div>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={buildUrl(item.href)}
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
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isActive && "text-teal-400",
                    )}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <div className="flex-1">
                    <div className="tracking-tight">{item.title}</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Divider */}
      <div className="relative z-10 mx-4 mb-3">
        <div className="h-px bg-gradient-to-r from-transparent via-teal-700/40 to-transparent" />
      </div>

      {/* Footer */}
      <div className="relative z-10 px-3 pb-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
