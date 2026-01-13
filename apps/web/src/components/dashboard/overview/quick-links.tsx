"use client";

import {
  PhoneIncoming,
  PhoneOutgoing,
  Calendar,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { useOptionalClinic } from "@odis-ai/shared/ui/clinic-context";
import Link from "next/link";
import type { OverviewStats } from "./types";

interface QuickLinksProps {
  stats: OverviewStats;
}

export function QuickLinks({ stats }: QuickLinksProps) {
  // Get clinic context to build clinic-scoped URLs
  const clinicContext = useOptionalClinic();
  const clinicSlug = clinicContext?.clinicSlug;

  // Build clinic-scoped URL or fallback to legacy route
  const buildUrl = (path: string) => {
    if (clinicSlug) {
      return `/dashboard/${clinicSlug}${path}`;
    }
    return `/dashboard${path}`;
  };

  const links = [
    {
      href: buildUrl("/inbound"),
      icon: PhoneIncoming,
      label: "Inbound Calls",
      count: stats.calls.total,
      description: "View all incoming call activity",
      color: "blue",
    },
    {
      href: buildUrl("/outbound"),
      icon: PhoneOutgoing,
      label: "Outbound Calls",
      count: null,
      description: "Manage discharge follow-ups",
      color: "indigo",
    },
    {
      href: buildUrl("/inbound?view=appointments"),
      icon: Calendar,
      label: "Appointments",
      count: stats.appointments.pending > 0 ? stats.appointments.pending : null,
      description: "Review booking requests",
      color: "emerald",
      badge: stats.appointments.pending > 0 ? "pending" : undefined,
    },
    {
      href: buildUrl("/inbound?view=messages"),
      icon: MessageSquare,
      label: "Messages",
      count: stats.messages.new > 0 ? stats.messages.new : null,
      description: "Voicemails and callbacks",
      color: "violet",
      badge: stats.messages.new > 0 ? "new" : undefined,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {links.map((link) => (
        <QuickLinkCard key={link.href} {...link} />
      ))}
    </div>
  );
}

interface QuickLinkCardProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number | null;
  description: string;
  color: string;
  badge?: string;
}

const colorClasses = {
  blue: {
    icon: "text-blue-600",
    bg: "bg-blue-50",
    hover: "group-hover:bg-blue-100",
  },
  indigo: {
    icon: "text-indigo-600",
    bg: "bg-indigo-50",
    hover: "group-hover:bg-indigo-100",
  },
  emerald: {
    icon: "text-emerald-600",
    bg: "bg-emerald-50",
    hover: "group-hover:bg-emerald-100",
  },
  violet: {
    icon: "text-violet-600",
    bg: "bg-violet-50",
    hover: "group-hover:bg-violet-100",
  },
} as const;

type ColorKey = keyof typeof colorClasses;

function QuickLinkCard({
  href,
  icon: Icon,
  label,
  count,
  description,
  color,
  badge,
}: QuickLinkCardProps) {
  const colorKey = (color in colorClasses ? color : "blue") as ColorKey;
  const colors = colorClasses[colorKey];

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-xl border border-stone-200/60 bg-white p-5 transition-all",
        "hover:-translate-y-0.5 hover:border-stone-300/60 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
            colors.bg,
            colors.hover,
          )}
        >
          <Icon className={cn("h-5 w-5", colors.icon)} />
        </div>

        {count !== null && (
          <span className="flex items-center gap-1.5">
            {badge && (
              <span className="text-xs font-medium text-slate-500 capitalize">
                {badge}
              </span>
            )}
            <span className="text-lg font-semibold text-slate-900">
              {count}
            </span>
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-1 items-end justify-between gap-2">
        <div>
          <h4 className="font-medium text-slate-900">{label}</h4>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
      </div>
    </Link>
  );
}
