"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, ArrowLeft, Shield, LayoutDashboard } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import type { User } from "@supabase/supabase-js";

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
    title: "Scheduled Items",
    href: "/admin/scheduled",
    icon: Calendar,
    description: "View and manage scheduled calls & emails",
  },
];

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
          <Shield className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-900">Admin Panel</h1>
          <p className="text-xs text-slate-500">
            {profile?.clinic_name ?? "No clinic"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <div className="mb-2 px-3 text-xs font-medium tracking-wider text-slate-400 uppercase">
          Management
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-amber-50 text-amber-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <div className="flex-1">
                    <div>{item.title}</div>
                    {!isActive && (
                      <div className="text-xs font-normal text-slate-400">
                        {item.description}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <Link
          href="/dashboard"
          className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <LayoutDashboard className="h-4 w-4" />
          Main Dashboard
        </Link>
      </div>
    </div>
  );
}
