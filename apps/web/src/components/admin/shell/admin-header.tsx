"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface AdminHeaderProps {
  user: User;
  profile: {
    role: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

const pathLabels: Record<string, string> = {
  admin: "Overview",
  accounts: "Accounts",
  cases: "Cases",
  patients: "Patients",
  discharges: "Discharges",
  calls: "Calls",
  emails: "Emails",
  settings: "Settings",
};

export function AdminHeader({
  user: _user,
  profile: _profile,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/admin"
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700"
        >
          <Home className="h-4 w-4" />
        </Link>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          const label = pathLabels[segment] ?? segment;

          return (
            <span key={segment} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-slate-300" />
              {isLast ? (
                <span className="font-medium text-slate-900">{label}</span>
              ) : (
                <Link
                  href={href}
                  className="text-slate-500 hover:text-slate-700"
                >
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Right side - back to dashboard */}
      <Link
        href="/dashboard"
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        Back to Dashboard
      </Link>
    </header>
  );
}
