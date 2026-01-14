"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  PhoneIncoming,
  AlertCircle,
  Calendar,
  PhoneCall,
  Info,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface InboundNavigationProps {
  clinicSlug: string;
  stats?: {
    total: number;
    emergency: number;
    appointment: number;
    callback: number;
    info: number;
  };
}

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  count?: number;
  isActive: boolean;
  variant?: "default" | "emergency" | "appointment" | "callback" | "info";
}

function NavItem({
  href,
  icon: Icon,
  label,
  count,
  isActive,
  variant = "default",
}: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 transition-all duration-150",
        isActive
          ? "bg-teal-50 text-teal-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0",
          isActive
            ? variant === "emergency"
              ? "text-orange-600"
              : variant === "appointment"
                ? "text-emerald-600"
                : variant === "callback"
                  ? "text-amber-600"
                  : variant === "info"
                    ? "text-blue-600"
                    : "text-teal-600"
            : variant === "emergency"
              ? "text-orange-400"
              : variant === "appointment"
                ? "text-emerald-400"
                : variant === "callback"
                  ? "text-amber-400"
                  : variant === "info"
                    ? "text-blue-400"
                    : "text-gray-400 group-hover:text-gray-500",
        )}
        strokeWidth={isActive ? 2 : 1.5}
      />
      <span
        className={cn(
          "flex-1 text-sm",
          isActive ? "font-medium" : "font-normal",
        )}
      >
        {label}
      </span>
      {count !== undefined && (
        <span
          className={cn(
            "min-w-[1.5rem] rounded px-1.5 py-0.5 text-center text-xs tabular-nums",
            isActive
              ? "bg-teal-100 font-medium text-teal-700"
              : "bg-gray-100 text-gray-500",
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

export function InboundNavigation({
  clinicSlug,
  stats,
}: InboundNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const outcomeFilter = searchParams.get("outcome") ?? "all";

  const baseUrl = `/dashboard/${clinicSlug}/inbound`;

  return (
    <nav className="flex flex-col gap-0.5">
      <NavItem
        href={`${baseUrl}?outcome=all`}
        icon={PhoneIncoming}
        label="All Calls"
        count={stats?.total}
        isActive={pathname.startsWith(baseUrl) && outcomeFilter === "all"}
      />
      <NavItem
        href={`${baseUrl}?outcome=appointment`}
        icon={Calendar}
        label="Appointments"
        count={stats?.appointment}
        isActive={
          pathname.startsWith(baseUrl) && outcomeFilter === "appointment"
        }
        variant="appointment"
      />
      <NavItem
        href={`${baseUrl}?outcome=callback`}
        icon={PhoneCall}
        label="Callback"
        count={stats?.callback}
        isActive={pathname.startsWith(baseUrl) && outcomeFilter === "callback"}
        variant="callback"
      />
      <NavItem
        href={`${baseUrl}?outcome=info`}
        icon={Info}
        label="Info"
        count={stats?.info}
        isActive={pathname.startsWith(baseUrl) && outcomeFilter === "info"}
        variant="info"
      />
      <NavItem
        href={`${baseUrl}?outcome=emergency`}
        icon={AlertCircle}
        label="Emergency"
        count={stats?.emergency}
        isActive={pathname.startsWith(baseUrl) && outcomeFilter === "emergency"}
        variant="emergency"
      />
    </nav>
  );
}
