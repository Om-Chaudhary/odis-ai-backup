import { PhoneOutgoing, List, UserX, AlertCircle } from "lucide-react";
import {
  DashboardPageHeader,
  DashboardToolbar,
} from "~/components/dashboard/shared";
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
  const viewOptions = [
    { value: "all", label: "All", icon: List, count: stats?.total ?? 0 },
    {
      value: "needs_review",
      label: "Missing Info",
      icon: UserX,
      count: stats?.pendingReview ?? 0,
    },
    {
      value: "needs_attention",
      label: "Needs Attention",
      icon: AlertCircle,
      count: stats?.needsAttention ?? 0,
    },
  ];

  return (
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
        viewOptions={viewOptions}
        currentView={viewMode}
        onViewChange={onViewChange}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search..."
        isLoading={isLoading}
      />
    </DashboardPageHeader>
  );
}
