"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  PawPrint,
  Phone,
  Mail,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@odis-ai/utils";
import type { User } from "@supabase/supabase-js";

interface AdminSidebarProps {
  user: User;
  profile: {
    role: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Accounts",
    href: "/admin/accounts",
    icon: Users,
  },
  {
    label: "Cases",
    href: "/admin/cases",
    icon: Briefcase,
  },
  {
    label: "Patients",
    href: "/admin/patients",
    icon: PawPrint,
  },
  {
    label: "Calls",
    href: "/admin/discharges/calls",
    icon: Phone,
  },
  {
    label: "Emails",
    href: "/admin/discharges/emails",
    icon: Mail,
  },
];

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo/Header */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-900">
            Admin Panel
          </span>
          <span className="text-xs text-slate-500">Odis AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-rose-50 text-rose-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-rose-600" : "text-slate-400"
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer with user info */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            {profile?.first_name?.[0] ?? profile?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-900">
              {profile?.first_name
                ? `${profile.first_name} ${profile.last_name ?? ""}`
                : profile?.email}
            </span>
            <span className="text-xs text-slate-500">Administrator</span>
          </div>
        </div>
        <Link
          href="/admin/settings"
          className="mt-3 flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700"
        >
          <Settings className="h-3 w-3" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
