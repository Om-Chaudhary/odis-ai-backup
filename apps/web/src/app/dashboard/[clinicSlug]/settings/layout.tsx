"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@odis-ai/shared/util";
import { Clock, Send, PhoneIncoming, Palette, Settings as SettingsIcon } from "lucide-react";

const TABS = [
  {
    id: "hours",
    label: "Hours",
    icon: Clock,
    href: (clinicSlug: string) => `/dashboard/${clinicSlug}/settings/hours`,
  },
  {
    id: "outbound",
    label: "Outbound",
    icon: Send,
    href: (clinicSlug: string) => `/dashboard/${clinicSlug}/settings/outbound`,
  },
  {
    id: "inbound",
    label: "Inbound",
    icon: PhoneIncoming,
    href: (clinicSlug: string) => `/dashboard/${clinicSlug}/settings/inbound`,
  },
  {
    id: "branding",
    label: "Branding",
    icon: Palette,
    href: (clinicSlug: string) => `/dashboard/${clinicSlug}/settings/branding`,
  },
  {
    id: "system",
    label: "System",
    icon: SettingsIcon,
    href: (clinicSlug: string) => `/dashboard/${clinicSlug}/settings/system`,
  },
] as const;

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams<{ clinicSlug: string }>();
  const clinicSlug = params?.clinicSlug ?? "";

  return (
    <div className="flex h-full flex-col">
      {/* Top Tabs Navigation */}
      <div className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="px-6">
          <nav className="flex gap-1" aria-label="Settings tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const href = tab.href(clinicSlug);
              const isActive = pathname === href;

              return (
                <Link
                  key={tab.id}
                  href={href}
                  className={cn(
                    "group flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "border-teal-500 text-teal-700"
                      : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive
                        ? "text-teal-600"
                        : "text-slate-400 group-hover:text-slate-600",
                    )}
                  />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
