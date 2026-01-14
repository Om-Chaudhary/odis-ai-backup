import {
  DashboardPageHeader,
  DashboardToolbar,
} from "~/components/dashboard/shared";
import { PageContainer, PageContent } from "~/components/dashboard/layout";
import { Activity } from "lucide-react";

export default function ActivityPage() {
  return (
    <PageContainer>
      <DashboardPageHeader
        title="Activity Log"
        subtitle="System-wide events and audit trail"
        icon={Activity}
      >
        <DashboardToolbar
          showDateNav={true}
          currentDate={new Date()}
          isDateLoading={false}
          className="w-full"
        />
      </DashboardPageHeader>

      <PageContent>
        <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
          <div className="mb-4 rounded-full bg-slate-100 p-4">
            <Activity className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Activity Log</h3>
          <p className="max-w-sm text-sm">
            This page will show a chronological feed of all system activities,
            updates, and user actions.
          </p>
        </div>
      </PageContent>
    </PageContainer>
  );
}
