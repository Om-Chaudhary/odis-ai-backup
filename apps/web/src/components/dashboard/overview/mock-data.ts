/**
 * HAPPY TAILS VETERINARY HOSPITAL - Demo Story Data
 *
 * The narrative: A 24/7 emergency vet clinic that's been transformed by ODIS AI.
 * Every data point tells a story designed to inspire "WOW" reactions.
 */

// ═══════════════════════════════════════════════════════════════
// HERO KPIs - The "WOW" Opening Numbers (This Week)
// Story: "In just ONE WEEK, look what ODIS accomplished..."
// ═══════════════════════════════════════════════════════════════

export interface SparklinePoint {
  day: string;
  value: number;
}

export interface HeroMetric {
  value: number;
  change: number;
  sparklineData: SparklinePoint[];
  story: string;
}

export interface HeroMetrics {
  callsHandled: HeroMetric & { weeklyBreakdown: SparklinePoint[] };
  appointmentsBooked: HeroMetric & { revenueGenerated: number };
  revenueCaptured: HeroMetric;
  staffHoursSaved: HeroMetric & { equivalentFTEs: number };
}

// ═══════════════════════════════════════════════════════════════
// AFTER-HOURS TAB TYPES
// ═══════════════════════════════════════════════════════════════

export interface AfterHoursCategory {
  category: string;
  count: number;
  percentage: number;
  color: string;
  icon: string;
  exampleCall: string;
}

export interface HourlyActivity {
  hour: string;
  calls: number;
}

export interface AfterHoursData {
  sectionStory: string;
  totalCalls: number;
  peakHour: string;
  breakdown: AfterHoursCategory[];
  autonomyRate: number;
  autonomyStory: string;
  hourlyActivity: HourlyActivity[];
}

// ═══════════════════════════════════════════════════════════════
// DISCHARGE TAB TYPES
// ═══════════════════════════════════════════════════════════════

export interface DischargeOutcome {
  status: string;
  count: number;
  color: string;
  icon: string;
  urgency: string;
  story?: string;
  examples?: string[];
}

export interface WeeklyTrendDay {
  day: string;
  critical: number;
  voicemail: number;
  recheck: number;
  clear: number;
}

export interface DischargeData {
  sectionStory: string;
  thisWeek: {
    totalPatients: number;
    period: string;
  };
  reachRate: {
    reached: number;
    total: number;
    percentage: number;
    story: string;
  };
  complianceRate: {
    compliant: number;
    reached: number;
    percentage: number;
    story: string;
  };
  outcomes: DischargeOutcome[];
  weeklyTrend: WeeklyTrendDay[];
}

// ═══════════════════════════════════════════════════════════════
// AI PERFORMANCE TAB TYPES
// ═══════════════════════════════════════════════════════════════

export interface PerformanceComparison {
  metric: string;
  aiValue: string;
  aiSeconds?: number;
  aiPercent?: number;
  staffValue: string;
  staffSeconds?: number;
  staffPercent?: number;
  improvement: string;
  improvementType: "speed" | "instant" | "accuracy";
  visualType: string;
  story: string;
}

export interface ImprovementTrendWeek {
  week: string;
  resolution: number;
  handleTime: number;
}

export interface AIPerformanceData {
  sectionStory: string;
  comparisons: PerformanceComparison[];
  autonomyBanner: {
    percentage: number;
    message: string;
    subtext: string;
  };
  improvementTrend: ImprovementTrendWeek[];
}

// ═══════════════════════════════════════════════════════════════
// LIVE ACTIVITY TYPES
// ═══════════════════════════════════════════════════════════════

export interface LiveActivityItem {
  id: string;
  type: string;
  icon: string;
  color: string;
  petName: string;
  ownerName: string;
  summary: string;
  timestamp: string;
  status: string;
  statusColor: string;
}

// ═══════════════════════════════════════════════════════════════
// NEEDS REVIEW TYPES
// ═══════════════════════════════════════════════════════════════

export interface NeedsReviewItem {
  id: string;
  severity: "critical" | "pending";
  petName: string;
  ownerName: string;
  summary: string;
  action: string;
}

