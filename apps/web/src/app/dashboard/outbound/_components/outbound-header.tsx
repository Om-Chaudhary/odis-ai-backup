import { PhoneOutgoing, List, AlertCircle } from "lucide-react";
import {
  DashboardPageHeader,
  DashboardToolbar,
} from "~/components/dashboard/shared";
import { cn } from "@odis-ai/shared/util";
import { Badge } from "@odis-ai/shared/ui/badge";
import type { ViewMode } from "~/server/api/routers/outbound";

export interface OutboundHeaderProps {
  viewMode: ViewMode;
  onViewChange: (view: string) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  stats?: {
    total: number;
    pendingReview: number;
    needsAttention: number;
  } | null;
  showDateNav?: boolean;
}

export function OutboundHeader({
  viewMode,
  onViewChange,
  currentDate,
  onDateChange,
  isLoading,
  searchTerm,
  onSearchChange,
  stats,
  showDateNav = true,
}: OutboundHeaderProps) {
  const tabOptions = [
    { value: "all", label: "All calls", icon: List, count: stats?.total ?? 0 },
    {
      value: "needs_attention",
      label: "Needs Attention",
      icon: AlertCircle,
      count: stats?.needsAttention ?? 0,
    },
  ];

  return (
    <>
      {/* Tabs above header */}
      <div className="flex items-center gap-2 bg-white px-4">
        {tabOptions.map((option) => {
          const isActive = viewMode === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => onViewChange(option.value)}
              disabled={isLoading}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-teal-700 after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-teal-500"
                  : "text-slate-600 hover:bg-teal-50/50 hover:text-slate-800",
                isLoading && "cursor-not-allowed opacity-50",
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{option.label}</span>
              {option.count !== undefined && (
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className={cn(
                    "ml-1 px-1.5 py-0 text-xs",
                    isActive && "bg-teal-500 text-white",
                  )}
                >
                  {option.count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Header */}
      <DashboardPageHeader
        title="Discharge Communications"
        subtitle="Manage discharge calls and email communications"
        icon={PhoneOutgoing}
      >
        <DashboardToolbar
          showDateNav={showDateNav}
          currentDate={currentDate}
          onDateChange={onDateChange}
          isDateLoading={isLoading}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search..."
          isLoading={isLoading}
        />
      </DashboardPageHeader>
    </>
  );
}
