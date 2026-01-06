import { PhoneOutgoing, List, AlertCircle } from "lucide-react";
import {
  DashboardPageHeader,
  DashboardToolbar,
} from "~/components/dashboard/shared";
import { cn } from "@odis-ai/shared/util";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@odis-ai/shared/ui/tabs";
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
      <div className="px-4 pt-2 pb-1">
        <Tabs value={viewMode} onValueChange={onViewChange} className="w-fit">
          <TabsList className="h-10 gap-2 border-0 bg-transparent p-0">
            {tabOptions.map((option) => {
              const isActive = viewMode === option.value;
              const Icon = option.icon;
              return (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  disabled={isLoading}
                  className={cn(
                    "gap-2",
                    "data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700",
                    "data-[state=active]:border data-[state=active]:border-teal-200",
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{option.label}</span>
                  {option.count !== undefined && (
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className={cn(
                        "ml-1 px-1.5 py-0 text-xs",
                        isActive && "bg-teal-500 text-white hover:bg-teal-600",
                      )}
                    >
                      {option.count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
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
