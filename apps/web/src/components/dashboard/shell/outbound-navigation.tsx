"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { PhoneOutgoing, AlertTriangle } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface OutboundNavigationProps {
  clinicSlug: string;
  stats?: {
    total: number;
    needsAttention: number;
  };
}

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  count?: number;
  isActive: boolean;
  variant?: "default" | "warning";
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
            ? variant === "warning"
              ? "text-amber-500"
              : "text-teal-600"
            : variant === "warning"
              ? "text-amber-400"
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

export function OutboundNavigation({
  clinicSlug,
  stats,
}: OutboundNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const viewMode = searchParams.get("view") ?? "all";

  const baseUrl = `/dashboard/${clinicSlug}/outbound`;

  return (
    <nav className="flex flex-col gap-0.5">
      <NavItem
        href={`${baseUrl}?view=all`}
        icon={PhoneOutgoing}
        label="All Calls"
        count={stats?.total}
        isActive={pathname.startsWith(baseUrl) && viewMode === "all"}
      />
      <NavItem
        href={`${baseUrl}?view=needs_attention`}
        icon={AlertTriangle}
        label="Needs Attention"
        count={stats?.needsAttention}
        isActive={
          pathname.startsWith(baseUrl) && viewMode === "needs_attention"
        }
        variant="warning"
      />
    </nav>
  );
}
