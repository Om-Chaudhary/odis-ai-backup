/**
 * Types for the Overview Dashboard
 */

export type DateRangeOption = 7 | 14 | 30;

export interface OverviewPeriod {
  startDate: string;
  endDate: string;
  days: number;
}

export interface OverviewStatus {
  allClear: boolean;
  hasUrgentItems: boolean;
  urgentCount: number;
  criticalCount: number;
  totalFlagged: number;
  inProgressCalls: number;
}

export interface OverviewValue {
  callsAnswered: number;
  appointmentsBooked: number;
  messagesCapured: number;
  avgCallDuration: number;
}

export interface OverviewStats {
  calls: {
    total: number;
    completed: number;
    inProgress: number;
    failed: number;
  };
  appointments: {
    total: number;
    confirmed: number;
    pending: number;
  };
  messages: {
    total: number;
    new: number;
    urgent: number;
  };
}

export interface FlaggedItem {
  id: string;
  petName: string;
  ownerName: string;
  severity: string | null;
  summary: string;
  types: string[];
  createdAt: string | null;
}

export interface OverviewData {
  period: OverviewPeriod;
  status: OverviewStatus;
  value: OverviewValue;
  stats: OverviewStats;
  flaggedItems: FlaggedItem[];
  totalFlaggedCount: number;
}
