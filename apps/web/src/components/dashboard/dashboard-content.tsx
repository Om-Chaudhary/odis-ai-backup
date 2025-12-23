"use client";

import { OverviewTab } from "./shared/overview-tab";
import { CriticalActionsAlert } from "./widgets/critical-actions-alert";
import { OutboundSuccessMetrics } from "./widgets/outbound-success-metrics";
import { FailedCallsTracker } from "./widgets/failed-calls-tracker";
import { VoicemailFollowUpQueue } from "./widgets/voicemail-follow-up-queue";

export function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Critical Actions - Always at top */}
      <CriticalActionsAlert />

      {/* Today's Outbound Success Metrics */}
      <OutboundSuccessMetrics />

      {/* Main Overview */}
      <OverviewTab />

      {/* Failed Calls Tracker */}
      <FailedCallsTracker />

      {/* Voicemail Follow-Up Queue */}
      <VoicemailFollowUpQueue />
    </div>
  );
}