// ═══════════════════════════════════════════════════════════════
// FULL DEMO DATA STRUCTURE
// ═══════════════════════════════════════════════════════════════

export interface HappyTailsStory {
  clinic: {
    name: string;
    email: string;
    tagline: string;
    slug: string;
  };
  heroMetrics: HeroMetrics;
  afterHours: AfterHoursData;
  discharge: DischargeData;
  aiPerformance: AIPerformanceData;
  liveActivity: LiveActivityItem[];
  needsReview: NeedsReviewItem[];
}

export const HAPPY_TAILS_STORY: HappyTailsStory = {
  clinic: {
    name: "Happy Tails Veterinary Hospital",
    email: "happytails@odisai.net",
    tagline: "24/7 Emergency & Specialty Care",
    slug: "happy-tails",
  },

  // ═══════════════════════════════════════════════════════════════
  // HERO KPIs - Realistic numbers for a single clinic (This Month)
  // ═══════════════════════════════════════════════════════════════
  heroMetrics: {
    callsHandled: {
      value: 187,
      change: 12,
      sparklineData: [
        { day: "Mon", value: 8 },
        { day: "Tue", value: 11 },
        { day: "Wed", value: 9 },
        { day: "Thu", value: 12 },
        { day: "Fri", value: 14 },
        { day: "Sat", value: 18 },
        { day: "Sun", value: 16 },
      ],
      weeklyBreakdown: [
        { day: "Mon", value: 8 },
        { day: "Tue", value: 11 },
        { day: "Wed", value: 9 },
        { day: "Thu", value: 12 },
        { day: "Fri", value: 14 },
        { day: "Sat", value: 18 },
        { day: "Sun", value: 16 },
      ],
      story: "Every call answered. Zero missed.",
    },
    appointmentsBooked: {
      value: 64,
      change: 18,
      sparklineData: [
        { day: "Mon", value: 3 },
        { day: "Tue", value: 4 },
        { day: "Wed", value: 3 },
        { day: "Thu", value: 5 },
        { day: "Fri", value: 6 },
        { day: "Sat", value: 4 },
        { day: "Sun", value: 5 },
      ],
      revenueGenerated: 9600,
      story: "Booked BY the AI, not just transferred",
    },
    revenueCaptured: {
      value: 9600,
      change: 24,
      sparklineData: [
        { day: "Mon", value: 450 },
        { day: "Tue", value: 600 },
        { day: "Wed", value: 450 },
        { day: "Thu", value: 750 },
        { day: "Fri", value: 900 },
        { day: "Sat", value: 600 },
        { day: "Sun", value: 750 },
      ],
      story: "Revenue that would have been lost after hours",
    },
    staffHoursSaved: {
      value: 38,
      change: 15,
      sparklineData: [
        { day: "Mon", value: 4 },
        { day: "Tue", value: 5 },
        { day: "Wed", value: 4 },
        { day: "Thu", value: 6 },
        { day: "Fri", value: 7 },
        { day: "Sat", value: 6 },
        { day: "Sun", value: 6 },
      ],
      equivalentFTEs: 0.9,
      story: "Time your staff got back for patient care",
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // AFTER-HOURS TAB - The "2 AM Guardian" Story
  // ═══════════════════════════════════════════════════════════════
  afterHours: {
    sectionStory:
      "Last night at 2:47 AM, a worried pet owner called about their dog Bella who wasn't breathing right. ODIS triaged the emergency, confirmed symptoms, and had them en route to the ER in under 3 minutes.",
    totalCalls: 87,
    peakHour: "11 PM - 1 AM",
    breakdown: [
      {
        category: "Appointments Booked",
        count: 34,
        percentage: 39,
        color: "#10b981",
        icon: "Calendar",
        exampleCall: "Scheduled Luna's dental cleaning for Tuesday",
      },
      {
        category: "Callbacks Scheduled",
        count: 28,
        percentage: 32,
        color: "#f59e0b",
        icon: "PhoneCallback",
        exampleCall: "Owner wants to discuss lab results with Dr. Chen",
      },
      {
        category: "Info Provided",
        count: 22,
        percentage: 25,
        color: "#3b82f6",
        icon: "Info",
        exampleCall: "Answered questions about post-surgery care",
      },
      {
        category: "ER Triage",
        count: 3,
        percentage: 4,
        color: "#ef4444",
        icon: "AlertTriangle",
        exampleCall: "Directed Bella's emergency to the nearest ER",
      },
    ],
    autonomyRate: 94.2,
    autonomyStory: "Only 5.8% of calls needed staff follow-up",
    hourlyActivity: [
      { hour: "6 PM", calls: 6 },
      { hour: "7 PM", calls: 8 },
      { hour: "8 PM", calls: 10 },
      { hour: "9 PM", calls: 9 },
      { hour: "10 PM", calls: 11 },
      { hour: "11 PM", calls: 12 },
      { hour: "12 AM", calls: 9 },
      { hour: "1 AM", calls: 7 },
      { hour: "2 AM", calls: 5 },
      { hour: "3 AM", calls: 3 },
      { hour: "4 AM", calls: 2 },
      { hour: "5 AM", calls: 2 },
      { hour: "6 AM", calls: 4 },
      { hour: "7 AM", calls: 6 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // DISCHARGE TAB - The "No Patient Left Behind" Story
  // ═══════════════════════════════════════════════════════════════
  discharge: {
    sectionStory:
      "Yesterday, ODIS called Mrs. Rodriguez about Max's surgery recovery. Max wasn't eating, and ODIS detected the concern, flagged it critical, and the vet team called back within 15 minutes.",
    thisWeek: {
      totalPatients: 64,
      period: "This week",
    },
    reachRate: {
      reached: 51,
      total: 64,
      percentage: 80,
      story: "51 out of 64 patients reached by phone",
    },
    complianceRate: {
      compliant: 47,
      reached: 51,
      percentage: 92,
      story: "92% confirmed they're following medication instructions",
    },
    outcomes: [
      {
        status: "Critical Flags",
        count: 2,
        color: "#ef4444",
        icon: "AlertCircle",
        urgency: "immediate",
        examples: [
          "Salie - Emergency signs detected",
          "Amy - Worsening symptoms post-surgery",
        ],
      },
      {
        status: "Voicemails",
        count: 8,
        color: "#f59e0b",
        icon: "Voicemail",
        urgency: "today",
        story: "Left detailed follow-up messages",
      },
      {
        status: "Rechecks Booked",
        count: 3,
        color: "#10b981",
        icon: "CalendarCheck",
        urgency: "scheduled",
        story: "Proactively scheduled follow-up visits",
      },
      {
        status: "All Clear",
        count: 41,
        color: "#14b8a6",
        icon: "CheckCircle",
        urgency: "resolved",
        story: "Recovering well, no concerns",
      },
    ],
    weeklyTrend: [
      { day: "Mon", critical: 1, voicemail: 2, recheck: 0, clear: 8 },
      { day: "Tue", critical: 0, voicemail: 1, recheck: 1, clear: 10 },
      { day: "Wed", critical: 1, voicemail: 2, recheck: 0, clear: 6 },
      { day: "Thu", critical: 0, voicemail: 1, recheck: 1, clear: 9 },
      { day: "Fri", critical: 0, voicemail: 1, recheck: 1, clear: 5 },
      { day: "Sat", critical: 0, voicemail: 0, recheck: 0, clear: 2 },
      { day: "Sun", critical: 0, voicemail: 1, recheck: 0, clear: 1 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // AI PERFORMANCE TAB - The "Superhuman" Story
  // ═══════════════════════════════════════════════════════════════
  aiPerformance: {
    sectionStory:
      "Your staff is amazing at patient care. ODIS handles the phone so they can focus on what matters.",
    comparisons: [
      {
        metric: "Avg Handle Time",
        aiValue: "1m 34s",
        aiSeconds: 94,
        staffValue: "4m 12s",
        staffSeconds: 252,
        improvement: "62% faster",
        improvementType: "speed",
        visualType: "bar-comparison",
        story: "Calls resolved in under 2 minutes",
      },
      {
        metric: "Avg Caller Wait",
        aiValue: "0 sec",
        aiSeconds: 0,
        staffValue: "3+ min",
        staffSeconds: 180,
        improvement: "Instant",
        improvementType: "instant",
        visualType: "dramatic-zero",
        story: "Zero hold time. Ever.",
      },
      {
        metric: "Calls Completed",
        aiValue: "181",
        aiPercent: 97,
        staffValue: "N/A",
        staffPercent: 0,
        improvement: "97% success",
        improvementType: "accuracy",
        visualType: "gauge-comparison",
        story: "Successfully completed without drops",
      },
    ],
    autonomyBanner: {
      percentage: 96.8,
      message: "AI handling calls end-to-end",
      subtext: "No staff intervention needed",
    },
    improvementTrend: [
      { week: "Week 1", resolution: 78, handleTime: 180 },
      { week: "Week 2", resolution: 84, handleTime: 145 },
      { week: "Week 3", resolution: 89, handleTime: 120 },
      { week: "Week 4", resolution: 92, handleTime: 102 },
      { week: "This Week", resolution: 97, handleTime: 94 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // LIVE ACTIVITY - The "Right Now" Story
  // ═══════════════════════════════════════════════════════════════
  liveActivity: [
    {
      id: "act-1",
      type: "appointment_rescheduled",
      icon: "Calendar",
      color: "#3b82f6",
      petName: "Mafi",
      ownerName: "Jose Avila",
      summary: "moved 3:30 PM → 2:30 PM today",
      timestamp: "2 min ago",
      status: "Scheduled",
      statusColor: "#10b981",
    },
    {
      id: "act-2",
      type: "emergency_flagged",
      icon: "AlertTriangle",
      color: "#ef4444",
      petName: "Salie",
      ownerName: "Doreen Hardin",
      summary: "Bleeding, unresponsive, suspected seizure → ER referral sent",
      timestamp: "14 min ago",
      status: "Critical",
      statusColor: "#ef4444",
    },
    {
      id: "act-3",
      type: "followup_complete",
      icon: "CheckCircle",
      color: "#10b981",
      petName: "Luna",
      ownerName: "Sarah Mitchell",
      summary: "Post-op recovery on track. Medication compliance confirmed.",
      timestamp: "22 min ago",
      status: "Resolved",
      statusColor: "#10b981",
    },
    {
      id: "act-4",
      type: "callback_requested",
      icon: "Phone",
      color: "#f59e0b",
      petName: "Buddy",
      ownerName: "Lisette Duarte",
      summary: "Needs to discuss lab results with Dr. Chen",
      timestamp: "35 min ago",
      status: "Pending",
      statusColor: "#f59e0b",
    },
    {
      id: "act-5",
      type: "voicemail_left",
      icon: "Voicemail",
      color: "#6b7280",
      petName: "RJ",
      ownerName: "Mike Thompson",
      summary: "Routine check-in. Left voicemail + sent email.",
      timestamp: "1h ago",
      status: "Delivered",
      statusColor: "#6b7280",
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // NEEDS REVIEW - The "Human Touch" Story
  // ═══════════════════════════════════════════════════════════════
  needsReview: [
    {
      id: "review-1",
      severity: "critical",
      petName: "Salie",
      ownerName: "Doreen Hardin",
      summary: "Emergency signs detected during follow-up call",
      action: "Immediate veterinary intervention required",
    },
    {
      id: "review-2",
      severity: "critical",
      petName: "Amy",
      ownerName: "Miguel Rivas",
      summary: "Owner reports worsening symptoms post-surgery",
      action: "Schedule urgent recheck",
    },
    {
      id: "review-3",
      severity: "pending",
      petName: "Buddy",
      ownerName: "Lisette Duarte",
      summary: "Requested callback about lab results",
      action: "Staff callback needed",
    },
  ],
};

/**
 * Check if a clinic is in demo mode
 */
export function isDemoClinic(clinicSlug?: string, clinicEmail?: string): boolean {
  if (!clinicSlug && !clinicEmail) return false;
  return (
    clinicSlug === "happy-tails" ||
    clinicSlug === "happy-tails-veterinary-clinic" ||
    clinicEmail === "happytails@odisai.net"
  );
}
