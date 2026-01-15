/**
 * Types for the Overview Dashboard
 */

export type DateRangeOption = 7 | 14 | 30;

export type SystemHealthStatus = "healthy" | "warning" | "error";

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

export interface SystemHealth {
  status: SystemHealthStatus;
  lastActivity: string | null;
  totalCriticalActions: number;
  failedCallsCount: number;
  voicemailsNeedingAction: number;
}

export interface TodayActivity {
  callsHandled: number;
  appointmentsBooked: number;
  messagesCaptured: number;
}

export interface OverviewValue {
  callsAnswered: number;
  appointmentsBooked: number;
  messagesCapured: number;
  avgCallDuration: number;
  // ROI metrics
  timeSavedMinutes: number;
  timeSavedHours: number;
  costSaved: number;
}

export interface OutboundPerformance {
  total: number;
  completed: number;
  failed: number;
  queued: number;
  voicemails: number;
  successRate: number;
}

export interface CaseCoverage {
  totalCases: number;
  casesWithDischarge: number;
  casesWithSoap: number;
  dischargeCoveragePct: number;
  soapCoveragePct: number;
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
  systemHealth: SystemHealth;
  todayActivity: TodayActivity;
  value: OverviewValue;
  outboundPerformance: OutboundPerformance;
  caseCoverage: CaseCoverage;
  stats: OverviewStats;
  flaggedItems: FlaggedItem[];
  totalFlaggedCount: number;
}
