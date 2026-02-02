"use client";

import { useRouter } from "next/navigation";
import { KPICardsRow } from "./components/kpi-cards";
import { OverviewTabs } from "./components/tabs";
import { MorningReview } from "./components/morning-review";
import type { HappyTailsStory, LiveActivityItem } from "./mock-data";

interface OverviewDemoProps {
  data: HappyTailsStory;
  clinicSlug: string;
}

/**
 * Get the appropriate route for an activity item based on its type
 */
function getActivityRoute(activity: LiveActivityItem, clinicSlug: string): string {
  const base = `/dashboard/${clinicSlug}`;

  switch (activity.type) {
    case "appointment_rescheduled":
      return `${base}/inbound?outcome=appointment`;
    case "emergency_flagged":
      return `${base}/inbound?outcome=emergency`;
    case "followup_complete":
    case "voicemail_left":
      return `${base}/outbound?view=all`;
    case "callback_requested":
      return `${base}/inbound?outcome=callback`;
    default:
      return `${base}/inbound?outcome=all`;
  }
}

export function OverviewDemo({ data, clinicSlug }: OverviewDemoProps) {
  const router = useRouter();

  const handleActivityClick = (id: string) => {
    const activity = data.liveActivity.find((a) => a.id === id);
    if (activity) {
      router.push(getActivityRoute(activity, clinicSlug));
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="space-y-6 p-6">
        {/* Global CSS for animations */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          .pulse-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #0d9488;
            animation: pulse 2s ease-in-out infinite;
          }

          .metric-card {
            transition: all 0.25s ease;
          }

          .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.08) !important;
          }
        `}</style>

        {/* KPI Cards */}
        <KPICardsRow metrics={data.heroMetrics} clinicSlug={clinicSlug} />

        {/* Tabs Section */}
        <OverviewTabs
          afterHours={data.afterHours}
          discharge={data.discharge}
          aiPerformance={data.aiPerformance}
          clinicSlug={clinicSlug}
        />

        {/* Morning Review Section */}
        <div className="pt-2">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-800">
              Morning Review
            </h2>
            <span className="text-sm text-slate-400">
              Items requiring staff attention
            </span>
          </div>
          <MorningReview
            activities={data.liveActivity}
            reviewItems={data.needsReview}
            clinicSlug={clinicSlug}
            onActivityClick={handleActivityClick}
          />
        </div>
      </div>
    </div>
  );
}
